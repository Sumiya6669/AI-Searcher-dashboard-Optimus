'use server';

import { revalidatePath } from 'next/cache';

import { requireAdmin } from '@/server/auth';
import { callRpc } from '@/server/queries/client';
import { isDemoMode } from '@/server/supabase/server';

export interface ActionState {
  status: 'idle' | 'saved' | 'error';
  message?: string;
}

const DEMO: ActionState = {
  status: 'error',
  message: 'В демонстрационном режиме изменения не сохраняются.',
};

/**
 * Значение приходит из формы и уходит в базу, никуда больше. В журнал, в текст
 * ответа и в сообщение об ошибке оно не попадает: сообщение об отказе, в котором
 * виден ключ, — обычный способ утечки.
 */
export async function setSecret(_prev: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  if (isDemoMode()) return DEMO;

  const key = String(form.get('key') ?? '');
  const value = String(form.get('value') ?? '');

  try {
    await callRpc('app_admin_set_secret', { p_key: key, p_value: value });
  } catch (error) {
    const raw = error instanceof Error ? error.message : String(error);
    const cleaned = raw.replace(/^app_admin_set_secret:\s*/, '');
    return {
      status: 'error',
      message: cleaned.includes('forbidden')
        ? 'Недостаточно прав. Действие доступно только администратору.'
        : cleaned,
    };
  }

  revalidatePath('/admin/integrations');
  return {
    status: 'saved',
    message:
      value.trim() === ''
        ? 'Значение очищено. Подключение выключено.'
        : 'Значение сохранено. Прочитать его обратно из интерфейса нельзя — только заменить.',
  };
}
