'use client';

import { createBrowserClient } from '@supabase/ssr';

/**
 * Браузерный клиент нужен только для входа, выхода и сброса пароля. Данные
 * дашборда через него не читаются: чтение идёт на сервере, чтобы фильтрация,
 * сортировка и постраничный вывод выполнялись в базе.
 */
export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('Не заданы NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }
  return createBrowserClient(url, key);
}
