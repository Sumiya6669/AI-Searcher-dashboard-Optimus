import type { ReactNode } from 'react';

import { Header } from '@/components/layout/Header';
import { SidebarBrand, SidebarNav } from '@/components/layout/Sidebar';
import { requireUser } from '@/server/auth';
import { fetchAttentionItems } from '@/server/queries/dashboard';

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  const attention = await fetchAttentionItems(user.role === 'admin');

  return (
    <div className="flex min-h-dvh bg-[var(--color-bg)]">
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-[var(--color-line)] bg-[var(--color-card)] lg:flex">
        <SidebarBrand />
        <div className="thin-scroll flex-1 overflow-y-auto">
          <SidebarNav role={user.role} />
        </div>
        <p className="border-t border-[var(--color-line)] px-4 py-2.5 text-[11px] leading-4 text-[var(--color-ink-3)]">
          Время местное, UTC+5.
          <br />
          Сбор данных идёт в n8n.
        </p>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          user={user}
          notifications={attention.ok ? attention.data : []}
          generatedAt={new Date().toISOString()}
        />
        <main className="w-full min-w-0 max-w-full flex-1 overflow-x-hidden px-3 py-4 lg:px-6 lg:py-5">{children}</main>
      </div>
    </div>
  );
}
