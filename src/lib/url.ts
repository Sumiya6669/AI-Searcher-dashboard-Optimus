/**
 * Состояние фильтров живёт в адресе страницы, а не в памяти компонента.
 * Так фильтрация выполняется на сервере, ссылку можно переслать, а кнопка
 * «назад» браузера работает без отдельного кода.
 */

export type SearchParamsInput = Record<string, string | string[] | undefined>;

export function readParam(params: SearchParamsInput, key: string): string | undefined {
  const raw = params[key];
  if (Array.isArray(raw)) return raw[0];
  return raw;
}

export function readInt(params: SearchParamsInput, key: string, fallback: number): number {
  const raw = readParam(params, key);
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : fallback;
}

export function readList(params: SearchParamsInput, key: string): string[] {
  const raw = readParam(params, key);
  if (!raw) return [];
  return raw
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

export function buildQuery(current: SearchParamsInput, patch: Record<string, string | number | null | undefined>): string {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(current)) {
    const v = Array.isArray(value) ? value[0] : value;
    if (v !== undefined && v !== '') out.set(key, v);
  }
  for (const [key, value] of Object.entries(patch)) {
    if (value === null || value === undefined || value === '') out.delete(key);
    else out.set(key, String(value));
  }
  const s = out.toString();
  return s ? `?${s}` : '';
}

export function hasAnyFilter(params: SearchParamsInput, keys: string[]): boolean {
  return keys.some((k) => {
    const v = readParam(params, k);
    return v !== undefined && v !== '';
  });
}
