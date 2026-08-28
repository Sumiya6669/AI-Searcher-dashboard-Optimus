'use client';

import { useActionState } from 'react';

import { updateProfile, type ProfileFormState } from './actions';
import { Button } from '@/components/ui/Button';
import type { AppUser } from '@/lib/types';

const INITIAL: ProfileFormState = { status: 'idle' };

export function ProfileForm({ user }: { user: AppUser }) {
  const [state, action, pending] = useActionState(updateProfile, INITIAL);

  return (
    <form action={action} className="space-y-3">
      <label className="block">
        <span className="mb-1 block text-[12.5px] font-medium text-[var(--color-ink-2)]">Имя</span>
        <input
          name="full_name"
          defaultValue={user.full_name ?? ''}
          maxLength={120}
          className="h-9 w-full max-w-sm rounded-md border border-[var(--color-line)] bg-[var(--color-card)] px-2.5 text-[14px]"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-[12.5px] font-medium text-[var(--color-ink-2)]">Часовой пояс</span>
        <select
          name="timezone"
          defaultValue={user.timezone}
          className="h-9 w-full max-w-sm rounded-md border border-[var(--color-line)] bg-[var(--color-card)] px-2 text-[14px]"
        >
          <option value="Asia/Almaty">Asia/Almaty — UTC+5</option>
          <option value="Asia/Qyzylorda">Asia/Qyzylorda — UTC+5</option>
          <option value="Europe/Moscow">Europe/Moscow — UTC+3</option>
          <option value="UTC">UTC</option>
        </select>
      </label>

      <label className="block">
        <span className="mb-1 block text-[12.5px] font-medium text-[var(--color-ink-2)]">Язык интерфейса</span>
        <select
          name="locale"
          defaultValue={user.locale}
          className="h-9 w-full max-w-sm rounded-md border border-[var(--color-line)] bg-[var(--color-card)] px-2 text-[14px]"
        >
          <option value="ru">Русский</option>
        </select>
      </label>

      {state.status === 'saved' ? (
        <p className="rounded border border-[var(--color-success)]/30 bg-[var(--color-success-soft)] px-3 py-1.5 text-[12.5px] text-[var(--color-success)]">
          Сохранено.
        </p>
      ) : null}
      {state.status === 'error' ? (
        <p role="alert" className="rounded border border-[var(--color-critical)]/30 bg-[var(--color-critical-soft)] px-3 py-1.5 text-[12.5px] text-[var(--color-critical)]">
          {state.message}
        </p>
      ) : null}

      <Button type="submit" variant="primary" size="sm" disabled={pending}>
        Сохранить
      </Button>
    </form>
  );
}
