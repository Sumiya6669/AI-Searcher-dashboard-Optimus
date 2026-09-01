import type { DirectionRow, Result } from '@/lib/types';
import { callRpc, isDemoMode, safe } from './client';

/**
 * Направления читает функция с правами владельца: она сама проверяет, что
 * обращающийся — действующий пользователь системы.
 */
export async function fetchDirections(): Promise<Result<DirectionRow[]>> {
  if (isDemoMode()) return { ok: true, data: [] };
  return safe(() => callRpc<DirectionRow[]>('app_directions'));
}
