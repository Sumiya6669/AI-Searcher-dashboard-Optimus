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
  /**
   * Сколько пересказов той же истории сведено с этим событием. Ноль — история
   * пришла один раз. Три — её написали четыре издания, и это само по себе
   * признак значимости, а не служебная мелочь.
   */
  duplicates_count: number;
  /**
   * Решение по направлениям: пропустить, считать фоном или исключить.
   * Считается на чтении, а не хранится: правила меняются, и сохранённое
   * решение через неделю разошлось бы с действующей настройкой.
   */
  direction_verdict: 'pass' | 'background' | 'exclude';
  direction_what: string;
  direction_geo: string;
  direction_weight: number;
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
  /**
   * Способ закупки и регион названием, а не кодом. Подстановка сделана в
   * представлении базы: карточку читают дашборд, оповещения в Telegram и
   * выгрузка в Excel, и название должно быть одним и тем же во всех трёх.
   */
  trade_method_name: string | null;
  kato_name: string | null;
  /**
   * Через какие ещё источники пришёл тот же лот. Копии в списки не попадают —
   * их отсекает представление, — но молчать о них нельзя: выглядело бы так,
   * будто второй источник этот лот не нашёл.
   */
  also_sources: string | null;
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

export type SourceFreshness =
  | 'active'
  | 'stale'
  | 'blocked'
  | 'error'
  | 'idle'
  | 'disabled'
  | 'not_connected';

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
  expected_interval_min: number | null;
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
  last_error_at: string | null;
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

export interface AdminUserRow {
  user_id: string;
  email: string;
  full_name: string | null;
  role: AppRole;
  is_active: boolean;
  created_at: string;
  last_sign_in_at: string | null;
  group_ids: number[];
  group_names: string;
}

export interface AccessGroupRow {
  id: number;
  code: string;
  name: string;
  description: string | null;
  /** Ограничивать не только рассылку, но и просмотр разделов. */
  restrict_view: boolean;
  min_importance: number;
  recipient_id: number | null;
  recipient_name: string | null;
  is_active: boolean;
  entity_ids: number[];
  entity_names: string;
  member_ids: string[];
  members_count: number;
  events_30d: number;
}

export interface EntityOptionRow {
  id: number;
  canonical_name: string;
  entity_type: string;
  product_group: string | null;
  is_active: boolean;
  events_30d: number;
}

/**
 * Направление семантики: объект или работа, под которые подходит номенклатура.
 * Считается в базе, потому что число выражений и число событий должны быть
 * одним и тем же числом и на экране, и на входном фильтре.
 */
export interface SemanticsRow {
  entity_id: number;
  canonical_name: string;
  description: string | null;
  product_groups: string;
  aliases_total: number;
  aliases_phrase: number;
  aliases_pattern: number;
  examples: string;
  events_30d: number;
  is_active: boolean;
}

/** Решение по строке каталога источников. Описание строки — в src/data. */
export type CatalogStatus = 'not_connected' | 'in_progress' | 'connected' | 'rejected';

export interface CatalogStateRow {
  ord: number;
  status: CatalogStatus;
  source_id: number | null;
  source_code: string | null;
  note: string | null;
  updated_at: string;
}

export interface SourceOptionRow {
  id: number;
  code: string;
  name: string;
  kind: string;
  is_active: boolean;
}

/**
 * Состояние внешнего подключения. Значение ключа сюда не приходит и прийти не
 * может: база отдаёт только признак «заполнено» и длину.
 */
export interface IntegrationRow {
  code: string;
  title: string;
  hint: string;
  filled: boolean;
  value_length: number;
  editable: boolean;
}

/**
 * Обращение в чате. Вопрос и ответ хранятся у спрашивающего: своё видит
 * автор, всё — администратор. Это нужно не для отчётности, а чтобы было
 * видно, о чём людей спрашивают чаще всего и чего системе не хватает.
 */
export type ChatStatus = 'pending' | 'answered' | 'failed' | 'empty';

/**
 * Событие и лот в том виде, в каком они попали в ответ. Ссылки берутся
 * отсюда, а не из текста модели: адрес, который модель придумала, ведёт в
 * никуда, и проверить это можно только кликнув.
 */
export interface ChatEventSource {
  event_id: number;
  event_date: string;
  category: string | null;
  importance: number;
  sentiment: string | null;
  title: string;
  vyzhimka: string | null;
  entity_names: string | null;
  product_groups: string | null;
  source_name: string | null;
  source_kind: string | null;
  link: string | null;
}

export interface ChatTenderSource {
  tender_id: number;
  lot_no: string | null;
  announce_no: string | null;
  title: string;
  customer_name: string | null;
  customer_bin: string | null;
  organizer_name: string | null;
  trade_method_name: string | null;
  amount: number | null;
  qty: number | null;
  unit: string | null;
  ktru_code: string | null;
  kato_name: string | null;
  delivery_place: string | null;
  published_at: string | null;
  apply_to: string | null;
  hours_left: number | null;
  urgency: TenderUrgency;
  importance: number;
  match_reason: string | null;
  matched_on: string | null;
  entity_names: string | null;
  portal_status: string | null;
  source: string;
  link: string | null;
}

export interface ChatSources {
  events?: ChatEventSource[];
  tenders?: ChatTenderSource[];
}

export interface ChatMessageRow {
  id: number;
  user_id: string;
  question: string;
  answer: string | null;
  status: ChatStatus;
  error: string | null;
  found_events: number;
  found_tenders: number;
  cost_usd: number | null;
  /** Снимок материала, по которому дан ответ. Пересчитать его нельзя. */
  sources: ChatSources;
  asked_at: string;
  answered_at: string | null;
}

/**
 * Материал, отобранный базой под правами спрашивающего. Уходит в подсказку
 * модели целиком и только он: то, чего здесь нет, модель придумать не может.
 */
export interface ChatMaterial {
  question: string;
  days: number;
  obshchiy_otvet: boolean;
  sushchnostey_naydeno: number;
  events: ChatEventSource[];
  tenders: ChatTenderSource[];
  events_count: number;
  tenders_count: number;
}

/** Обёртка результата: ошибка одного блока не должна ломать страницу. */
export type Result<T> = { ok: true; data: T } | { ok: false; error: string };

export function ok<T>(data: T): Result<T> {
  return { ok: true, data };
}

export function fail<T>(error: string): Result<T> {
  return { ok: false, error };
}

/**
 * Направление новостей: вторая и третья оси отбора. Первая ось — словарь
 * сущностей — отвечает «кто упомянут». Этого мало: разметка ста событий
 * исполнительным директором дала пять полезных из ста именно потому, что
 * названная марка сама по себе пропускала и вакансию, и котировки.
 */
export type DirectionKind = 'interest' | 'background' | 'exclude';
export type DirectionAxis = 'what' | 'where';

export interface DirectionRow {
  id: number;
  code: string;
  kind: DirectionKind;
  axis: DirectionAxis;
  name: string;
  description: string | null;
  pattern: string;
  weight: number;
  is_active: boolean;
  /** Откуда правило взялось: ссылка на замечание в разметке. */
  note: string | null;
  events_30d: number;
  materials_30d: number;
  updated_at: string;
}

/* --- Анализ по комплекту исполнительного директора ------------------------ */

/** Слагаемое балла: код, человеческое название, вес. */
export interface ScoreFactor {
  code: string;
  name: string;
  weight: number;
}

/**
 * Доказательство вывода. Комплект требует по каждому утверждению кусок
 * исходного текста: проверять систему нужно не по объяснению, а по цитате.
 */
export interface EvidenceItem {
  claim: string;
  source_fragment: string | null;
  url?: string | null;
}

export type StreamKind = 'competitor_news' | 'project_lead' | 'market_info';
export type PriorityKind = 'archive' | 'monitoring' | 'medium' | 'high' | 'critical';
export type ConfidenceKind = 'low' | 'medium' | 'high';
export type VerificationKind = 'unverified' | 'partially_verified' | 'verified';
export type OpportunityKind = 'direct_supply' | 'project_lead' | 'services';

export interface EventAnalysisRow {
  event_id: number;
  stream: StreamKind | null;
  base_score: number | null;
  total_score: number | null;
  priority: PriorityKind | null;
  confidence: ConfidenceKind | null;
  verification_status: VerificationKind | null;
  evidence: EvidenceItem[];
  positive_factors: ScoreFactor[];
  penalties: ScoreFactor[];
  recommended_action: string | null;
  department_code: string | null;
  department_name: string | null;
  department_scope: string | null;
  contact_role: string | null;
  product_categories: string[];
  project_id: number | null;
  product_category_names: string | null;
  product_positions: number | null;
}

export interface TenderAnalysisRow {
  tender_id: number;
  opportunity: OpportunityKind | null;
  opportunity_name: string;
  equivalent_allowed: boolean | null;
  brand_requirement: string | null;
  total_score: number | null;
  priority: PriorityKind | null;
  positive_factors: ScoreFactor[];
  penalties: ScoreFactor[];
  recommended_action: string | null;
  department_code: string | null;
  department_name: string | null;
  contact_role: string | null;
  product_categories: string[];
  product_category_names: string | null;
  product_positions: number | null;
}

export interface ProjectRow {
  id: number;
  project_name: string;
  object_type: string | null;
  object_type_name: string | null;
  stage_code: string | null;
  stage_name: string | null;
  stage_score: number | null;
  stage_sort: number | null;
  country: string | null;
  region: string | null;
  city: string | null;
  place: string | null;
  investor: string | null;
  customer: string | null;
  designer: string | null;
  general_contractor: string | null;
  total_score: number;
  priority: PriorityKind;
  status: 'monitoring' | 'active' | 'hot' | 'commissioned' | 'lost';
  confidence: ConfidenceKind;
  verification_status: VerificationKind;
  sources_count: number;
  positive_factors: ScoreFactor[];
  penalties: ScoreFactor[];
  evidence: EvidenceItem[];
  product_categories: string[];
  product_category_names: string | null;
  recommended_action: string | null;
  department_code: string | null;
  department_name: string | null;
  contact_role: string | null;
  first_event_id: number | null;
  last_event_id: number | null;
  first_seen_at: string;
  updated_at: string;
  link: string | null;
}

export interface CatalogGroupRow {
  code: string;
  name: string;
  applies_to: string | null;
  cluster_code: string | null;
  cluster_name: string | null;
  is_trade: boolean;
  sort: number;
  positions: number;
  discontinued: number;
  needs_review: number;
  brands: number;
  lines: number;
  top_brands: string | null;
}

export interface CatalogItemRow {
  id: number;
  sku: string | null;
  name: string;
  brand_name: string | null;
  product_line: string | null;
  category_code: string | null;
  category_name: string | null;
  pack_size: number | null;
  pack_unit: string | null;
  color_code: string | null;
  color_name: string | null;
  tint_base: string | null;
  gloss: string | null;
  substrate: string[];
  project_codes: string[];
  discontinued: boolean;
  needs_review: boolean;
}

export interface CatalogTotalsRow {
  positions: number;
  trade: number;
  brands: number;
  lines: number;
  with_pack: number;
  with_application: number;
  needs_review: number;
  discontinued: number;
}

export interface ScoringFactorRow {
  id: number;
  stream: 'competitor_news' | 'project_lead' | 'tender';
  code: string;
  name: string;
  weight: number;
  kind: 'base' | 'positive' | 'penalty' | 'threshold';
  is_active: boolean;
  note: string | null;
}

export interface StageRow {
  code: string;
  name: string;
  score: number;
  sort: number;
  note: string | null;
  projects: number;
}
