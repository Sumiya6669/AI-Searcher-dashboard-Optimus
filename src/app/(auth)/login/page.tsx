import Link from 'next/link';
import type { Metadata } from 'next';

import { LoginForm } from './LoginForm';

export const metadata: Metadata = { title: 'Вход' };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const next = typeof params.next === 'string' ? params.next : '/dashboard';
  const notice = typeof params.notice === 'string' ? params.notice : undefined;

  return (
    <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-card)] p-5">
      <h1 className="text-[17px] font-semibold">Вход в систему</h1>
      <p className="mb-4 mt-0.5 text-[13px] text-[var(--color-ink-2)]">
        Доступ выдаёт администратор. Регистрация со стороны закрыта.
      </p>

      {notice === 'reset-sent' ? (
        <p className="mb-3 rounded border border-[var(--color-success)]/30 bg-[var(--color-success-soft)] px-3 py-2 text-[12.5px] text-[var(--color-success)]">
          Письмо для смены пароля отправлено, если такой адрес есть в системе.
        </p>
      ) : null}
      {notice === 'password-changed' ? (
        <p className="mb-3 rounded border border-[var(--color-success)]/30 bg-[var(--color-success-soft)] px-3 py-2 text-[12.5px] text-[var(--color-success)]">
          Пароль изменён. Войдите с новым паролем.
        </p>
      ) : null}

      <LoginForm next={next} />

      <p className="mt-4 text-[12.5px] text-[var(--color-ink-2)]">
        <Link href="/forgot-password" className="text-[var(--color-accent-ink)] hover:underline">
          Забыли пароль?
        </Link>
      </p>
    </div>
  );
}
