import type { ReactNode } from 'react';

import { Logo } from '@/components/layout/Logo';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[var(--color-bg)] px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6">
          <Logo size="lg" />
          <p className="mt-2 text-[12px] text-[var(--color-ink-3)]">
            Мониторинг отрасли и закупок · Optimus-kz
          </p>
        </div>
        {children}
      </div>
    </main>
  );
}
