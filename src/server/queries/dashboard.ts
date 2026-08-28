import type { NotificationItem } from '@/components/layout/NotificationCenter';
import type { DashboardKpi, Result, SourceStatsRow } from '@/lib/types';
import { formatHoursLeft, formatMoneyKzt } from '@/lib/format';
import { DEMO_ADMIN_HEALTH, DEMO_EVENTS, DEMO_FAILED_RUNS, DEMO_KPI, DEMO_SOURCES, DEMO_TENDERS } from '../demo/data';
import { callRpcRow, db, isDemoMode, safe } from './client';
import { fetchSourceStats } from './sources';
import { fetchTenders } from './tenders';

export async function fetchKpi(periodDays: number): Promise<Result<DashboardKpi>> {
  if (isDemoMode()) return safe(async () => DEMO_KPI);
  return safe(async () => {
    const row = await callRpcRow<DashboardKpi>('app_dashboard_kpi', { p_days: periodDays });
    if (!row) throw new Error('показатели не вернулись');
    return row;
  });
}

/**
 * Центр уведомлений собирает только то, на что можно отреагировать:
 * критичное событие, закупка с истекающим сроком, отказ сценария,
 * источник в состоянии ошибки или устаревших данных.
 */
export async function fetchAttentionItems(isAdmin: boolean): Promise<Result<NotificationItem[]>> {
  if (isDemoMode()) {
    return safe(async () => buildItems(DEMO_EVENTS.filter((e) => e.importance >= 4), DEMO_TENDERS, DEMO_SOURCES, isAdmin ? DEMO_FAILED_RUNS.length : 0));
  }

  return safe(async () => {
    const supabase = await db();
    const since = new Date(Date.now() - 3 * 86_400_000).toISOString();

    const [events, tenders, sources, failedRuns] = await Promise.all([
      supabase
        .from('v_event_list')
        .select('event_id, title, importance, product_focus, company_focus, category, created_at')
        .gte('importance', 4)
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(5),
      fetchTenders({ urgency: 'critical', page: 1, pageSize: 5, onlyOpen: true }),
      fetchSourceStats(30),
      isAdmin
        ? supabase
            .from('workflow_runs')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'failed')
            .gte('started_at', new Date(Date.now() - 86_400_000).toISOString())
        : Promise.resolve({ count: 0, error: null }),
    ]);

    if (events.error) throw new Error(events.error.message);

    const eventItems = (events.data ?? []).map((e) => ({
      event_id: e.event_id as number,
      title: e.title as string,
      importance: e.importance as number,
      product_focus: e.product_focus as string | null,
      company_focus: e.company_focus as string | null,
      category: e.category as string,
      created_at: e.created_at as string,
    }));

    return buildItems(
      eventItems,
      tenders.ok ? tenders.data.rows : [],
      sources.ok ? sources.data : [],
      failedRuns.count ?? 0,
    );
  });
}

interface MinimalEvent {
  event_id: number;
  title: string;
  importance: number;
  product_focus: string | null;
  company_focus: string | null;
  category: string;
  created_at: string;
}

interface MinimalTender {
  tender_id: number;
  title: string;
  amount: number | null;
  hours_left: number | null;
  apply_to: string | null;
}

function buildItems(
  events: MinimalEvent[],
  tenders: MinimalTender[],
  sources: SourceStatsRow[],
  failedRuns: number,
): NotificationItem[] {
  const items: NotificationItem[] = [];

  for (const e of events) {
    items.push({
      id: `event-${e.event_id}`,
      tone: e.importance >= 5 ? 'critical' : 'warning',
      kind: 'event',
      title: e.title,
      detail: `${e.importance}/5 · ${e.product_focus ?? e.company_focus ?? e.category}`,
      at: e.created_at,
      href: `/events/${e.event_id}`,
    });
  }

  for (const t of tenders) {
    items.push({
      id: `tender-${t.tender_id}`,
      tone: 'critical',
      kind: 'tender',
      title: t.title,
      detail: `${formatMoneyKzt(t.amount)} · ${formatHoursLeft(t.hours_left)}`,
      at: t.apply_to,
      href: `/tenders/${t.tender_id}`,
    });
  }

  for (const s of sources) {
    if (s.freshness === 'error' || s.freshness === 'stale') {
      items.push({
        id: `source-${s.code}`,
        tone: s.freshness === 'error' ? 'critical' : 'warning',
        kind: 'source',
        title: s.name,
        detail: s.freshness === 'error' ? 'запуски падают' : 'данные устарели',
        at: s.last_activity_at,
        href: `/sources/${s.code}`,
      });
    }
  }

  if (failedRuns > 0) {
    items.push({
      id: 'workflow-failed',
      tone: 'critical',
      kind: 'workflow',
      title: `Отказов сценариев за сутки: ${failedRuns}`,
      detail: 'перечень — в служебном разделе',
      at: new Date().toISOString(),
      href: '/admin',
    });
  }

  const order = { critical: 0, warning: 1, attention: 2, accent: 3, success: 4, neutral: 5 } as const;
  return items.sort((a, b) => order[a.tone] - order[b.tone]).slice(0, 12);
}

export async function fetchAdminHealthForDashboard(): Promise<Result<{ queue_new: number; budget_used_pct: number | null }>> {
  if (isDemoMode()) {
    return safe(async () => ({
      queue_new: DEMO_ADMIN_HEALTH.queue_new,
      budget_used_pct: DEMO_ADMIN_HEALTH.budget_used_pct,
    }));
  }
  return safe(async () => {
    const row = await callRpcRow<{ queue_new: number; budget_used_pct: number | null }>('app_admin_health');
    if (!row) throw new Error('показатели не вернулись');
    return { queue_new: row.queue_new, budget_used_pct: row.budget_used_pct };
  });
}
