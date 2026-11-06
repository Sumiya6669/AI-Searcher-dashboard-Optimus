/**
 * Сортировка списков, которые приходят из базы целиком.
 *
 * Там, где выборка постраничная (события, лоты), порядок задаёт база: иначе
 * пришлось бы сортировать одну страницу из двадцати пяти строк и выдавать
 * это за порядок во всей выборке. Здесь же — вкладки, где строк заведомо
 * немного и они уже все на руках: проекты, конкуренты, бренды, каталог.
 */

export type SortValue = string | number | boolean | null | undefined;

/** Ключ в адресе пишется как «важность» или «-важность» (по убыванию). */
export function sortRows<T>(
  rows: T[],
  sort: string | undefined,
  keys: Record<string, (row: T) => SortValue>,
): T[] {
  if (!sort) return rows;
  const desc = sort.startsWith('-');
  const read = keys[desc ? sort.slice(1) : sort];
  if (!read) return rows;

  return [...rows].sort((a, b) => {
    const va = read(a);
    const vb = read(b);
    // Пустое значение уходит вниз при любом направлении: строка «дата не
    // известна» наверху списка по дате — это не порядок, а помеха.
    const ea = va === null || va === undefined || va === '';
    const eb = vb === null || vb === undefined || vb === '';
    if (ea && eb) return 0;
    if (ea) return 1;
    if (eb) return -1;

    const d =
      typeof va === 'number' && typeof vb === 'number'
        ? va - vb
        : String(va).localeCompare(String(vb), 'ru');
    return desc ? -d : d;
  });
}
