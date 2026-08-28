'use client';

import { Loader2, Search, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/cn';
import type { SearchHit } from '@/lib/types';

const KIND_LABEL: Record<SearchHit['kind'], string> = {
  event: 'Событие',
  competitor: 'Конкурент',
  brand: 'Бренд или тема',
  tender: 'Закупка',
  source: 'Источник',
};

export function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [state, setState] = useState<'idle' | 'loading' | 'error'>('idle');
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setHits([]);
      setState('idle');
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setState('loading');
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`, { signal: controller.signal });
        if (!res.ok) throw new Error('search failed');
        const data = (await res.json()) as { hits: SearchHit[] };
        setHits(data.hits);
        setState('idle');
      } catch (error) {
        if ((error as Error).name === 'AbortError') return;
        setState('error');
      }
    }, 220);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (!boxRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
      if (event.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        event.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    }
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const grouped = hits.reduce<Record<string, SearchHit[]>>((acc, hit) => {
    const list = acc[hit.kind] ?? [];
    list.push(hit);
    acc[hit.kind] = list;
    return acc;
  }, {});

  return (
    <div ref={boxRef} className="relative w-full max-w-md">
      <label className="relative flex items-center">
        <span className="sr-only">Поиск по событиям, конкурентам, брендам, закупкам и источникам</span>
        <Search size={14} className="pointer-events-none absolute left-2.5 text-[var(--color-ink-3)]" strokeWidth={1.9} />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Поиск: бренд, конкурент, лот, событие"
          className="h-8 w-full rounded-md border border-[var(--color-line)] bg-[var(--color-card)] pl-8 pr-8 text-[13px] text-[var(--color-ink)] placeholder:text-[var(--color-ink-3)]"
        />
        {query ? (
          <button
            type="button"
            aria-label="Очистить поиск"
            onClick={() => {
              setQuery('');
              setHits([]);
            }}
            className="absolute right-2 text-[var(--color-ink-3)] hover:text-[var(--color-ink)]"
          >
            <X size={13} />
          </button>
        ) : null}
        {state === 'loading' ? (
          <Loader2 size={13} className="absolute right-8 animate-spin text-[var(--color-ink-3)]" />
        ) : null}
      </label>

      {open && query.trim().length >= 2 ? (
        <div
          role="listbox"
          className="thin-scroll absolute z-40 mt-1 max-h-[70vh] w-full overflow-auto rounded-md border border-[var(--color-line)] bg-[var(--color-card)] shadow-lg"
        >
          {state === 'error' ? (
            <p className="px-3 py-3 text-[13px] text-[var(--color-critical)]">Поиск недоступен. Повторите попытку.</p>
          ) : hits.length === 0 && state === 'idle' ? (
            <p className="px-3 py-3 text-[13px] text-[var(--color-ink-2)]">Ничего не найдено</p>
          ) : (
            Object.entries(grouped).map(([kind, list]) => (
              <div key={kind} className="border-b border-[var(--color-line-2)] last:border-b-0">
                <p className="px-3 pt-2 text-[10.5px] font-bold uppercase tracking-[0.09em] text-[var(--color-ink-3)]">
                  {KIND_LABEL[kind as SearchHit['kind']]}
                </p>
                <ul>
                  {list.map((hit) => (
                    <li key={`${hit.kind}-${hit.id}`}>
                      <Link
                        href={hit.href}
                        onClick={() => setOpen(false)}
                        className="flex items-baseline gap-2 px-3 py-1.5 hover:bg-[var(--color-line-2)]"
                      >
                        <span className="flex-1 truncate text-[13px] text-[var(--color-ink)]">{hit.title}</span>
                        {hit.subtitle ? (
                          <span className={cn('max-w-[45%] truncate text-[12px] text-[var(--color-ink-3)]')}>
                            {hit.subtitle}
                          </span>
                        ) : null}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
