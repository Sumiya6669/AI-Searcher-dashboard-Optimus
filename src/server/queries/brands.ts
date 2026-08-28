import { DEMO_BRANDS, DEMO_SUBSCRIPTIONS } from '../demo/data';
import { callRpc, db, isDemoMode, safe } from './client';
import type { BrandStatsRow, Result, SubscriptionRow } from '@/lib/types';

export async function fetchBrandStats(periodDays: number): Promise<Result<BrandStatsRow[]>> {
  if (isDemoMode()) return safe(async () => DEMO_BRANDS);
  return safe(async () => {
    const rows = await callRpc<BrandStatsRow[]>('app_brand_stats', { p_days: periodDays });
    return rows ?? [];
  });
}

export async function fetchBrand(entityId: number, periodDays: number): Promise<Result<BrandStatsRow | null>> {
  const all = await fetchBrandStats(periodDays);
  if (!all.ok) return all as Result<BrandStatsRow | null>;
  return { ok: true, data: all.data.find((b) => b.entity_id === entityId) ?? null };
}

export async function fetchBrandAliases(entityId: number): Promise<Result<string[]>> {
  if (isDemoMode()) return safe(async () => ['Sika', 'SIKA', 'Сика']);
  return safe(async () => {
    const supabase = await db();
    const { data, error } = await supabase
      .from('dict_alias')
      .select('alias')
      .eq('entity_id', entityId)
      .eq('is_active', true)
      .order('alias');
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => r.alias as string);
  });
}

export async function fetchSubscriptions(entityId?: number): Promise<Result<SubscriptionRow[]>> {
  if (isDemoMode()) {
    return safe(async () =>
      entityId ? DEMO_SUBSCRIPTIONS.filter((s) => s.entity_id === entityId) : DEMO_SUBSCRIPTIONS,
    );
  }
  return safe(async () => {
    const supabase = await db();
    let query = supabase
      .from('v_app_subscriptions')
      .select('*')
      .eq('is_active', true)
      .order('recipient_name')
      .order('scope');
    if (entityId) query = query.eq('entity_id', entityId);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data ?? []) as SubscriptionRow[];
  });
}
