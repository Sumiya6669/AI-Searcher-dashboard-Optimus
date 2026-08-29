import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';
import type { Tone } from '@/lib/domain';

const VALUE_TONE: Record<Tone, string> = {
  critical: 'text-[var(--color-critical)]',
  warning: 'text-[var(--color-warning)]',
  attention: 'text-[var(--color-attention)]',
  success: 'text-[var(--color-success)]',
  accent: 'text-[var(--color-accent-ink)]',
  neutral: 'text-[var(--color-ink)]',
};

const ACCENT_LINE: Record<Tone, string> = {
  critical: 'bg-[var(--color-critical)]',
  warning: 'bg-[var(--color-warning)]',
  attention: 'bg-[var(--color-attention)]',
  success: 'bg-[var(--color-success)]',
  accent: 'bg-[var(--color-accent)]',
  neutral: 'bg-transparent',
};

export interface KpiProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: Tone;
  href?: string;
}

export function KpiCard({ label, value, hint, tone = 'neutral', href }: KpiProps) {
  const body = (
    <>
      {/* Цветная засечка вместо цветного числа там, где показатель нейтрален:
          красная цифра «19 открытых лотов» пугает без повода. */}
      <span aria-hidden className={cn('absolute inset-x-0 top-0 h-0.5', ACCENT_LINE[tone])} />
      <p className="eyebrow flex items-center gap-1">
        <span className="truncate">{label}</span>
        {href ? (
          <ArrowRight
            size={11}
            strokeWidth={2.2}
            className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
          />
        ) : null}
      </p>
      <p className={cn('figure mt-2 text-[30px] font-semibold', VALUE_TONE[tone])}>{value}</p>
      {hint ? <p className="mt-1.5 text-[12px] leading-4 text-[var(--color-ink-3)]">{hint}</p> : null}
    </>
  );

  const shell = 'group relative block min-w-0 bg-[var(--color-card)] px-4 py-3.5';

  if (href) {
    return (
      <Link href={href} className={cn(shell, 'transition-colors hover:bg-[var(--color-raise)]')}>
        {body}
      </Link>
    );
  }
  return <div className={shell}>{body}</div>;
}

export function KpiRow({ items }: { items: KpiProps[] }) {
  return (
    <div
      className={cn(
        'grid gap-px overflow-hidden rounded-xl border border-[var(--color-line)] bg-[var(--color-line)] shadow-[var(--shadow-card)]',
        items.length >= 5 ? 'sm:grid-cols-2 lg:grid-cols-5' : 'sm:grid-cols-2 lg:grid-cols-4',
      )}
    >
      {items.map((item) => (
        <KpiCard key={item.label} {...item} />
      ))}
    </div>
  );
}
