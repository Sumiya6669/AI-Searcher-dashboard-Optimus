import { DEMO_CHANGES, DEMO_COMPETITORS, DEMO_PAGES } from '../demo/data';
import { callRpc, db, isDemoMode, safe } from './client';
import type {
  CompetitorActivityRow,
  CompetitorChangeRow,
  CompetitorPageRow,
  Result,
} from '@/lib/types';

export async function fetchCompetitorActivity(periodDays: number): Promise<Result<CompetitorActivityRow[]>> {
  if (isDemoMode()) return safe(async () => DEMO_COMPETITORS);
  return safe(async () => {
    const rows = await callRpc<CompetitorActivityRow[]>('app_competitor_activity', { p_days: periodDays });
    return rows ?? [];
  });
}

export async function fetchCompetitor(id: number, periodDays: number): Promise<Result<CompetitorActivityRow | null>> {
  const all = await fetchCompetitorActivity(periodDays);
  if (!all.ok) return all as Result<CompetitorActivityRow | null>;
  return { ok: true, data: all.data.find((c) => c.competitor_id === id) ?? null };
}

export async function fetchCompetitorPages(competitorId: number): Promise<Result<CompetitorPageRow[]>> {
  if (isDemoMode()) return safe(async () => DEMO_PAGES.filter((p) => p.competitor_id === competitorId));
  return safe(async () => {
    const supabase = await db();
    const { data, error } = await supabase
      .from('competitor_pages')
      .select(
        'id, competitor_id, url, section_type, is_active, last_crawled_at, last_change_at, crawl_status, fetch_mode, fail_count, min_interval_hours',
      )
      .eq('competitor_id', competitorId)
      .order('is_active', { ascending: false })
      .order('section_type', { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as CompetitorPageRow[];
  });
}

export async function fetchCompetitorChanges(
  competitorId: number,
  periodDays: number,
  limit = 40,
): Promise<Result<Array<CompetitorChangeRow & { page_url: string | null; section_type: string | null }>>> {
  if (isDemoMode()) {
    return safe(async () =>
      DEMO_CHANGES.map((c) => ({
        ...c,
        page_url: DEMO_PAGES.find((p) => p.id === c.page_id)?.url ?? null,
        section_type: DEMO_PAGES.find((p) => p.id === c.page_id)?.section_type ?? null,
      })),
    );
  }

  return safe(async () => {
    const supabase = await db();
    const pages = await supabase.from('competitor_pages').select('id, url, section_type').eq('competitor_id', competitorId);
    if (pages.error) throw new Error(pages.error.message);
    const ids = (pages.data ?? []).map((p) => p.id as number);
    if (ids.length === 0) return [];

    const since = new Date(Date.now() - periodDays * 86_400_000).toISOString();
    const { data, error } = await supabase
      .from('competitor_changes')
      .select('id, page_id, change_type, diff_summary, diff_chars, is_significant, reject_reason, status, detected_at')
      .in('page_id', ids)
      .gte('detected_at', since)
      .order('detected_at', { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);

    const pageById = new Map((pages.data ?? []).map((p) => [p.id as number, p]));
    return (data ?? []).map((c) => {
      const page = pageById.get(c.page_id as number);
      return {
        ...(c as CompetitorChangeRow),
        page_url: (page?.url as string | undefined) ?? null,
        section_type: (page?.section_type as string | undefined) ?? null,
      };
    });
  });
}
