import { fail, ok, type Result } from '@/lib/types';
import { createSupabaseServerClient, isDemoMode } from '../supabase/server';

/**
 * Обёртка над обращением к базе. Она нужна ровно за одним: ошибка одного блока
 * должна оставаться ошибкой этого блока. Страница с пятью показателями не имеет
 * права падать целиком из-за одного недоступного запроса.
 */
export async function safe<T>(run: () => Promise<T>): Promise<Result<T>> {
  try {
    return ok(await run());
  } catch (error) {
    const message = error instanceof Error ? error.message : 'неизвестная ошибка';
    return fail<T>(message);
  }
}

export async function db() {
  return createSupabaseServerClient();
}

export { isDemoMode };

/** Вызов функции базы. Аргументы именованные, как в PostgREST. */
export async function callRpc<T>(name: string, args: Record<string, unknown> = {}): Promise<T> {
  const supabase = await db();
  const { data, error } = await supabase.rpc(name, args);
  if (error) throw new Error(`${name}: ${error.message}`);
  return data as T;
}

export async function callRpcRow<T>(name: string, args: Record<string, unknown> = {}): Promise<T | null> {
  const rows = await callRpc<T[]>(name, args);
  if (!Array.isArray(rows)) return (rows as T) ?? null;
  return rows[0] ?? null;
}
