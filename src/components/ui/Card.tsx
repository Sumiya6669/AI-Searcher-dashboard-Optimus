import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    // min-w-0 обязателен: элемент сетки по умолчанию не сжимается ниже
    // ширины содержимого, и широкая таблица внутри растягивала бы страницу
    // вместо того чтобы прокручиваться внутри карточки.
    <section
      className={cn(
        'min-w-0 overflow-hidden rounded-xl border border-[var(--color-line)] bg-[var(--color-card)] shadow-[var(--shadow-card)]',
        className,
      )}
    >
      {children}
    </section>
  );
}

export function CardHead({
  title,
  hint,
  actions,
  as: Tag = 'h2',
}: {
  title: ReactNode;
  hint?: ReactNode;
  actions?: ReactNode;
  as?: 'h2' | 'h3';
}) {
  return (
    <header className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-[var(--color-line-2)] px-4 py-2.5">
      <Tag className="min-w-0 text-[14px] font-semibold tracking-[-0.01em] text-[var(--color-ink)]">{title}</Tag>
      {hint ? (
        <p className="order-last w-full min-w-0 truncate text-[11.5px] text-[var(--color-ink-3)] sm:order-none sm:w-auto sm:flex-1">
          {hint}
        </p>
      ) : null}
      {actions ? <div className="ml-auto flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function CardBody({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('p-4', className)}>{children}</div>;
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-[22px] font-semibold leading-tight tracking-[-0.02em] text-[var(--color-ink)]">{title}</h1>
        {subtitle ? <p className="mt-1 text-[13px] text-[var(--color-ink-3)]">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="eyebrow mb-2">{children}</h3>
  );
}

export function DefinitionList({ items }: { items: Array<{ term: string; value: ReactNode }> }) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-[minmax(140px,180px)_1fr]">
      {items.map((item) => (
        <div key={item.term} className="contents">
          <dt className="text-[13px] text-[var(--color-ink-3)]">{item.term}</dt>
          <dd className="mb-2 text-[14px] text-[var(--color-ink)] sm:mb-0">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
