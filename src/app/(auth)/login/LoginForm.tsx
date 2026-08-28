'use client';

import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { createSupabaseBrowserClient } from '@/server/supabase/browser';

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) {
        // Причина отказа не уточняется намеренно: сообщение «нет такого
        // пользователя» позволяет перебирать адреса.
        setError('Неверный адрес или пароль');
        setBusy(false);
        return;
      }
      router.replace(next.startsWith('/') ? next : '/dashboard');
      router.refresh();
    } catch {
      setError('Не удалось связаться с сервером входа');
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

      <label className="block">
        <span className="mb-1 block text-[12.5px] font-medium text-[var(--color-ink-2)]">Пароль</span>
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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
        Войти
      </Button>
    </form>
  );
}
