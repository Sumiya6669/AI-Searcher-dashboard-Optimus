import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';
import type { Tone } from '@/lib/domain';

/*
  Значок — заливка без обводки. Обводка вокруг цветной подложки добавляет
  третью линию на и без того плотном экране и делает значок тяжелее строки,
  которую он поясняет.
*/
const TONE_CLASS: Record<Tone, string> = {
  critical: 'text-[var(--color-critical)] bg-[var(--color-critical-soft)]',
  warning: 'text-[var(--color-warning)] bg-[var(--color-warning-soft)]',
  attention: 'text-[var(--color-attention)] bg-[var(--color-attention-soft)]',
  success: 'text-[var(--color-success)] bg-[var(--color-success-soft)]',
  accent: 'text-[var(--color-accent-ink)] bg-[var(--color-soft)]',
  neutral: 'text-[var(--color-ink-2)] bg-[var(--color-line-2)]',
};

export function Badge({
  tone = 'neutral',
  children,
  className,
  title,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-md px-1.5 py-[3px] text-[11px] font-semibold leading-[14px]',
        TONE_CLASS[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Dot({ tone = 'neutral', className }: { tone?: Tone; className?: string }) {
  const color: Record<Tone, string> = {
    critical: 'bg-[var(--color-critical)]',
    warning: 'bg-[var(--color-warning)]',
    attention: 'bg-[var(--color-attention)]',
    success: 'bg-[var(--color-success)]',
    accent: 'bg-[var(--color-accent)]',
    neutral: 'bg-[var(--color-ink-3)]',
  };
  return <span aria-hidden className={cn('inline-block size-1.5 shrink-0 rounded-full', color[tone], className)} />;
}

const RAIL_TONE: Record<Tone, string> = {
  critical: 'bg-[var(--color-critical)]',
  warning: 'bg-[var(--color-warning)]',
  attention: 'bg-[var(--color-attention)]',
  success: 'bg-[var(--color-success)]',
  accent: 'bg-[var(--color-accent)]',
  neutral: 'bg-[var(--color-line)]',
};

/**
 * Мера важности пятью делениями. Число «4/5» читается только после того, как
 * его прочли; заполненная шкала различается боковым зрением, и лента событий
 * начинает выдавать важное до того, как человек дошёл до заголовка.
 */
export function Meter({ level, tone, title }: { level: number; tone: Tone; title?: string }) {
  const filled = Math.min(5, Math.max(0, Math.round(level)));
  return (
    <span title={title} aria-label={title ?? `${filled} из 5`} role="img" className="inline-flex items-end gap-[2px]">
      {[1, 2, 3, 4, 5].map((step) => (
        <span
          key={step}
          className={cn(
            'block w-[3px] rounded-[1px]',
            step <= filled ? RAIL_TONE[tone] : 'bg-[var(--color-line)]',
            step <= 2 ? 'h-[7px]' : step === 3 ? 'h-[9px]' : step === 4 ? 'h-[11px]' : 'h-[13px]',
          )}
        />
      ))}
    </span>
  );
}

/** Полоса доли. Не график, а мера в ячейке таблицы. */
export function Bar({ value, tone = 'accent' }: { value: number; tone?: Tone }) {
  const pct = Math.max(0, Math.min(100, value));
  const color: Record<Tone, string> = {
    critical: 'bg-[var(--color-critical)]',
    warning: 'bg-[var(--color-warning)]',
    attention: 'bg-[var(--color-attention)]',
    success: 'bg-[var(--color-success)]',
    accent: 'bg-[var(--color-accent)]',
    neutral: 'bg-[var(--color-ink-3)]',
  };
  return (
    <span
      role="img"
      aria-label={`${pct.toFixed(0)} процентов`}
      className="block h-1.5 w-full min-w-14 overflow-hidden rounded-full bg-[var(--color-line-2)]"
    >
      <span className={cn('block h-full rounded-full', color[tone])} style={{ width: `${pct}%` }} />
    </span>
  );
}
