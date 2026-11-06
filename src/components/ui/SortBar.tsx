import { ArrowDown, ArrowUp } from 'lucide-react';
import Link from 'next/link';

import { cn } from '@/lib/cn';
import { buildQuery, type SearchParamsInput } from '@/lib/url';

export interface SortOption {
  /** Ключ сортировки без знака. В адресе «-ключ» означает по убыванию. */
  key: string;
  label: string;
  /**
   * Куда вести первое нажатие. У важности и даты осмысленно начинать с
   * убывания: человек открывает список, чтобы увидеть сначала самое важное
   * и самое свежее. У срока подачи наоборот — сверху то, что горит.
   */
  firstDesc?: boolean;
}

/**
 * Полоса сортировки для списков, которые выводятся карточками, а не
 * таблицей: в таблице ту же работу делают заголовки столбцов (Th).
 *
 * Порядок хранится в адресе страницы, как и фильтры: ссылку со своим
 * порядком можно переслать, а кнопка «назад» работает без отдельного кода.
 * Фильтры при этом не трогаются — сортировка только переставляет то, что
 * уже отобрано.
 */
export function SortBar({
  options,
  params,
  fallback,
  className,
}: {
  options: SortOption[];
  params: SearchParamsInput;
  /** Порядок, который действует, пока в адресе ничего не выбрано. */
  fallback?: string;
  className?: string;
}) {
  const raw = params.sort;
  const current = (Array.isArray(raw) ? raw[0] : raw) || fallback || '';

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-1 border-b border-[var(--color-line-2)] px-4 py-2',
        className,
      )}
    >
      <span className="mr-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--color-ink-3)]">
        Сортировка
      </span>
      {options.map((option) => {
        const isActive = current === option.key || current === `-${option.key}`;
        const isDesc = current === `-${option.key}`;
        const first = option.firstDesc === false ? option.key : `-${option.key}`;
        const next = isActive ? (isDesc ? option.key : `-${option.key}`) : first;

        return (
          <Link
            key={option.key}
            href={buildQuery(params, { sort: next, page: null })}
            aria-current={isActive ? 'true' : undefined}
            title={
              isActive
                ? isDesc
                  ? 'сейчас по убыванию, нажмите для возрастания'
                  : 'сейчас по возрастанию, нажмите для убывания'
                : `упорядочить по: ${option.label.toLowerCase()}`
            }
            className={cn(
              'inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-[12.5px] font-medium transition-colors',
              isActive
                ? 'border-[var(--color-line-strong)] bg-[var(--color-raise)] text-[var(--color-ink)]'
                : 'border-transparent text-[var(--color-ink-2)] hover:border-[var(--color-line)] hover:text-[var(--color-ink)]',
            )}
          >
            {option.label}
            {isActive ? (
              isDesc ? (
                <ArrowDown size={12} aria-label="по убыванию" />
              ) : (
                <ArrowUp size={12} aria-label="по возрастанию" />
              )
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}
