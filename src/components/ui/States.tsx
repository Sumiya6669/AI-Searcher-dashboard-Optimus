import { AlertTriangle, Clock3, Inbox, ShieldAlert } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

export function LoadingSkeleton({ rows = 4, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn('animate-pulse space-y-2 p-4', className)} aria-busy="true" aria-live="polite">
      <span className="sr-only">Загрузка данных</span>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-4 rounded bg-[var(--color-line-2)]" style={{ width: `${92 - i * 9}%` }} />
      ))}
    </div>
  );
}

export function KpiSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="grid gap-px overflow-hidden rounded-lg border border-[var(--color-line)] bg-[var(--color-line-2)] sm:grid-cols-2 lg:grid-cols-5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse bg-[var(--color-card)] p-4">
          <div className="h-3 w-24 rounded bg-[var(--color-line-2)]" />
          <div className="mt-3 h-7 w-16 rounded bg-[var(--color-line-2)]" />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  hint,
  icon,
  action,
}: {
  title: string;
  hint?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center">
      <span className="text-[var(--color-ink-3)]">{icon ?? <Inbox size={22} strokeWidth={1.6} />}</span>
      <p className="text-[14px] font-medium text-[var(--color-ink)]">{title}</p>
      {hint ? <p className="max-w-md text-[13px] text-[var(--color-ink-2)]">{hint}</p> : null}
      {action}
    </div>
  );
}

/**
 * Ошибка одного блока не должна ломать остальную страницу, поэтому каждый
 * блок отображает свою ошибку сам и предлагает повтор — перезагрузкой этого
 * маршрута, а не всего приложения.
 */
export function ErrorState({ message, retryHref }: { message: string; retryHref?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
      <span className="text-[var(--color-critical)]">
        <AlertTriangle size={22} strokeWidth={1.7} />
      </span>
      <p className="text-[14px] font-medium text-[var(--color-ink)]">Не удалось загрузить данные</p>
      <p className="max-w-lg text-[12.5px] text-[var(--color-ink-2)]">{message}</p>
      {retryHref ? (
        <a
          href={retryHref}
          className="mt-1 rounded-md border border-[var(--color-line)] px-2.5 py-1 text-[12.5px] font-medium text-[var(--color-ink)] hover:bg-[var(--color-line-2)]"
        >
          Повторить
        </a>
      ) : null}
    </div>
  );
}

export function StaleNotice({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-center gap-1.5 border-b border-[var(--color-warning)]/30 bg-[var(--color-warning-soft)] px-4 py-2 text-[12.5px] text-[var(--color-warning)]">
      <Clock3 size={14} strokeWidth={1.8} />
      {children}
    </p>
  );
}

export function DeniedNotice({ children }: { children: ReactNode }) {
  return (
    <p className="mb-4 flex items-center gap-1.5 rounded-md border border-[var(--color-critical)]/30 bg-[var(--color-critical-soft)] px-3 py-2 text-[13px] text-[var(--color-critical)]">
      <ShieldAlert size={15} strokeWidth={1.8} />
      {children}
    </p>
  );
}
