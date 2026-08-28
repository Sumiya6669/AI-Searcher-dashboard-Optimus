'use client';

import {
  Building2,
  Gauge,
  Gavel,
  Newspaper,
  Radio,
  Settings,
  ShieldCheck,
  Tags,
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

export const NAV: NavGroup[] = [
  {
    title: 'Главное',
    items: [{ href: '/dashboard', label: 'Дашборд', icon: Gauge }],
  },
  {
    title: 'Мониторинг',
    items: [
      { href: '/events', label: 'События', icon: Newspaper },
      { href: '/competitors', label: 'Конкуренты', icon: Building2 },
      { href: '/brands', label: 'Бренды и направления', icon: Tags },
      { href: '/tenders', label: 'Госзакупки', icon: Gavel },
      { href: '/sources', label: 'Источники', icon: Radio },
    ],
  },
  {
    title: 'Администрирование',
    items: [
      { href: '/admin', label: 'Система', icon: ShieldCheck, adminOnly: true },
      { href: '/settings', label: 'Настройки', icon: Settings },
    ],
  },
];

export function SidebarNav({ role, onNavigate }: { role: AppRole; onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Основная навигация" className="flex flex-col gap-5 p-3">
      {NAV.map((group) => {
        const items = group.items.filter((item) => !item.adminOnly || role === 'admin');
        if (items.length === 0) return null;
        return (
          <div key={group.title}>
            <p className="mb-1.5 px-2 text-[10.5px] font-bold uppercase tracking-[0.1em] text-[var(--color-ink-3)]">
              {group.title}
            </p>
            <ul className="space-y-0.5">
              {items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[13.5px] transition-colors',
                        active
                          ? 'bg-[var(--color-soft)] font-semibold text-[var(--color-accent-ink)]'
                          : 'text-[var(--color-ink-2)] hover:bg-[var(--color-line-2)] hover:text-[var(--color-ink)]',
                      )}
                    >
                      <Icon size={15} strokeWidth={1.8} className="shrink-0" />
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
    <div className="flex h-12 items-center gap-2 border-b border-[var(--color-line)] px-4">
      <span className="flex size-6 items-center justify-center rounded bg-[var(--color-accent)] text-[11px] font-bold text-white dark:text-[#101215]">
        AI
      </span>
      <span className="text-[13.5px] font-semibold tracking-[-0.01em]">AI MultiSystem</span>
      {children}
    </div>
  );
}
