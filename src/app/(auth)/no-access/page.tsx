import type { Metadata } from 'next';

import { Button } from '@/components/ui/Button';

export const metadata: Metadata = { title: 'Доступ не выдан' };

export default function NoAccessPage() {
  return (
    <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-card)] p-5">
      <h1 className="text-[17px] font-semibold">Доступ не выдан</h1>
      <p className="mt-1 text-[13px] text-[var(--color-ink-2)]">
        Учётная запись создана, но администратор ещё не открыл ей доступ к данным. Это не ошибка входа: вход выполнен,
        а право видеть мониторинг выдаётся отдельно.
      </p>
      <p className="mt-3 text-[13px] text-[var(--color-ink-2)]">
        Обратитесь к администратору системы. Пока доступ не выдан, база не отдаёт приложению ни одной строки — так
        задумано.
      </p>
      <form action="/auth/signout" method="post" className="mt-4">
        <Button type="submit" variant="secondary" size="sm">
          Выйти
        </Button>
      </form>
    </div>
  );
}
