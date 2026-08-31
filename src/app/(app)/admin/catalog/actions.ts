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

function toMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  const cleaned = raw.replace(/^app_admin_[a-z_]+:\s*/, '');
  if (cleaned.includes('forbidden')) return 'Недостаточно прав. Действие доступно только администратору.';
  return cleaned;
}

export async function saveCatalogState(_prev: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  if (isDemoMode()) return DEMO;

  const ord = Number(form.get('ord'));
  if (!Number.isInteger(ord) || ord < 1) {
    return { status: 'error', message: 'Не указана строка каталога.' };
  }
  const sourceRaw = String(form.get('source_id') ?? '').trim();
  const sourceId = sourceRaw === '' ? null : Number(sourceRaw);

  try {
    await callRpc('app_admin_save_catalog_state', {
      p_ord: ord,
      p_status: String(form.get('status') ?? 'not_connected'),
      p_source_id: sourceId !== null && Number.isFinite(sourceId) ? sourceId : null,
      p_note: String(form.get('note') ?? '').slice(0, 1000),
    });
  } catch (error) {
    return { status: 'error', message: toMessage(error) };
  }

  revalidatePath('/admin/catalog');
  return { status: 'saved', message: 'Решение по источнику сохранено.' };
}
