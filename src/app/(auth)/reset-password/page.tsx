import type { Metadata } from 'next';

import { ResetForm } from './ResetForm';

export const metadata: Metadata = { title: 'Новый пароль' };

export default function ResetPasswordPage() {
  return (
    <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-card)] p-5">
      <h1 className="text-[17px] font-semibold">Новый пароль</h1>
      <p className="mb-4 mt-0.5 text-[13px] text-[var(--color-ink-2)]">
        Ссылка действует ограниченное время. Пароль — не короче восьми символов.
      </p>
      <ResetForm />
    </div>
  );
}
