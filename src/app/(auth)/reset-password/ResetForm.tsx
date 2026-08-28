'use client';

import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { createSupabaseBrowserClient } from '@/server/supabase/browser';

export function ResetForm() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [repeat, setRepeat] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password.length < 8) {
      setError('Пароль короче восьми символов');
      return;
    }
    if (password !== repeat) {
      setError('Пароли не совпадают');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError('Ссылка недействительна или истекла. Запросите новую.');
        setBusy(false);
        return;
      }
      await supabase.auth.signOut();
      router.replace('/login?notice=password-changed');
    } catch {
      setError('Не удалось сменить пароль');
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <label className="block">
        <span className="mb-1 block text-[12.5px] font-medium text-[var(--color-ink-2)]">Новый пароль</span>
        <input
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-9 w-full rounded-md border border-[var(--color-line)] bg-[var(--color-card)] px-2.5 text-[14px]"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-[12.5px] font-medium text-[var(--color-ink-2)]">Повторите пароль</span>
        <input
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={repeat}
          onChange={(e) => setRepeat(e.target.value)}
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
        Сохранить пароль
      </Button>
    </form>
  );
}
