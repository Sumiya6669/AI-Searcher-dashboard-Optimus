/** «раз в 15 мин» / «раз в 3 ч» / «раз в сутки» — ожидаемая частота источника. */
export function formatInterval(minutes: number): string {
  if (minutes < 60) return `${minutes} мин`;
  if (minutes < 1440) return `${Math.round(minutes / 60)} ч`;
  const days = Math.round(minutes / 1440);
  return days === 1 ? 'сутки' : `${days} сут`;
}
