import { DEMO_STOP_WORDS, DEMO_TENDERS } from '../demo/data';
import { callRpc, db, isDemoMode, safe } from './client';
import type { Result, StopWordRow, TenderCardRow, TenderUrgency } from '@/lib/types';

export interface TenderFilters {
  urgency?: TenderUrgency | 'all';
  onlyOpen?: boolean;
  onlyRelevant?: boolean;
  query?: string;
  minAmount?: number;
  sort?: string;
  page: number;
  pageSize: number;
}

export interface TenderPage {
  rows: TenderCardRow[];
  total: number;
}

const SORTABLE: Record<string, { column: string; ascending: boolean }> = {
  deadline: { column: 'apply_to', ascending: true },
  '-deadline': { column: 'apply_to', ascending: false },
  amount: { column: 'amount', ascending: true },
  '-amount': { column: 'amount', ascending: false },
  importance: { column: 'importance', ascending: true },
  '-importance': { column: 'importance', ascending: false },
};

/**
 * Порядок по умолчанию — срок закрытия приёма заявок по возрастанию: самые
 * срочные сверху. Сортировка по сумме здесь никогда не является основной,
 * потому что опоздание стоит дороже, чем пропущенный крупный лот.
 */
export async function fetchTenders(filters: TenderFilters): Promise<Result<TenderPage>> {
  if (isDemoMode()) return safe(async () => applyDemo(filters));

  return safe(async () => {
    const supabase = await db();
    let query = supabase.from('v_tender_card').select('*', { count: 'exact' });

    if (filters.onlyRelevant !== false) query = query.eq('is_relevant', true);
    if (filters.onlyOpen !== false) query = query.or(`apply_to.is.null,apply_to.gt.${new Date().toISOString()}`);
    if (filters.urgency && filters.urgency !== 'all') query = query.eq('urgency', filters.urgency);
    if (filters.minAmount) query = query.gte('amount', filters.minAmount);
    if (filters.query && filters.query.trim().length >= 2) {
      query = query.like('haystack', `%${filters.query.trim().toLowerCase()}%`);
    }

    const primary = filters.sort ? SORTABLE[filters.sort] : undefined;
    if (primary) {
      query = query.order(primary.column, { ascending: primary.ascending, nullsFirst: false });
    } else {
      query = query.order('apply_to', { ascending: true, nullsFirst: false }).order('importance', { ascending: false });
    }

    const from = (filters.page - 1) * filters.pageSize;
    const { data, error, count } = await query.range(from, from + filters.pageSize - 1);
    if (error) throw new Error(error.message);
    return { rows: (data ?? []) as TenderCardRow[], total: count ?? 0 };
  });
}

export async function fetchTenderById(id: number): Promise<Result<TenderCardRow | null>> {
  if (isDemoMode()) return safe(async () => DEMO_TENDERS.find((t) => t.tender_id === id) ?? null);
  return safe(async () => {
    const supabase = await db();
    const { data, error } = await supabase.from('v_tender_card').select('*').eq('tender_id', id).maybeSingle();
    if (error) throw new Error(error.message);
    return (data as TenderCardRow | null) ?? null;
  });
}

export interface TenderKpi {
  open: number;
  found_total: number;
  potential_amount: number;
  closing_24h: number;
  closing_72h: number;
}

export async function fetchTenderKpi(): Promise<Result<TenderKpi>> {
  if (isDemoMode()) {
    return safe(async () => ({
      open: DEMO_TENDERS.length,
      found_total: 638,
      potential_amount: DEMO_TENDERS.reduce((sum, t) => sum + (t.amount ?? 0), 0),
      closing_24h: DEMO_TENDERS.filter((t) => t.urgency === 'critical').length,
      closing_72h: DEMO_TENDERS.filter((t) => t.urgency === 'warning').length,
    }));
  }

  return safe(async () => {
    const supabase = await db();
    const nowIso = new Date().toISOString();
    const in24 = new Date(Date.now() + 86_400_000).toISOString();
    const in72 = new Date(Date.now() + 3 * 86_400_000).toISOString();

    const [open, total, amounts, c24, c72] = await Promise.all([
      supabase
        .from('v_tender_card')
        .select('tender_id', { count: 'exact', head: true })
        .eq('is_relevant', true)
        .or(`apply_to.is.null,apply_to.gt.${nowIso}`),
      supabase.from('v_tender_card').select('tender_id', { count: 'exact', head: true }),
      supabase.from('v_tender_card').select('amount').eq('is_relevant', true).gt('apply_to', nowIso).limit(2000),
      supabase
        .from('v_tender_card')
        .select('tender_id', { count: 'exact', head: true })
        .eq('is_relevant', true)
        .gt('apply_to', nowIso)
        .lt('apply_to', in24),
      supabase
        .from('v_tender_card')
        .select('tender_id', { count: 'exact', head: true })
        .eq('is_relevant', true)
        .gte('apply_to', in24)
        .lt('apply_to', in72),
    ]);

    if (amounts.error) throw new Error(amounts.error.message);

    const potential = (amounts.data ?? []).reduce((sum, row) => sum + Number(row.amount ?? 0), 0);

    return {
      open: open.count ?? 0,
      found_total: total.count ?? 0,
      potential_amount: potential,
      closing_24h: c24.count ?? 0,
      closing_72h: c72.count ?? 0,
    };
  });
}

export async function fetchStopWordStats(hours = 24): Promise<Result<StopWordRow[]>> {
  if (isDemoMode()) return safe(async () => DEMO_STOP_WORDS);
  return safe(async () => {
    const rows = await callRpc<StopWordRow[]>('app_stop_word_stats', { p_hours: hours });
    return rows ?? [];
  });
}

function applyDemo(filters: TenderFilters): TenderPage {
  let rows = [...DEMO_TENDERS];
  if (filters.urgency && filters.urgency !== 'all') rows = rows.filter((t) => t.urgency === filters.urgency);
  if (filters.minAmount) rows = rows.filter((t) => (t.amount ?? 0) >= (filters.minAmount as number));
  if (filters.query && filters.query.trim().length >= 2) {
    const needle = filters.query.trim().toLowerCase();
    rows = rows.filter(
      (t) => t.title.toLowerCase().includes(needle) || (t.customer_name ?? '').toLowerCase().includes(needle),
    );
  }
  rows.sort((a, b) => {
    if (filters.sort === '-amount') return (b.amount ?? 0) - (a.amount ?? 0);
    if (filters.sort === 'amount') return (a.amount ?? 0) - (b.amount ?? 0);
    if (filters.sort === '-deadline') return (b.hours_left ?? 1e9) - (a.hours_left ?? 1e9);
    return (a.hours_left ?? 1e9) - (b.hours_left ?? 1e9);
  });
  const from = (filters.page - 1) * filters.pageSize;
  return { rows: rows.slice(from, from + filters.pageSize), total: rows.length };
}
