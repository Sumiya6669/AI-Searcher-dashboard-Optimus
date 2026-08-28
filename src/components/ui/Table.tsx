import Link from 'next/link';
import { ArrowDown, ArrowUp } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';
import { buildQuery, type SearchParamsInput } from '@/lib/url';

/**
 * Таблица одна на все страницы. Заголовок закреплён, строка кликабельна,
 * на узком экране таблица прокручивается по горизонтали, а не ломает вёрстку.
 */
export function TableWrap({ children }: { children: ReactNode }) {
  return (
    <div className="thin-scroll max-h-[calc(100vh-14rem)] overflow-auto">
      <table className="w-full border-collapse text-[13.5px]">{children}</table>
    </div>
  );
}

export function Th({
  children,
  numeric,
  className,
  sortKey,
  currentSort,
  params,
  width,
}: {
  children: ReactNode;
  numeric?: boolean;
  className?: string;
  sortKey?: string;
  currentSort?: string;
  params?: SearchParamsInput;
  width?: string;
}) {
  const base = cn(
    'sticky top-0 z-10 border-b border-[var(--color-line)] bg-[var(--color-card)] px-3 pb-2 pt-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--color-ink-3)]',
    numeric ? 'text-right' : 'text-left',
    className,
  );

  if (!sortKey || !params) {
    return (
      <th scope="col" className={base} style={width ? { width } : undefined}>
        {children}
      </th>
    );
  }

  const isActive = currentSort === sortKey || currentSort === `-${sortKey}`;
  const isDesc = currentSort === `-${sortKey}`;
  const next = isActive && isDesc ? sortKey : `-${sortKey}`;

  return (
    <th scope="col" className={base} style={width ? { width } : undefined} aria-sort={isActive ? (isDesc ? 'descending' : 'ascending') : 'none'}>
      <Link
        href={buildQuery(params, { sort: next, page: null })}
        className={cn('inline-flex items-center gap-1 hover:text-[var(--color-ink)]', isActive && 'text-[var(--color-ink)]')}
      >
        {children}
        {isActive ? isDesc ? <ArrowDown size={12} /> : <ArrowUp size={12} /> : null}
      </Link>
    </th>
  );
}

export function Td({
  children,
  numeric,
  className,
  colSpan,
}: {
  children: ReactNode;
  numeric?: boolean;
  className?: string;
  colSpan?: number;
}) {
  return (
    <td
      colSpan={colSpan}
      className={cn(
        'border-b border-[var(--color-line-2)] px-3 py-2.5 align-top',
        numeric && 'tabular text-right whitespace-nowrap',
        className,
      )}
    >
      {children}
    </td>
  );
}

export function Tr({
  children,
  href,
  className,
}: {
  children: ReactNode;
  href?: string;
  className?: string;
}) {
  return (
    <tr className={cn('group hover:bg-[var(--color-line-2)]/60', href && 'cursor-pointer', className)}>
      {children}
    </tr>
  );
}

/** Ячейка-ссылка: делает строку доступной с клавиатуры, не оборачивая tr в тег a. */
export function LinkCell({
  href,
  children,
  className,
  numeric,
}: {
  href: string;
  children: ReactNode;
  className?: string;
  numeric?: boolean;
}) {
  return (
    <Td numeric={numeric} className={className}>
      <Link href={href} className="block font-medium text-[var(--color-ink)] hover:text-[var(--color-accent-ink)] hover:underline">
        {children}
      </Link>
    </Td>
  );
}

export function Pagination({
  params,
  page,
  pageSize,
  total,
}: {
  params: SearchParamsInput;
  page: number;
  pageSize: number;
  total: number;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  return (
    <nav
      aria-label="Постраничная навигация"
      className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--color-line-2)] px-4 py-2.5 text-[12.5px] text-[var(--color-ink-2)]"
    >
      <span className="tabular">
        {from}–{to} из {total}
      </span>
      <span className="flex items-center gap-1">
        <PageLink params={params} page={page - 1} disabled={page <= 1} label="Назад" />
        <span className="tabular px-1.5">
          {page} / {pages}
        </span>
        <PageLink params={params} page={page + 1} disabled={page >= pages} label="Вперёд" />
      </span>
    </nav>
  );
}

function PageLink({
  params,
  page,
  disabled,
  label,
}: {
  params: SearchParamsInput;
  page: number;
  disabled: boolean;
  label: string;
}) {
  if (disabled) {
    return (
      <span aria-disabled className="rounded border border-[var(--color-line-2)] px-2 py-1 text-[var(--color-ink-3)]">
        {label}
      </span>
    );
  }
  return (
    <Link
      href={buildQuery(params, { page })}
      className="rounded border border-[var(--color-line)] px-2 py-1 text-[var(--color-ink)] hover:bg-[var(--color-line-2)]"
    >
      {label}
    </Link>
  );
}
