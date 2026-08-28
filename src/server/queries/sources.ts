import { DEMO_SOURCES } from '../demo/data';
import { callRpc, db, isDemoMode, safe } from './client';
import type { Result, SourceStatsRow } from '@/lib/types';

export async function fetchSourceStats(periodDays: number): Promise<Result<SourceStatsRow[]>> {
  if (isDemoMode()) return safe(async () => DEMO_SOURCES);
  return safe(async () => {
    const rows = await callRpc<SourceStatsRow[]>('app_source_stats', { p_days: periodDays });
    return rows ?? [];
  });
}

export async function fetchSource(code: string, periodDays: number): Promise<Result<SourceStatsRow | null>> {
  const all = await fetchSourceStats(periodDays);
  if (!all.ok) return all as Result<SourceStatsRow | null>;
  return { ok: true, data: all.data.find((s) => s.code === code) ?? null };
}

export interface SocialAccountRow {
  id: number;
  platform: string;
  handle: string;
  title: string | null;
  url: string | null;
  is_active: boolean;
  fail_count: number | null;
  posts_total: number | null;
  last_post_at: string | null;
  last_checked_at: string | null;
}

export async function fetchSourceAccounts(sourceId: number): Promise<Result<SocialAccountRow[]>> {
  if (isDemoMode()) {
    return safe(async () => [
      {
        id: 1,
        platform: 'telegram',
        handle: 'stroy_kz',
        title: 'Строительство Казахстана',
        url: 'https://t.me/s/stroy_kz',
        is_active: true,
        fail_count: 0,
        posts_total: 128,
        last_post_at: new Date(Date.now() - 5 * 3600_000).toISOString(),
        last_checked_at: new Date(Date.now() - 2 * 3600_000).toISOString(),
      },
    ]);
  }
  return safe(async () => {
    const supabase = await db();
    const { data, error } = await supabase
      .from('social_accounts')
      .select('id, platform, handle, title, url, is_active, fail_count, posts_total, last_post_at, last_checked_at')
      .eq('source_id', sourceId)
      .order('is_active', { ascending: false })
      .order('posts_total', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as SocialAccountRow[];
  });
}
