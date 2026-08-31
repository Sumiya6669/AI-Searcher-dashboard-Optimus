import type { Result, SemanticsRow } from '@/lib/types';
import { callRpc, isDemoMode, safe } from './client';
import { DEMO_SEMANTICS } from '../demo/semantics';

/**
 * Семантика читается функцией с правами владельца: она сама проверяет, что
 * обращающийся — действующий пользователь системы. Это описание настройки, а не
 * данные рынка, поэтому в демонстрационном режиме показывается образец.
 */
export async function fetchSemantics(): Promise<Result<SemanticsRow[]>> {
  if (isDemoMode()) return { ok: true, data: DEMO_SEMANTICS };
  return safe(() => callRpc<SemanticsRow[]>('app_semantics'));
}
