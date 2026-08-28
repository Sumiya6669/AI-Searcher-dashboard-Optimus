'use client';

import { RotateCcw, SlidersHorizontal } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';

import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterField {
  key: string;
  label: string;
  kind: 'select' | 'search';
  options?: FilterOption[];
  placeholder?: string;
}

/**
 * Фильтры пишутся в адрес страницы, поэтому отбор выполняет база, а не
 * браузер, и ссылку с готовым отбором можно переслать коллеге.
 */
export function FilterBar({ fields }: { fields: FilterField[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const [searchDraft, setSearchDraft] = useState(
    () => searchParams.get(fields.find((f) => f.kind === 'search')?.key ?? 'q') ?? '',
  );
  const searchKey = fields.find((f) => f.kind === 'search')?.key;

  useEffect(() => {
    if (!searchKey) return;
    const current = searchParams.get(searchKey) ?? '';
    if (current === searchDraft) return;
    const timer = setTimeout(() => push(searchKey, searchDraft), 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchDraft]);

  function push(key: string, value: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('page');
    startTransition(() => router.replace(`${pathname}?${next.toString()}`, { scroll: false }));
  }

  const activeCount = fields.filter((f) => (searchParams.get(f.key) ?? '') !== '').length;

  return (
    <div className="mb-3">
      <div className="flex items-center gap-2 lg:hidden">
        <Button size="sm" variant="secondary" onClick={() => setOpen((v) => !v)}>
          <SlidersHorizontal size={13} />
          Фильтры{activeCount > 0 ? ` (${activeCount})` : ''}
        </Button>
        {activeCount > 0 ? (
          <Button size="sm" variant="ghost" onClick={() => startTransition(() => router.replace(pathname))}>
            <RotateCcw size={13} />
            Сбросить
          </Button>
        ) : null}
      </div>

      <div
        className={cn(
          'mt-2 flex flex-wrap items-end gap-2 lg:mt-0 lg:flex',
          open ? 'flex' : 'hidden',
          pending && 'opacity-70',
        )}
      >
        {fields.map((field) =>
          field.kind === 'search' ? (
            <label key={field.key} className="min-w-48 flex-1">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--color-ink-3)]">
                {field.label}
              </span>
              <input
                type="search"
                value={searchDraft}
                onChange={(e) => setSearchDraft(e.target.value)}
                placeholder={field.placeholder}
                className="h-8 w-full rounded-md border border-[var(--color-line)] bg-[var(--color-card)] px-2.5 text-[13px]"
              />
            </label>
          ) : (
            <label key={field.key}>
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--color-ink-3)]">
                {field.label}
              </span>
              <select
                value={searchParams.get(field.key) ?? ''}
                onChange={(e) => push(field.key, e.target.value)}
                className="h-8 min-w-36 rounded-md border border-[var(--color-line)] bg-[var(--color-card)] px-2 text-[13px] text-[var(--color-ink)]"
              >
                <option value="">любой</option>
                {(field.options ?? []).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          ),
        )}

        <Button
          size="sm"
          variant="ghost"
          className="hidden lg:inline-flex"
          disabled={activeCount === 0}
          onClick={() => {
            setSearchDraft('');
            startTransition(() => router.replace(pathname));
          }}
        >
          <RotateCcw size={13} />
          Сбросить фильтры
        </Button>
      </div>
    </div>
  );
}
