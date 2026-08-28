import Link from 'next/link';
import type { Metadata } from 'next';

import { ForgotForm } from './ForgotForm';

export const metadata: Metadata = { title: 'Восстановление пароля' };

export default function ForgotPasswordPage() {
  return (
    <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-card)] p-5">
      <h1 className="text-[17px] font-semibold">Восстановление пароля</h1>
      <p className="mb-4 mt-0.5 text-[13px] text-[var(--color-ink-2)]">
        Укажите адрес, на который выдан доступ. Придёт ссылка для смены пароля.
      </p>
      <ForgotForm />
      <p className="mt-4 text-[12.5px]">
        <Link href="/login" className="text-[var(--color-accent-ink)] hover:underline">
          Вернуться к входу
        </Link>
      </p>
    </div>
  );
}
