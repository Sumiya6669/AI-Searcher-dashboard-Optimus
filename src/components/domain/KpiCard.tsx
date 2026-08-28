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
      <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--color-ink-3)]">{label}</p>
      <p className={cn('tabular mt-1 text-[27px] font-semibold leading-8 tracking-[-0.02em]', VALUE_TONE[tone])}>
        {value}
      </p>
      {hint ? <p className="mt-0.5 text-[12.5px] text-[var(--color-ink-2)]">{hint}</p> : null}
    </>
  );

  if (href) {
    return (
      <Link href={href} className="block bg-[var(--color-card)] p-4 transition-colors hover:bg-[var(--color-line-2)]/50">
        {body}
      </Link>
    );
  }
  return <div className="bg-[var(--color-card)] p-4">{body}</div>;
}

export function KpiRow({ items }: { items: KpiProps[] }) {
  return (
    <div
      className={cn(
        'grid gap-px overflow-hidden rounded-lg border border-[var(--color-line)] bg-[var(--color-line-2)]',
        items.length >= 5 ? 'sm:grid-cols-2 lg:grid-cols-5' : 'sm:grid-cols-2 lg:grid-cols-4',
      )}
    >
      {items.map((item) => (
        <KpiCard key={item.label} {...item} />
      ))}
    </div>
  );
}
