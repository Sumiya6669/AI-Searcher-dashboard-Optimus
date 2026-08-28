'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

import { cn } from '@/lib/cn';
import type { ThemePreference } from '@/lib/types';

const OPTIONS: Array<{ value: ThemePreference; label: string; icon: typeof Sun }> = [
  { value: 'light', label: 'Светлая', icon: Sun },
  { value: 'dark', label: 'Тёмная', icon: Moon },
  { value: 'system', label: 'Как в системе', icon: Monitor },
];

function apply(pref: ThemePreference) {
  const root = document.documentElement;
  const dark = pref === 'dark' || (pref === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  root.classList.toggle('dark', dark);
  document.cookie = `theme=${pref}; path=/; max-age=31536000; samesite=lax`;
}

export function ThemeToggle({ initial }: { initial: ThemePreference }) {
  const [pref, setPref] = useState<ThemePreference>(initial);

  // Режим «как в системе» должен реагировать на смену темы в системе, пока
  // страница открыта: иначе выбор выглядит сломанным.
  useEffect(() => {
    if (pref !== 'system') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => apply('system');
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [pref]);

  return (
    <div
      role="radiogroup"
      aria-label="Оформление"
      className="flex items-center gap-0.5 rounded-md border border-[var(--color-line)] p-0.5"
    >
      {OPTIONS.map((option) => {
        const Icon = option.icon;
        const active = pref === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={option.label}
            title={option.label}
            onClick={() => {
              setPref(option.value);
              apply(option.value);
            }}
            className={cn(
              'flex size-6 items-center justify-center rounded text-[var(--color-ink-3)] hover:text-[var(--color-ink)]',
              active && 'bg-[var(--color-soft)] text-[var(--color-accent-ink)]',
            )}
          >
            <Icon size={13} strokeWidth={1.9} />
          </button>
        );
      })}
    </div>
  );
}
