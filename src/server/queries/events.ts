import { DEMO_EVENTS } from '../demo/data';
import { callRpc, db, isDemoMode, safe } from './client';
import type { EventListRow, Result } from '@/lib/types';

export interface EventFilters {
  periodDays: number;
  severities: number[];
  category?: string;
  agent?: string;
  sourceCode?: string;
  entityId?: number;
  status?: 'notified' | 'in_digest' | 'new';
  query?: string;
  sort?: string;
  page: number;
  pageSize: number;
}

export interface EventPage {
  rows: EventListRow[];
  total: number;
}

const SORTABLE: Record<string, { column: string; ascending: boolean }> = {
  importance: { column: 'importance', ascending: true },
  '-importance': { column: 'importance', ascending: false },
  date: { column: 'event_date', ascending: true },
  '-date': { column: 'event_date', ascending: false },
  category: { column: 'category', ascending: true },
  '-category': { column: 'category', ascending: false },
};

/**
 * Порядок по умолчанию — важность по убыванию, затем дата по убыванию.
 * Это требование документа: сортировка только по дате прячет критичное
 * событие вчерашнего дня под фоновой новостью сегодняшнего.
 */
export async function fetchEvents(filters: EventFilters): Promise<Result<EventPage>> {
  if (isDemoMode()) {
    return safe(async () => applyDemoFilters(filters));
  }

  return safe(async () => {
    const supabase = await db();
    const since = new Date(Date.now() - filters.periodDays * 86_400_000).toISOString();

    let query = supabase
      .from('v_event_list')
      .select(
        'event_id, agent, category, importance, sentiment, title, summary, rationale, brief, product_focus, product_groups, company_focus, entity_names, source_name, source_kind, source_code, link, event_date, created_at, is_notified, in_digest, entity_ids, entity_types',
        { count: 'exact' },
      )
      .gte('created_at', since);

    if (filters.severities.length > 0) query = query.in('importance', filters.severities);
    if (filters.category) query = query.eq('category', filters.category);
    if (filters.agent) query = query.eq('agent', filters.agent);
    if (filters.sourceCode) query = query.eq('source_code', filters.sourceCode);
    if (filters.entityId) query = query.contains('entity_ids', [filters.entityId]);
    if (filters.status === 'notified') query = query.eq('is_notified', true);
    if (filters.status === 'in_digest') query = query.eq('in_digest', true);
    if (filters.status === 'new') query = query.eq('is_notified', false).eq('in_digest', false);
    if (filters.query && filters.query.trim().length >= 2) {
      query = query.like('haystack', `%${filters.query.trim().toLowerCase()}%`);
    }

    const primary = filters.sort ? SORTABLE[filters.sort] : undefined;
    if (primary) {
      query = query.order(primary.column, { ascending: primary.ascending, nullsFirst: false });
      if (primary.column !== 'event_date') {
        query = query.order('event_date', { ascending: false, nullsFirst: false });
      }
    } else {
      query = query
        .order('importance', { ascending: false, nullsFirst: false })
        .order('event_date', { ascending: false, nullsFirst: false });
    }

    const from = (filters.page - 1) * filters.pageSize;
    const { data, error, count } = await query.range(from, from + filters.pageSize - 1);
    if (error) throw new Error(error.message);

    return { rows: (data ?? []) as EventListRow[], total: count ?? 0 };
  });
}

export async function fetchEventById(id: number): Promise<Result<EventListRow | null>> {
  if (isDemoMode()) {
    return safe(async () => DEMO_EVENTS.find((e) => e.event_id === id) ?? null);
  }
  return safe(async () => {
    const supabase = await db();
    const { data, error } = await supabase.from('v_event_list').select('*').eq('event_id', id).maybeSingle();
    if (error) throw new Error(error.message);
    return (data as EventListRow | null) ?? null;
  });
}

/** События, связанные с тем же брендом или конкурентом. */
export async function fetchRelatedEvents(entityIds: number[], excludeId: number, limit = 6): Promise<Result<EventListRow[]>> {
  if (entityIds.length === 0) return { ok: true, data: [] };
  if (isDemoMode()) {
    return safe(async () =>
      DEMO_EVENTS.filter((e) => e.event_id !== excludeId && e.entity_ids.some((id) => entityIds.includes(id))).slice(
        0,
        limit,
      ),
    );
  }
  return safe(async () => {
    const supabase = await db();
    const { data, error } = await supabase
      .from('v_event_list')
      .select('*')
      .overlaps('entity_ids', entityIds)
      .neq('event_id', excludeId)
      .order('importance', { ascending: false })
      .order('event_date', { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    return (data ?? []) as EventListRow[];
  });
}

/** Значения для выпадающих списков фильтра. Берутся из данных, а не из кода. */
export async function fetchEventFilterOptions(): Promise<
  Result<{ categories: string[]; sources: Array<{ code: string; name: string }> }>
> {
  if (isDemoMode()) {
    return safe(async () => ({
      categories: Array.from(new Set(DEMO_EVENTS.map((e) => e.category))).sort(),
      sources: Array.from(new Set(DEMO_EVENTS.map((e) => e.source_code).filter(Boolean) as string[])).map((code) => ({
        code,
        name: DEMO_EVENTS.find((e) => e.source_code === code)?.source_name ?? code,
      })),
    }));
  }
  return safe(async () => {
    const supabase = await db();
    const [cats, sources] = await Promise.all([
      supabase.from('events').select('category').limit(2000),
      supabase.from('sources').select('code, name').order('name'),
    ]);
    if (cats.error) throw new Error(cats.error.message);
    if (sources.error) throw new Error(sources.error.message);
    const categories = Array.from(new Set((cats.data ?? []).map((r) => r.category as string))).sort((a, b) =>
      a.localeCompare(b, 'ru'),
    );
    return {
      categories,
      sources: (sources.data ?? []) as Array<{ code: string; name: string }>,
    };
  });
}

export async function searchAll(query: string, limit = 6) {
  if (isDemoMode()) {
    const needle = query.toLowerCase();
    return DEMO_EVENTS.filter((e) => e.title.toLowerCase().includes(needle)).map((e) => ({
      kind: 'event' as const,
      id: String(e.event_id),
      title: e.title,
      subtitle: e.product_focus ?? e.company_focus ?? e.category,
      badge: `${e.importance}/5`,
      href: `/events/${e.event_id}`,
    }));
  }
  return callRpc('app_search', { p_query: query, p_limit: limit });
}

function applyDemoFilters(filters: EventFilters): EventPage {
  let rows = [...DEMO_EVENTS];
  const since = Date.now() - filters.periodDays * 86_400_000;
  rows = rows.filter((r) => new Date(r.created_at).getTime() >= since);
  if (filters.severities.length > 0) rows = rows.filter((r) => filters.severities.includes(r.importance));
  if (filters.category) rows = rows.filter((r) => r.category === filters.category);
  if (filters.agent) rows = rows.filter((r) => r.agent === filters.agent);
  if (filters.sourceCode) rows = rows.filter((r) => r.source_code === filters.sourceCode);
  if (filters.entityId) rows = rows.filter((r) => r.entity_ids.includes(filters.entityId as number));
  if (filters.status === 'notified') rows = rows.filter((r) => r.is_notified);
  if (filters.status === 'in_digest') rows = rows.filter((r) => r.in_digest);
  if (filters.status === 'new') rows = rows.filter((r) => !r.is_notified && !r.in_digest);
  if (filters.query && filters.query.trim().length >= 2) {
    const needle = filters.query.trim().toLowerCase();
    rows = rows.filter(
      (r) =>
        r.title.toLowerCase().includes(needle) ||
        (r.summary ?? '').toLowerCase().includes(needle) ||
        (r.entity_names ?? '').toLowerCase().includes(needle),
    );
  }

  rows.sort((a, b) => {
    if (filters.sort === 'date') return a.event_date.localeCompare(b.event_date);
    if (filters.sort === '-date') return b.event_date.localeCompare(a.event_date);
    if (filters.sort === 'importance') return a.importance - b.importance || b.event_date.localeCompare(a.event_date);
    return b.importance - a.importance || b.event_date.localeCompare(a.event_date);
  });

  const from = (filters.page - 1) * filters.pageSize;
  return { rows: rows.slice(from, from + filters.pageSize), total: rows.length };
}
