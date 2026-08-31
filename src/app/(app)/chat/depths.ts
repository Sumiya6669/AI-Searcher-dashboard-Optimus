/**
 * Глубина поиска. Три значения вместо свободного поля: за пределами двух
 * месяцев материал перестаёт быть новостью, а внутри недели его слишком мало,
 * чтобы ответ был содержательным.
 */
export const DEPTHS = [
  { days: 7, label: 'неделя' },
  { days: 21, label: 'три недели' },
  { days: 60, label: 'два месяца' },
] as const;

export const DEPTH_DAYS: readonly number[] = DEPTHS.map((d) => d.days);
export const DEFAULT_DAYS = 21;
