/**
 * Правила предметной области в одном месте. Шкала важности, срочность лота,
 * свежесть источника и здоровье обхода описаны здесь, а не в разметке: иначе
 * одно и то же событие получает разный цвет на разных страницах.
 *
 * Числовые пороги, которые заказчик меняет сам, приходят из базы
 * (функция app_thresholds) и здесь не дублируются.
 */

import type { CrawlHealth, Severity, SourceFreshness, TenderUrgency } from './types';

export type Tone = 'critical' | 'warning' | 'attention' | 'success' | 'neutral' | 'accent';

export interface SeverityMeta {
  level: Severity;
  label: string;
  short: string;
  tone: Tone;
}

/** Шкала из документа. Порядок и смысл уровней не меняются. */
export const SEVERITY: Record<Severity, SeverityMeta> = {
  5: { level: 5, label: 'Критично', short: 'КРИТ', tone: 'critical' },
  4: { level: 4, label: 'Высокая важность', short: 'ВЫС', tone: 'warning' },
  3: { level: 3, label: 'Средняя важность', short: 'СРЕД', tone: 'attention' },
  2: { level: 2, label: 'Низкая важность', short: 'НИЗ', tone: 'neutral' },
  1: { level: 1, label: 'Информационное', short: 'ФОН', tone: 'neutral' },
};

export function severityMeta(level: number | null | undefined): SeverityMeta {
  const n = Math.min(5, Math.max(1, Math.round(level ?? 1))) as Severity;
  return SEVERITY[n];
}

export const SEVERITY_OPTIONS = [
  { value: '5', label: '5 — критично' },
  { value: '4', label: '4 — высокая' },
  { value: '3', label: '3 — средняя' },
  { value: '2', label: '2 — низкая' },
  { value: '1', label: '1 — фоновая' },
];

/**
 * Срочность лота. Цвет означает время до закрытия приёма заявок и никогда —
 * размер суммы: по деньгам решает человек, по времени решает календарь.
 */
export const URGENCY: Record<TenderUrgency, { label: string; tone: Tone }> = {
  critical: { label: 'меньше суток', tone: 'critical' },
  warning: { label: 'меньше трёх суток', tone: 'warning' },
  normal: { label: 'срок не поджимает', tone: 'attention' },
  closed: { label: 'приём закрыт', tone: 'neutral' },
  unknown: { label: 'срок уточняется', tone: 'neutral' },
};

export const URGENCY_ORDER: TenderUrgency[] = ['critical', 'warning', 'normal', 'unknown', 'closed'];

export const FRESHNESS: Record<SourceFreshness, { label: string; tone: Tone; hint: string }> = {
  active: { label: 'Работает', tone: 'success', hint: 'обновления приходят в ожидаемом ритме' },
  stale: {
    label: 'Данные устарели',
    tone: 'warning',
    hint: 'с последнего обновления прошло больше трёх ожидаемых промежутков',
  },
  blocked: {
    label: 'Заблокирован',
    tone: 'critical',
    hint: 'запуски проходят, но данные не приходят по внешней причине — она указана в столбце причины',
  },
  error: { label: 'Ошибка', tone: 'critical', hint: 'запуски падают, успешных за сутки нет' },
  idle: { label: 'Простаивает', tone: 'attention', hint: 'подключён, но ничего не приносит' },
  disabled: { label: 'Выключен', tone: 'neutral', hint: 'источник отключён в справочнике' },
  not_connected: { label: 'Не подключён', tone: 'neutral', hint: 'ожидает ключ или адрес' },
};

export const CRAWL_HEALTH: Record<CrawlHealth, { label: string; tone: Tone }> = {
  ok: { label: 'Обход исправен', tone: 'success' },
  warning: { label: 'Часть страниц не читается', tone: 'warning' },
  critical: { label: 'Страницы падают подряд', tone: 'critical' },
  not_monitored: { label: 'Страницы не заведены', tone: 'neutral' },
};

export const SENTIMENT_TONE: Record<string, Tone> = {
  'положительная': 'success',
  'нейтральная': 'neutral',
  'отрицательная': 'critical',
};

export const EVENT_CATEGORIES = [
  'новость отрасли',
  'действие конкурента',
  'регуляторное изменение',
  'поставщик',
  'рынок и цены',
  'технология',
  'прочее',
];

export const AGENT_LABEL: Record<string, string> = {
  news: 'Поиск и каналы',
  competitor: 'Сайты конкурентов',
};

export const ENTITY_TYPE_LABEL: Record<string, string> = {
  brand: 'бренд',
  competitor: 'конкурент',
  supplier: 'поставщик',
  product: 'товарное направление',
  company: 'компания',
  topic: 'тема',
};

export const RELATION_LABEL: Record<string, string> = {
  DIRECT_COMPETITOR: 'прямой конкурент',
  BRAND_DISTRIBUTOR: 'дистрибьютор бренда',
  DEALER: 'дилер',
  SUPPLIER: 'поставщик',
  MARKET_PARTICIPANT: 'участник рынка',
  POTENTIAL_COMPETITOR: 'потенциальный конкурент',
};

export const CHANGE_TYPE_LABEL: Record<string, string> = {
  product_added: 'товар добавлен',
  product_removed: 'товар убран',
  category_changed: 'категории изменены',
  section_changed: 'раздел изменён',
  vacancy_added: 'вакансия появилась',
  vacancy_removed: 'вакансия снята',
};

export const SECTION_TYPE_LABEL: Record<string, string> = {
  catalog: 'каталог',
  news: 'новости',
  vacancies: 'вакансии',
  about: 'о компании',
  prices: 'цены',
};

export const RUN_STATUS: Record<string, { label: string; tone: Tone }> = {
  success: { label: 'успешно', tone: 'success' },
  partial: { label: 'частично', tone: 'attention' },
  failed: { label: 'отказ', tone: 'critical' },
  running: { label: 'выполняется', tone: 'accent' },
};

export const PERIOD_OPTIONS = [
  { value: '1', label: 'сутки' },
  { value: '7', label: '7 дней' },
  { value: '30', label: '30 дней' },
  { value: '90', label: '90 дней' },
];

export const DEFAULT_PERIOD_DAYS = 30;

/**
 * Порог, ниже которого проценты не сравниваются с нормой. Отсев 88 % от восьми
 * материалов — не отклонение, а арифметика; правило записано в документе и
 * повторено здесь, чтобы интерфейс не показывал тревогу на пустом месте.
 */
export function isVolumeEnough(volume: number, minimum: number): boolean {
  return volume >= minimum;
}

export function severityFromParam(value: string | undefined): Severity[] {
  if (!value) return [];
  return value
    .split(',')
    .map((v) => Number.parseInt(v, 10))
    .filter((n) => n >= 1 && n <= 5) as Severity[];
}

/**
 * Откуда пришёл лот. Название площадки говорит человеку больше, чем внутренний
 * код источника: лоты из разных площадок ведут себя по-разному — на одной есть
 * срок приёма заявок сразу, на другой он появляется позже.
 */
const TENDER_SOURCE_LABEL: Record<string, string> = {
  goszakup: 'goszakup.gov.kz',
  tenderbot: 'tenderbot.kz',
  tender_api: 'внешний API закупок',
};

export function tenderSourceLabel(source: string | null | undefined): string {
  if (!source) return 'источник не указан';
  return TENDER_SOURCE_LABEL[source] ?? source;
}
