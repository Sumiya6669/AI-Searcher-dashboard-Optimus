'use client';

import {
  Building2,
  Gauge,
  Gavel,
  KeyRound,
  Library,
  ListTree,
  MessageSquare,
  Newspaper,
  Radio,
  Settings,
  ShieldCheck,
  Tags,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';
import type { AppRole } from '@/lib/types';

interface NavItem {
  href: string;
  label: string;
  icon: typeof Gauge;
  adminOnly?: boolean;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

/**
 * Разделы мониторинга открыты всем, кто вошёл. Всё, что описывает не рынок, а
 * саму систему — состояние сбора, здоровье источников, запуски, расход,
 * пользователи и группы, — живёт в администрировании: сотруднику по продажам
 * незачем видеть, что вчера ночью падал сценарий, а вопрос «всё ли работает»
 * адресован дежурному, а не ему.
 */
export const NAV: NavGroup[] = [
  {
    title: 'Главное',
    items: [
      { href: '/dashboard', label: 'Дашборд', icon: Gauge },
      { href: '/chat', label: 'Чат', icon: MessageSquare },
    ],
  },
  {
    title: 'Мониторинг',
    items: [
      { href: '/events', label: 'События', icon: Newspaper },
      { href: '/competitors', label: 'Конкуренты', icon: Building2 },
      { href: '/brands', label: 'Бренды и направления', icon: Tags },
      { href: '/tenders', label: 'Госзакупки', icon: Gavel },
    ],
  },
  {
    title: 'Администрирование',
    items: [
      { href: '/admin', label: 'Состояние системы', icon: ShieldCheck, adminOnly: true },
      { href: '/admin/sources', label: 'Источники и сбор', icon: Radio, adminOnly: true },
      { href: '/admin/catalog', label: 'Каталог источников', icon: Library, adminOnly: true },
      { href: '/admin/semantics', label: 'Семантика', icon: ListTree, adminOnly: true },
      { href: '/admin/integrations', label: 'Интеграции', icon: KeyRound, adminOnly: true },
      { href: '/admin/people', label: 'Люди и группы', icon: Users, adminOnly: true },
      { href: '/settings', label: 'Мой профиль', icon: Settings },
    ],
  },
];

const ALL_HREFS = NAV.flatMap((group) => group.items.map((item) => item.href));

/**
 * Подсвечивается самый длинный подходящий адрес. Простое «начинается с» зажгло
 * бы «Состояние системы» на всех вложенных в /admin разделах сразу.
 */
function activeHref(pathname: string): string | null {
  const matches = ALL_HREFS.filter((href) => pathname === href || pathname.startsWith(`${href}/`));
  if (matches.length === 0) return null;
  return matches.reduce((best, href) => (href.length > best.length ? href : best));
}

export function SidebarNav({ role, onNavigate }: { role: AppRole; onNavigate?: () => void }) {
  const pathname = usePathname();
  const current = activeHref(pathname);

  return (
    <nav aria-label="Основная навигация" className="flex flex-col gap-6 p-3">
      {NAV.map((group) => {
        const items = group.items.filter((item) => !item.adminOnly || role === 'admin');
        if (items.length === 0) return null;
        return (
          <div key={group.title}>
            <p className="eyebrow mb-2 px-2">{group.title}</p>
            <ul className="space-y-px">
              {items.map((item) => {
                const active = current === item.href;
                const Icon = item.icon;
                return (
                  <li key={item.href} className="relative">
                    {active ? (
                      <span
                        aria-hidden
                        className="absolute inset-y-1 left-0 w-[2px] rounded-full bg-[var(--color-accent)]"
                      />
                    ) : null}
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13px] transition-colors',
                        active
                          ? 'bg-[var(--color-soft)] font-semibold text-[var(--color-accent-ink)]'
                          : 'text-[var(--color-ink-2)] hover:bg-[var(--color-line-2)] hover:text-[var(--color-ink)]',
                      )}
                    >
                      <Icon size={15} strokeWidth={1.9} className="shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}

export function SidebarBrand({ children }: { children?: ReactNode }) {
  return (
    <div className="flex h-14 items-center gap-2.5 border-b border-[var(--color-line)] px-4">
      <span className="flex size-7 items-center justify-center rounded-lg bg-[var(--color-accent)] text-[11px] font-bold text-white">
        AI
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[13.5px] font-semibold leading-4 tracking-[-0.01em]">AI MultiSystem</span>
        <span className="block truncate text-[11px] leading-4 text-[var(--color-ink-3)]">Optimus-kz</span>
      </span>
      {children}
    </div>
  );
}
