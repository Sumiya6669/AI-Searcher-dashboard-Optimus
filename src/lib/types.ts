/**
 * Типы строк, которые отдаёт база. Имена полей повторяют имена в
 * представлениях и функциях: расхождение имён между слоями — самый дорогой
 * вид опечатки, потому что компилятор его не видит.
 */

export type AppRole = 'user' | 'admin';
export type ThemePreference = 'light' | 'dark' | 'system';

export interface AppUser {
  user_id: string;
  email: string;
  full_name: string | null;
  role: AppRole;
  /** Доступ выдан администратором. Вход в систему сам по себе его не даёт. */
  is_active: boolean;
  recipient_id: number | null;
  locale: string;
  theme: ThemePreference;
  timezone: string;
}

/** Уровень важности события. Шкала задана документом и не меняется. */
export type Severity = 1 | 2 | 3 | 4 | 5;

export interface EventListRow {
  event_id: number;
  agent: string;
  category: string;
  importance: Severity;
  sentiment: string | null;
  title: string;
  summary: string | null;
  rationale: string | null;
  brief: string | null;
  product_focus: string | null;
  product_groups: string | null;
  company_focus: string | null;
  entity_names: string | null;
  source_name: string | null;
  source_kind: string | null;
  source_code: string | null;
  link: string | null;
  event_date: string;
  created_at: string;
  is_notified: boolean;
  in_digest: boolean;
  entity_ids: number[];
  entity_types: string[];
}

export interface DashboardKpi {
  events_period: number;
  events_high_7d: number;
  tenders_open: number;
  competitor_changes: number;
  collect_success_pct: number | null;
  runs_total_24h: number;
  runs_ok_24h: number;
  materials_period: number;
  last_event_at: string | null;
  last_run_at: string | null;
}

export type CrawlHealth = 'ok' | 'warning' | 'critical' | 'not_monitored';

export interface CompetitorActivityRow {
  competitor_id: number;
  name: string;
  base_url: string | null;
  entity_id: number | null;
  is_active: boolean;
  events_count: number;
  changes_count: number;
  significant_count: number;
  change_types: string;
  last_change_at: string | null;
  last_crawled_at: string | null;
  pages_active: number;
  pages_ok: number;
  pages_failing_hard: number;
  crawl_success_pct: number | null;
  crawl_health: CrawlHealth;
}

export interface CompetitorPageRow {
  id: number;
  competitor_id: number;
  url: string;
  section_type: string | null;
  is_active: boolean;
  last_crawled_at: string | null;
  last_change_at: string | null;
  crawl_status: string | null;
  fetch_mode: string | null;
  fail_count: number | null;
  min_interval_hours: number | null;
}

export interface CompetitorChangeRow {
  id: number;
  page_id: number;
  change_type: string;
  diff_summary: string | null;
  diff_chars: number | null;
  is_significant: boolean;
  reject_reason: string | null;
  status: string | null;
  detected_at: string;
}

export interface BrandStatsRow {
  entity_id: number;
  canonical_name: string;
  entity_type: string;
  product_group: string | null;
  relation: string | null;
  geo_scope: string | null;
  search_priority: number;
  is_active: boolean;
  aliases_count: number;
  events_count: number;
  events_high: number;
  share_pct: number;
  last_event_at: string | null;
  positive: number;
  neutral: number;
  negative: number;
  recipients: string;
  subscribers: number;
  coverage_gap: boolean;
}

export type TenderUrgency = 'critical' | 'warning' | 'normal' | 'closed' | 'unknown';

export interface TenderCardRow {
  tender_id: number;
  source: string;
  lot_no: string;
  announce_no: string | null;
  title: string;
  announce_title: string | null;
  description: string | null;
  customer_name: string | null;
  customer_bin: string | null;
  organizer_name: string | null;
  trade_method: string | null;
  portal_status: string | null;
  amount: number | null;
  qty: number | null;
  unit: string | null;
  ktru_code: string | null;
  kato: string | null;
  delivery_place: string | null;
  delivery_term: string | null;
  published_at: string | null;
  apply_from: string | null;
  apply_to: string | null;
  importance: number;
  is_relevant: boolean;
  match_reason: string | null;
  enriched: boolean;
  is_notified: boolean;
  reminder_sent: boolean;
  created_at: string;
  updated_at: string;
  link: string | null;
  hours_left: number | null;
  urgency: TenderUrgency;
  matched_on: string | null;
  match_types: string | null;
  has_brand: boolean | null;
  entity_names: string | null;
  entity_ids: number[];
}

export interface StopWordRow {
  stop_word: string;
  filtered_count: number;
  examples: string | null;
}

export type SourceFreshness = 'active' | 'stale' | 'error' | 'idle' | 'disabled' | 'not_connected';

export interface SourceStatsRow {
  source_id: number;
  code: string;
  name: string;
  kind: string;
  is_active: boolean;
  connected: boolean;
  missing: string;
  blocker: string;
  workflow_code: string | null;
  expected_interval_min: number;
  materials_total: number;
  materials_period: number;
  share_pct: number;
  events_total: number;
  events_period: number;
  accounts_active: number;
  last_activity_at: string | null;
  last_material_at: string | null;
  last_success_at: string | null;
  runs_ok_24h: number;
  runs_failed_24h: number;
  avg_duration_ms: number | null;
  last_error: string | null;
  freshness: SourceFreshness;
}

export interface AdminHealth {
  runs_total_24h: number;
  runs_ok_24h: number;
  runs_failed_24h: number;
  runs_partial_24h: number;
  runs_running: number;
  success_rate_pct: number | null;
  avg_duration_ms: number | null;
  collected_24h: number;
  classified_24h: number;
  dedup_share_pct: number | null;
  filter_share_pct: number | null;
  events_high_24h: number;
  queue_new: number;
  spent_today_usd: number;
  spent_month_usd: number;
  spent_total_usd: number;
  budget_month_usd: number;
  budget_used_pct: number | null;
  llm_calls_month: number;
  tokens_in_month: number;
  tokens_out_month: number;
  notifications_30d: number;
  digests_total: number;
  last_digest_at: string | null;
  last_backup_at: string | null;
  pages_active: number;
  pages_failing: number;
  dict_entities: number;
  events_total: number;
  last_run_at: string | null;
}

export interface WorkflowHealthRow {
  workflow_code: string;
  workflow_name: string | null;
  runs_total: number;
  runs_ok: number;
  runs_failed: number;
  runs_partial: number;
  runs_running: number;
  success_rate: number | null;
  avg_duration_ms: number | null;
  items_out: number;
  last_run_at: string | null;
  last_status: string | null;
  next_expected_at: string | null;
}

export interface FailedRunRow {
  id: number;
  workflow_code: string;
  workflow_name: string | null;
  execution_id: string | null;
  started_at: string;
  finished_at: string | null;
  duration_ms: number | null;
  status: string;
  items_in: number | null;
  items_out: number | null;
  error_text: string | null;
}

export interface LlmDailyRow {
  day: string;
  calls: number;
  cost_usd: number;
  tokens_in: number;
  tokens_out: number;
}

export interface DeliveryStateRow {
  kind: string;
  sent_total: number;
  sent_30d: number;
  failed_30d: number;
  last_sent_at: string | null;
}

export interface SubscriptionRow {
  id: number;
  recipient_id: number;
  recipient_name: string;
  recipient_role: string | null;
  recipient_active: boolean;
  scope: string;
  target: string | null;
  entity_id: number | null;
  target_type: string | null;
  mode: string;
  effective_min_importance: number;
  channels: string[];
  note: string | null;
  is_active: boolean;
  created_at: string;
}

export interface ThresholdRow {
  key: string;
  value: string | null;
  value_num: number | null;
  description: string | null;
}

export interface SearchHit {
  kind: 'event' | 'competitor' | 'brand' | 'tender' | 'source';
  id: string;
  title: string;
  subtitle: string | null;
  badge: string | null;
  href: string;
}

export interface DictEntityRow {
  id: number;
  entity_type: string;
  canonical_name: string;
  description: string | null;
  weight: number;
  attributes: Record<string, unknown>;
  is_active: boolean;
}

export interface RecipientRow {
  id: number;
  name: string;
  role: string | null;
  min_importance: number;
  wants_daily: boolean;
  wants_weekly: boolean;
  wants_instant: boolean;
  is_active: boolean;
}

/** Обёртка результата: ошибка одного блока не должна ломать страницу. */
export type Result<T> = { ok: true; data: T } | { ok: false; error: string };

export function ok<T>(data: T): Result<T> {
  return { ok: true, data };
}

export function fail<T>(error: string): Result<T> {
  return { ok: false, error };
}
