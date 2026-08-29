'use client';

import { LogOut, Menu, RefreshCw, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { Clock } from './Clock';
import { GlobalSearch } from './GlobalSearch';
import { NotificationCenter, type NotificationItem } from './NotificationCenter';
import { SidebarBrand, SidebarNav } from './Sidebar';
import { ThemeToggle } from './ThemeToggle';
import { cn } from '@/lib/cn';
import { formatRelative } from '@/lib/format';
import type { AppUser } from '@/lib/types';

export function Header({
  user,
  notifications,
  generatedAt,
}: {
  user: AppUser;
  notifications: NotificationItem[];
  generatedAt: string;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-[var(--color-line)] bg-[var(--color-card)]/90 px-3 backdrop-blur lg:px-5">
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="Открыть меню"
          className="flex size-8 items-center justify-center rounded-md text-[var(--color-ink-2)] hover:bg-[var(--color-line-2)] lg:hidden"
        >
          <Menu size={17} strokeWidth={1.9} />
        </button>

        <div className="flex-1">
          <GlobalSearch />
        </div>

        <div className="hidden items-center gap-3 pr-1 md:flex">
          <Clock />
          <span
            className="hidden border-l border-[var(--color-line)] pl-3 text-[11.5px] text-[var(--color-ink-3)] xl:inline"
            title="Время последнего чтения данных"
          >
            обновлено {formatRelative(generatedAt)}
          </span>
        </div>

        <button
          type="button"
          aria-label="Обновить данные"
          title="Обновить данные"
          onClick={() => startTransition(() => router.refresh())}
          className="flex size-8 items-center justify-center rounded-md text-[var(--color-ink-2)] hover:bg-[var(--color-line-2)]"
        >
          <RefreshCw size={15} strokeWidth={1.9} className={cn(pending && 'animate-spin')} />
        </button>

        <NotificationCenter items={notifications} />
        <ThemeToggle initial={user.theme} />

        <div className="relative">
          <button
            type="button"
            onClick={() => setUserOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={userOpen}
            className="flex h-8 items-center gap-1.5 rounded-md border border-[var(--color-line)] px-2 text-[12.5px] text-[var(--color-ink)] hover:bg-[var(--color-line-2)]"
          >
            <User size={14} strokeWidth={1.9} />
            <span className="hidden max-w-32 truncate sm:inline">{user.full_name ?? user.email}</span>
          </button>
          {userOpen ? (
            <div
              role="menu"
              className="absolute right-0 z-40 mt-1 w-56 rounded-md border border-[var(--color-line)] bg-[var(--color-card)] py-1 shadow-lg"
            >
              <p className="px-3 py-1.5 text-[12px] text-[var(--color-ink-3)]">
                {user.email}
                <br />
                роль: {user.role === 'admin' ? 'администратор' : 'пользователь'}
              </p>
              <div className="my-1 border-t border-[var(--color-line-2)]" />
              <Link
                href="/settings"
                role="menuitem"
                onClick={() => setUserOpen(false)}
                className="block px-3 py-1.5 text-[13px] text-[var(--color-ink)] hover:bg-[var(--color-line-2)]"
              >
                Настройки
              </Link>
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  role="menuitem"
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px] text-[var(--color-ink)] hover:bg-[var(--color-line-2)]"
                >
                  <LogOut size={13} strokeWidth={1.9} />
                  Выйти
                </button>
              </form>
            </div>
          ) : null}
        </div>
      </header>

      {menuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Закрыть меню"
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 bg-black/40"
          />
          <div className="absolute left-0 top-0 h-full w-64 border-r border-[var(--color-line)] bg-[var(--color-card)]">
            <SidebarBrand />
            <SidebarNav role={user.role} onNavigate={() => setMenuOpen(false)} />
          </div>
        </div>
      ) : null}
    </>
  );
}
