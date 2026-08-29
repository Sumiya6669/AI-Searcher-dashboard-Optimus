import type { ReactNode } from 'react';

import { Clock } from '@/components/layout/Clock';
import { Header } from '@/components/layout/Header';
import { SidebarBrand, SidebarNav } from '@/components/layout/Sidebar';
import { requireUser } from '@/server/auth';
import { fetchAttentionItems } from '@/server/queries/dashboard';

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  const attention = await fetchAttentionItems(user.role === 'admin');

  return (
    <div className="flex min-h-dvh bg-[var(--color-bg)]">
      <aside className="sticky top-0 hidden h-dvh w-[236px] shrink-0 flex-col border-r border-[var(--color-line)] bg-[var(--color-sidebar)] lg:flex">
        <SidebarBrand />
        <div className="thin-scroll flex-1 overflow-y-auto">
          <SidebarNav role={user.role} />
        </div>
        <div className="border-t border-[var(--color-line)] px-4 py-3">
          <p className="eyebrow mb-1">Время Казахстана</p>
          <Clock />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          user={user}
          notifications={attention.ok ? attention.data : []}
          generatedAt={new Date().toISOString()}
        />
        <main className="mx-auto w-full min-w-0 max-w-[1560px] flex-1 overflow-x-hidden px-3 py-5 lg:px-6 lg:py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
