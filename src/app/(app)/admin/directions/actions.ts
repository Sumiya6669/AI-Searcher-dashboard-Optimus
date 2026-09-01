'use server';

import { revalidatePath } from 'next/cache';

import { requireAdmin } from '@/server/auth';
import { callRpc } from '@/server/queries/client';
import { isDemoMode } from '@/server/supabase/server';

export interface DirectionState {
  status: 'idle' | 'saved' | 'error';
  message?: string;
}

/**
 * Направление включается, выключается и меняет вес. Само выражение отсюда не
 * правится: неудачное регулярное выражение способно отсечь весь поток разом,
 * и такая правка должна проходить через того, кто увидит последствия в
 * замерах, а не через форму.
 */
export async function saveDirection(_prev: DirectionState, form: FormData): Promise<DirectionState> {
  await requireAdmin();
  if (isDemoMode()) {
    return { status: 'error', message: 'В демонстрационном режиме изменения не сохраняются.' };
  }

  const id = Number(form.get('id'));
  const isActive = form.get('is_active') === 'on';
  const weight = Number(form.get('weight'));

  if (!Number.isFinite(id)) return { status: 'error', message: 'Не указано направление.' };
  if (!Number.isFinite(weight) || weight < 0 || weight > 3) {
    return { status: 'error', message: 'Вес должен быть от 0 до 3.' };
  }

  try {
    await callRpc('app_admin_save_direction', { p_id: id, p_is_active: isActive, p_weight: weight });
  } catch (error) {
    const raw = error instanceof Error ? error.message : String(error);
    return {
      status: 'error',
      message: raw.includes('forbidden')
        ? 'Недостаточно прав. Действие доступно только администратору.'
        : raw,
    };
  }

  revalidatePath('/admin/directions');
  return { status: 'saved', message: 'Направление сохранено. Правило действует со следующего сбора.' };
}
