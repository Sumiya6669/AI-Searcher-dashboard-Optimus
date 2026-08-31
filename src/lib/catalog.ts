import raw from '@/data/source_catalog.json';

/**
 * Каталог из двухсот источников — это описание, составленное человеком, а не
 * данные, которые система добывает. Оно не меняется от работы сборщиков, поэтому
 * лежит рядом с кодом и приезжает вместе с ним. В базе остаётся только решение
 * по каждой строке: подключено, в работе, отклонено. Держать полный текст ещё и
 * в базе означало бы поддерживать две версии одного списка и однажды обнаружить,
 * что они расходятся.
 */
export interface CatalogEntry {
  ord: number;
  name: string;
  kind: string;
  region: string;
  industries: string;
  what_you_get: string;
  project_stage: string;
  update_frequency: string;
  link: string;
  collection_method: string;
  limitations: string;
  reliability: number;
  commercial_value: number;
  priority: number;
}

export const CATALOG: readonly CatalogEntry[] = raw as CatalogEntry[];

export const CATALOG_PRIORITIES = [1, 2, 3] as const;

export function priorityLabel(priority: number): string {
  if (priority === 1) return 'первая очередь';
  if (priority === 2) return 'вторая очередь';
  return 'третья очередь';
}

/**
 * Ссылки в исходном списке записаны так, как их писал человек: иногда с
 * протоколом, иногда «epsd.kz и gosexpertiza.kz», иногда с пояснением в
 * скобках. Первую пригодную для перехода часть достаём, остальное показываем
 * текстом — выдумывать адрес за автора нельзя.
 */
export function firstUrl(link: string): string | null {
  const explicit = link.match(/https?:\/\/[^\s,;)]+/i);
  if (explicit) return explicit[0];
  const bare = link.match(/(?:^|[\s(])([a-z0-9][a-z0-9-]*(?:\.[a-z0-9-]+)+(?:\/[^\s,;)]*)?)/i);
  if (!bare?.[1]) return null;
  if (!/\.(kz|com|org|net|ru|uz|int|info|gov|io|kg)\b/i.test(bare[1])) return null;
  return `https://${bare[1]}`;
}

export const CATALOG_KINDS: readonly string[] = Array.from(
  new Set(CATALOG.map((entry) => entry.kind).filter(Boolean)),
).sort((a, b) => a.localeCompare(b, 'ru'));
