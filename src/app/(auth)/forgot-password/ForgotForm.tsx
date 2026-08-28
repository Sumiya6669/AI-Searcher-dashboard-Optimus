'use client';

import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { createSupabaseBrowserClient } from '@/server/supabase/browser';

export function ForgotForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=/reset-password`;
      await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      // Ответ одинаков независимо от того, есть такой адрес или нет:
      // иначе форма превращается в способ проверить, кто есть в системе.
      router.replace('/login?notice=reset-sent');
    } catch {
      setError('Не удалось отправить письмо. Повторите позже.');
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <label className="block">
        <span className="mb-1 block text-[12.5px] font-medium text-[var(--color-ink-2)]">Адрес электронной почты</span>
        <input
          type="email"
          required
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-9 w-full rounded-md border border-[var(--color-line)] bg-[var(--color-card)] px-2.5 text-[14px]"
        />
      </label>
      {error ? (
        <p role="alert" className="rounded border border-[var(--color-critical)]/30 bg-[var(--color-critical-soft)] px-3 py-2 text-[12.5px] text-[var(--color-critical)]">
          {error}
        </p>
      ) : null}
      <Button type="submit" variant="primary" className="w-full" disabled={busy}>
        {busy ? <Loader2 size={14} className="animate-spin" /> : null}
        Отправить ссылку
      </Button>
    </form>
  );
}
