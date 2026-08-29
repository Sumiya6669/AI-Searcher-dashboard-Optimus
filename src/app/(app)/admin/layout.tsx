import type { ReactNode } from 'react';

import { AdminTabs } from '@/components/layout/AdminTabs';
import { requireAdmin } from '@/server/auth';

/**
 * Общая оболочка администрирования. Проверка роли стоит здесь, а не в каждой
 * странице: забыть её в одной новой странице легче, чем в одном месте, через
 * которое проходят все. Это не единственный рубеж — служебные функции базы
 * сами отказывают не администратору, и маршрут в обход интерфейса ничего не
 * отдаёт.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdmin();

  return (
    <div className="space-y-5">
      <div>
        <p className="eyebrow mb-2">Администрирование</p>
        <AdminTabs />
      </div>
      {children}
    </div>
  );
}
