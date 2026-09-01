'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/cn';

const TABS = [
  { href: '/admin', label: 'Состояние системы', hint: 'запуски, отказы, расход, доставка' },
  { href: '/admin/sources', label: 'Источники и сбор', hint: 'откуда идёт материал и что просело' },
  { href: '/admin/catalog', label: 'Каталог источников', hint: 'список наблюдения и решения по нему' },
  { href: '/admin/directions', label: 'Направления', hint: 'что считать новостью и на каком рынке' },
  { href: '/admin/scoring', label: 'Веса оценки', hint: 'из чего собирается балл записи' },
  { href: '/admin/semantics', label: 'Семантика', hint: 'под какие объекты подходит номенклатура' },
  { href: '/admin/integrations', label: 'Интеграции', hint: 'внешние ключи и что чем ограничено' },
  { href: '/admin/people', label: 'Люди и группы', hint: 'доступ и адресаты рассылки' },
];

export function AdminTabs() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Разделы администрирования"
      className="thin-scroll -mx-3 flex gap-1 overflow-x-auto px-3 lg:mx-0 lg:px-0"
    >
      {TABS.map((tab) => {
        const active = tab.href === '/admin' ? pathname === '/admin' : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? 'page' : undefined}
            title={tab.hint}
            className={cn(
              'shrink-0 rounded-lg border px-3 py-1.5 text-[13px] transition-colors',
              active
                ? 'border-[var(--color-accent)]/40 bg-[var(--color-soft)] font-semibold text-[var(--color-accent-ink)]'
                : 'border-[var(--color-line)] bg-[var(--color-card)] text-[var(--color-ink-2)] hover:text-[var(--color-ink)]',
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
