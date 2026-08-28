import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Клиент Supabase для серверного кода. Он подставляет сессию вошедшего
 * пользователя, поэтому каждый запрос уходит в базу от его имени, и права
 * проверяет RLS, а не код приложения.
 *
 * Сервисный ключ здесь не используется сознательно: с ним RLS перестаёт
 * действовать, и вся защита сводится к проверкам в коде — то есть к тому,
 * что можно обойти одним забытым условием.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(requireEnv('NEXT_PUBLIC_SUPABASE_URL'), requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
        // В серверных компонентах запись cookie запрещена. Обновление сессии
        // делает middleware, поэтому здесь ошибку можно проглотить.
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          /* обновление сессии выполняет middleware */
        }
      },
    },
  });
}

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Не задана переменная окружения ${name}. Скопируйте .env.example в .env.local и заполните значения.`,
    );
  }
  return value;
}

export function isDemoMode(): boolean {
  return process.env.DASHBOARD_DEMO === '1';
}

export function n8nBaseUrl(): string | null {
  return process.env.NEXT_PUBLIC_N8N_BASE_URL || null;
}

export function n8nExecutionUrl(workflowIdOrCode: string | null, executionId: string | null): string | null {
  const base = n8nBaseUrl();
  if (!base || !executionId) return null;
  return `${base.replace(/\/+$/, '')}/workflow/${workflowIdOrCode ?? ''}/executions/${executionId}`;
}
