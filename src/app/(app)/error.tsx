'use client';

import { Button } from '@/components/ui/Button';

/**
 * Граница ошибки на уровне раздела. Она нужна для случая, когда сбой произошёл
 * вне блока с собственной обработкой: страница показывает отказ и предлагает
 * повтор, а не отдаёт пустой экран.
 */
export default function SectionError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-card)] px-4 py-10 text-center">
      <p className="text-[15px] font-semibold">Не удалось загрузить раздел</p>
      <p className="mx-auto mt-1 max-w-lg text-[13px] text-[var(--color-ink-2)]">
        Данные не пришли. Остальные разделы работают: сбой одного запроса не выключает приложение.
      </p>
      <Button variant="primary" size="sm" className="mt-3" onClick={reset}>
        Повторить
      </Button>
    </div>
  );
}
