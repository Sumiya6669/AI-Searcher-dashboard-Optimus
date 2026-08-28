'use client';

import { Bell } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import { Badge, Dot } from '@/components/ui/Badge';
import type { Tone } from '@/lib/domain';
import { formatRelative } from '@/lib/format';

export interface NotificationItem {
  id: string;
  tone: Tone;
  kind: 'event' | 'tender' | 'workflow' | 'source';
  title: string;
  detail: string;
  at: string | null;
  href: string;
}

const KIND_LABEL: Record<NotificationItem['kind'], string> = {
  event: 'событие',
  tender: 'закупка',
  workflow: 'сценарий',
  source: 'источник',
};

/**
 * В центр уведомлений попадает только то, на что человек может отреагировать:
 * критичные события, срочные закупки, отказы сценариев и источников.
 * Информационный фон здесь не нужен — иначе счётчик перестают замечать.
 */
export function NotificationCenter({ items }: { items: NotificationItem[] }) {
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (!boxRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const urgent = items.filter((item) => item.tone === 'critical').length;

  return (
    <div ref={boxRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`Требует внимания: ${items.length}`}
        className="relative flex size-8 items-center justify-center rounded-md text-[var(--color-ink-2)] hover:bg-[var(--color-line-2)]"
      >
        <Bell size={15} strokeWidth={1.9} />
        {items.length > 0 ? (
          <span
            className={`tabular absolute -right-0.5 -top-0.5 min-w-4 rounded-full px-1 text-[10px] font-bold leading-4 text-white dark:text-[#101215] ${
              urgent > 0 ? 'bg-[var(--color-critical)]' : 'bg-[var(--color-accent)]'
            }`}
          >
            {items.length}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Требует внимания"
          className="thin-scroll absolute right-0 z-40 mt-1 max-h-[70vh] w-80 overflow-auto rounded-md border border-[var(--color-line)] bg-[var(--color-card)] shadow-lg"
        >
          <p className="border-b border-[var(--color-line-2)] px-3 py-2 text-[11px] font-bold uppercase tracking-[0.09em] text-[var(--color-ink-3)]">
            Требует внимания
          </p>
          {items.length === 0 ? (
            <p className="px-3 py-4 text-[13px] text-[var(--color-ink-2)]">
              Ничего срочного. Критичных событий, закупок с истекающим сроком и отказов нет.
            </p>
          ) : (
            <ul>
              {items.map((item) => (
                <li key={item.id} className="border-b border-[var(--color-line-2)] last:border-b-0">
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="block px-3 py-2 hover:bg-[var(--color-line-2)]"
                  >
                    <span className="flex items-center gap-1.5">
                      <Dot tone={item.tone} />
                      <Badge tone="neutral">{KIND_LABEL[item.kind]}</Badge>
                      <span className="ml-auto text-[11.5px] text-[var(--color-ink-3)]">{formatRelative(item.at)}</span>
                    </span>
                    <span className="mt-1 block text-[13px] font-medium text-[var(--color-ink)]">{item.title}</span>
                    <span className="block text-[12.5px] text-[var(--color-ink-2)]">{item.detail}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
