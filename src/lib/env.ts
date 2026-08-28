/**
 * Публичные переменные окружения читаются здесь и только здесь.
 *
 * Обращение записано полным именем — `process.env.NEXT_PUBLIC_SUPABASE_URL`,
 * а не `process.env[name]`. Разница не косметическая: сборщик подставляет
 * значение вместо полного имени на этапе сборки, а вычисляемое имя подставить
 * не может и оставляет обращение к окружению исполнения. На Vercel файл
 * `.env.production` участвует в сборке, но не попадает в среду исполнения
 * функций, поэтому вычисляемое обращение возвращало `undefined` уже после
 * успешной сборки — приложение собиралось и падало на первой же странице,
 * которой нужна база.
 *
 * Значения, заданные в Vercel → Settings → Environment Variables, имеют
 * приоритет: Next.js не перекрывает ими уже установленное окружение сборки.
 */
const PUBLIC_ENV = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_N8N_BASE_URL: process.env.NEXT_PUBLIC_N8N_BASE_URL,
} as const;

export type PublicEnvName = keyof typeof PUBLIC_ENV;

/** Значение или `null`, если переменная не задана. Для необязательных. */
export function publicEnv(name: PublicEnvName): string | null {
  const value = PUBLIC_ENV[name];
  return value && value.length > 0 ? value : null;
}

/** Значение или осмысленный отказ. Для тех, без которых работать нечем. */
export function requireEnv(name: PublicEnvName): string {
  const value = publicEnv(name);
  if (!value) {
    throw new Error(
      `Не задана переменная окружения ${name}. Задайте её в Vercel → Settings → Environment Variables (или в .env.local при локальном запуске) и пересоберите приложение.`,
    );
  }
  return value;
}

/** Заданы ли обе переменные, без которых нельзя обратиться к базе. */
export function hasSupabaseEnv(): boolean {
  return Boolean(publicEnv('NEXT_PUBLIC_SUPABASE_URL') && publicEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'));
}
