import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';
import type { Tone } from '@/lib/domain';

const TONE_CLASS: Record<Tone, string> = {
  critical: 'text-[var(--color-critical)] bg-[var(--color-critical-soft)] border-[var(--color-critical)]/25',
  warning: 'text-[var(--color-warning)] bg-[var(--color-warning-soft)] border-[var(--color-warning)]/25',
  attention: 'text-[var(--color-attention)] bg-[var(--color-attention-soft)] border-[var(--color-attention)]/25',
  success: 'text-[var(--color-success)] bg-[var(--color-success-soft)] border-[var(--color-success)]/25',
  accent: 'text-[var(--color-accent-ink)] bg-[var(--color-soft)] border-[var(--color-accent)]/25',
  neutral: 'text-[var(--color-ink-2)] bg-transparent border-[var(--color-line)]',
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
        'inline-flex shrink-0 items-center gap-1 rounded border px-1.5 py-0.5 text-[11.5px] font-semibold leading-4',
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
  return <span aria-hidden className={cn('inline-block size-2 shrink-0 rounded-full', color[tone], className)} />;
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
