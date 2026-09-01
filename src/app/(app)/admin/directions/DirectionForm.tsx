'use client';

import { useActionState } from 'react';

import { saveDirection, type DirectionState } from './actions';
import { Badge } from '@/components/ui/Badge';
import { formatNumber } from '@/lib/format';
import type { DirectionRow } from '@/lib/types';

const initial: DirectionState = { status: 'idle' };

const KIND_LABEL: Record<string, string> = {
  interest: 'интересует',
  background: 'фон',
  exclude: 'не интересует',
};

const KIND_TONE: Record<string, 'success' | 'neutral' | 'critical'> = {
  interest: 'success',
  background: 'neutral',
  exclude: 'critical',
};

/**
 * Вес меняется, выражение — нет. Неудачное регулярное выражение способно
 * отсечь весь поток разом; такая правка идёт через того, кто увидит замер,
 * а не через форму. Само выражение показано: настройка, которую нельзя
 * прочитать, — это не настройка, а обещание.
 */
export function DirectionForm({ row }: { row: DirectionRow }) {
  const [result, action, pending] = useActionState(saveDirection, initial);

  return (
    <form
      action={action}
      className="border-t border-[var(--color-line)] px-3.5 py-3 first:border-t-0"
    >
      <input type="hidden" name="id" value={row.id} />

      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1.5">
        <span className="min-w-0">
          <span className="flex flex-wrap items-center gap-1.5">
            <span className="text-[13.5px] font-semibold text-[var(--color-ink)]">{row.name}</span>
            <Badge tone={KIND_TONE[row.kind] ?? 'neutral'}>{KIND_LABEL[row.kind] ?? row.kind}</Badge>
            {row.axis === 'where' ? <Badge tone="neutral">рынок</Badge> : null}
            {!row.is_active ? <Badge tone="warning">выключено</Badge> : null}
          </span>
          {row.description ? (
            <span className="mt-0.5 block text-[12.5px] leading-5 text-[var(--color-ink-2)]">
              {row.description}
            </span>
          ) : null}
        </span>

        <span className="flex shrink-0 items-center gap-2">
          <label className="flex items-center gap-1.5 text-[12px] text-[var(--color-ink-2)]">
            <input
              type="checkbox"
              name="is_active"
              defaultChecked={row.is_active}
              className="size-3.5 accent-[var(--color-accent)]"
            />
            включено
          </label>
          <label className="flex items-center gap-1.5 text-[12px] text-[var(--color-ink-2)]">
            вес
            <input
              type="number"
              name="weight"
              step="0.05"
              min="0"
              max="3"
              defaultValue={row.weight}
              className="w-16 rounded-md border border-[var(--color-line)] bg-[var(--color-card)] px-1.5 py-1 text-[12.5px] text-[var(--color-ink)]"
            />
          </label>
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-[var(--color-accent)] px-2.5 py-1 text-[12px] font-semibold text-white disabled:opacity-60"
          >
            {pending ? '…' : 'Сохранить'}
          </button>
        </span>
      </div>

      <p className="mt-1.5 text-[11.5px] leading-5 text-[var(--color-ink-3)]">
        За 30 дней поймало: <span className="text-[var(--color-ink-2)]">{formatNumber(row.materials_30d)}</span>{' '}
        материалов, <span className="text-[var(--color-ink-2)]">{formatNumber(row.events_30d)}</span> событий
        {row.note ? <> · {row.note}</> : null}
      </p>

      <details className="mt-1">
        <summary className="cursor-pointer list-none text-[11.5px] text-[var(--color-ink-3)] hover:text-[var(--color-ink-2)]">
          выражение
        </summary>
        <code className="mt-1 block overflow-x-auto whitespace-pre rounded bg-[var(--color-bg)] px-2 py-1.5 text-[11px] text-[var(--color-ink-2)]">
          {row.pattern}
        </code>
      </details>

      {result.status !== 'idle' && result.message ? (
        <p
          role={result.status === 'error' ? 'alert' : 'status'}
          className={
            result.status === 'error'
              ? 'mt-1.5 text-[12px] text-[var(--color-critical)]'
              : 'mt-1.5 text-[12px] text-[var(--color-success)]'
          }
        >
          {result.message}
        </p>
      ) : null}
    </form>
  );
}
