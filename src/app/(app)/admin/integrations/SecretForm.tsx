'use client';

import { useActionState } from 'react';

import { setSecret, type ActionState } from './actions';
import { Field, FormNotice, TextInput } from '@/components/domain/Field';
import { Badge } from '@/components/ui/Badge';
import type { IntegrationRow } from '@/lib/types';

const initial: ActionState = { status: 'idle' };

export function SecretForm({ row }: { row: IntegrationRow }) {
  const [result, action, pending] = useActionState(setSecret, initial);

  return (
    <form
      action={action}
      className="rounded-lg border border-[var(--color-line)] bg-[var(--color-card)] p-3.5"
    >
      <input type="hidden" name="key" value={row.code} />
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <h3 className="text-[13.5px] font-semibold text-[var(--color-ink)]">{row.title}</h3>
        <Badge tone={row.filled ? 'success' : 'warning'}>
          {row.filled ? `заполнено, ${row.value_length} знаков` : 'не заполнено'}
        </Badge>
      </div>
      <p className="mb-2.5 text-[12.5px] leading-5 text-[var(--color-ink-2)]">{row.hint}</p>
      <div className="flex flex-wrap items-end gap-2">
        <Field
          label={row.filled ? 'Новое значение' : 'Значение'}
          className="min-w-[220px] flex-1"
          hint="Показать сохранённое значение система не умеет намеренно. Пустое поле — очистить и выключить."
        >
          <TextInput
            name="value"
            type="password"
            autoComplete="off"
            spellCheck={false}
            placeholder={row.filled ? 'оставьте пустым, чтобы очистить' : 'вставьте значение'}
          />
        </Field>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-[var(--color-accent)] px-3 py-1.5 text-[13px] font-semibold text-white disabled:opacity-60"
        >
          {pending ? 'Сохраняю…' : 'Сохранить'}
        </button>
      </div>
      <div className="mt-2">
        <FormNotice status={result.status} message={result.message} />
      </div>
    </form>
  );
}
