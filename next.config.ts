import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { NextConfig } from 'next';

/**
 * Публичные переменные, которые нужны приложению для работы.
 */
const PUBLIC_NAMES = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_SITE_URL',
  'NEXT_PUBLIC_N8N_BASE_URL',
] as const;

/**
 * Разбор `.env.production` собственными силами.
 *
 * Next.js читает этот файл сам, но применяет значение только к переменной,
 * которой в окружении сборки нет вовсе. Переменная, заведённая в Vercel с
 * пустым значением, считается заданной — и пустая строка побеждает содержимое
 * файла. Снаружи это выглядит как «переменные в панели есть, а приложение
 * говорит, что их нет».
 *
 * Поэтому пустое значение здесь приравнено к отсутствующему.
 */
function readEnvFile(name: string): Record<string, string> {
  const path = join(process.cwd(), name);
  if (!existsSync(path)) return {};

  const values: Record<string, string> = {};
  for (const rawLine of readFileSync(path, 'utf8').split('\n')) {
    const line = rawLine.trim();
    if (line.length === 0 || line.startsWith('#')) continue;
    const separator = line.indexOf('=');
    if (separator < 1) continue;
    const key = line.slice(0, separator).trim();
    const value = line
      .slice(separator + 1)
      .trim()
      .replace(/^(['"])(.*)\1$/, '$2');
    if (value.length > 0) values[key] = value;
  }
  return values;
}

const fileValues = readEnvFile('.env.production');

/**
 * Порядок предпочтения: непустое значение из окружения сборки (Vercel →
 * Settings → Environment Variables), затем значение из файла. Пустая строка не
 * считается значением ни там, ни там.
 */
const publicEnv: Record<string, string> = {};
for (const name of PUBLIC_NAMES) {
  const fromEnvironment = process.env[name];
  const chosen = fromEnvironment && fromEnvironment.trim().length > 0 ? fromEnvironment.trim() : fileValues[name];
  publicEnv[name] = chosen ?? '';
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  env: publicEnv,
  experimental: {
    // Данные читаются на сервере при каждом запросе: дашборд показывает
    // состояние системы, и закэшированное состояние здесь хуже отсутствия.
    staleTimes: { dynamic: 0, static: 30 },
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
