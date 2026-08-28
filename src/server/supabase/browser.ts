'use client';

import { createBrowserClient } from '@supabase/ssr';

import { requireEnv } from '@/lib/env';

/**
 * Браузерный клиент нужен только для входа, выхода и сброса пароля. Данные
 * дашборда через него не читаются: чтение идёт на сервере, чтобы фильтрация,
 * сортировка и постраничный вывод выполнялись в базе.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(requireEnv('NEXT_PUBLIC_SUPABASE_URL'), requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'));
}
