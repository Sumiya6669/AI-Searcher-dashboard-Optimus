import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[var(--color-bg)] px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded bg-[var(--color-accent)] text-[12px] font-bold text-white dark:text-[#101215]">
            AI
          </span>
          <div>
            <p className="text-[15px] font-semibold leading-4">AI MultiSystem</p>
            <p className="text-[12px] text-[var(--color-ink-3)]">Мониторинг отрасли и закупок · Optimus-kz</p>
          </div>
        </div>
        {children}
      </div>
    </main>
  );
}
