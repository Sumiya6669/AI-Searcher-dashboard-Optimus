/**
 * Форматирование. Часовой пояс один на всё приложение — Asia/Almaty; он же
 * UTC+5, тот самый, в котором работают сценарии n8n. Разные пояса в разных
 * местах интерфейса означают, что «в 08:30» перестаёт быть одним временем.
 */

export const APP_TIMEZONE = 'Asia/Almaty';

const dateTimeFmt = new Intl.DateTimeFormat('ru-RU', {
  timeZone: APP_TIMEZONE,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const dateFmt = new Intl.DateTimeFormat('ru-RU', {
  timeZone: APP_TIMEZONE,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const shortFmt = new Intl.DateTimeFormat('ru-RU', {
  timeZone: APP_TIMEZONE,
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

/** 28.08.2026 14:20 */
export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return dateTimeFmt.format(d).replace(',', '');
}

/** 28.08.2026 */
export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return dateFmt.format(d);
}

/** 28.08 14:20 — для плотных таблиц, где год не нужен */
export function formatShort(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return shortFmt.format(d).replace(',', '');
}

/** 1 250 000 */
export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(value).replace(/ /g, ' ');
}

/** 4 820 000 ₸ */
export function formatMoneyKzt(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return `${formatNumber(Math.round(value))} ₸`;
}

/** $0.9259 — расход на модель показывается без округления вверх */
export function formatUsd(value: number | null | undefined, digits = 2): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return `$${value.toFixed(digits)}`;
}

/** 87,3 % */
export function formatPercent(value: number | null | undefined, digits = 0): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return `${value.toFixed(digits).replace('.', ',')} %`;
}

export function formatDuration(ms: number | null | undefined): string {
  if (ms === null || ms === undefined || Number.isNaN(ms)) return '—';
  if (ms < 1000) return `${Math.round(ms)} мс`;
  const sec = ms / 1000;
  if (sec < 60) return `${sec.toFixed(1).replace('.', ',')} с`;
  const min = Math.floor(sec / 60);
  const rest = Math.round(sec % 60);
  return `${min} мин ${rest} с`;
}

/**
 * «осталось 19 ч» / «осталось 6 сут». Для срока приёма заявок человеку нужен
 * остаток, а не дата: дату он всё равно переводит в остаток в голове.
 */
export function formatHoursLeft(hours: number | null | undefined): string {
  if (hours === null || hours === undefined || Number.isNaN(hours)) return 'срок уточняется';
  if (hours <= 0) return 'приём закрыт';
  if (hours < 48) return `осталось ${Math.floor(hours)} ч`;
  return `осталось ${Math.floor(hours / 24)} сут`;
}

/** «3 минуты назад» — для строки «данные обновлены» */
export function formatRelative(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  const diffSec = Math.round((Date.now() - d.getTime()) / 1000);
  if (diffSec < 0) return 'только что';
  if (diffSec < 60) return 'меньше минуты назад';
  const min = Math.round(diffSec / 60);
  if (min < 60) return `${min} ${plural(min, 'минуту', 'минуты', 'минут')} назад`;
  const hours = Math.round(min / 60);
  if (hours < 24) return `${hours} ${plural(hours, 'час', 'часа', 'часов')} назад`;
  const days = Math.round(hours / 24);
  return `${days} ${plural(days, 'сутки', 'суток', 'суток')} назад`;
}

export function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}

export function truncate(value: string | null | undefined, max: number): string {
  if (!value) return '';
  const s = value.trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return `${lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut}…`;
}

export function hostOf(url: string | null | undefined): string {
  if (!url) return '';
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}
