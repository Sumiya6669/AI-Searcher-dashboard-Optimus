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
 * Сообщение базы показывается человеку как есть: функции говорят по-русски и
 * объясняют отказ по существу («в системе должен остаться хотя бы один
 * действующий администратор»). Заменять это на «произошла ошибка» означало бы
 * выбросить единственную полезную часть ответа.
 */
function toMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  const cleaned = raw.replace(/^app_admin_[a-z_]+:\s*/, '');
  if (cleaned.includes('forbidden')) return 'Недостаточно прав. Действие доступно только администратору.';
  return cleaned;
}

function text(form: FormData, key: string, max = 200): string {
  return String(form.get(key) ?? '')
    .trim()
    .slice(0, max);
}

function numbers(form: FormData, key: string): number[] {
  return form
    .getAll(key)
    .map((v) => Number(v))
    .filter((n) => Number.isFinite(n));
}

function strings(form: FormData, key: string): string[] {
  return form.getAll(key).map((v) => String(v));
}

export async function createUser(_prev: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  if (isDemoMode()) return DEMO;

  const password = String(form.get('password') ?? '');
  if (password.length < 10) {
    return { status: 'error', message: 'Пароль должен быть не короче десяти знаков.' };
  }

  try {
    await callRpc('app_admin_create_user', {
      p_email: text(form, 'email', 160),
      p_password: password,
      p_full_name: text(form, 'full_name', 120),
      p_role: text(form, 'role', 10) === 'admin' ? 'admin' : 'user',
      p_is_active: form.get('is_active') === 'on',
      p_group_ids: numbers(form, 'group_ids'),
    });
  } catch (error) {
    return { status: 'error', message: toMessage(error) };
  }

  revalidatePath('/admin/people');
  return { status: 'saved', message: 'Пользователь заведён. Передайте ему пароль лично, а не письмом.' };
}

export async function updateUser(_prev: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  if (isDemoMode()) return DEMO;

  try {
    await callRpc('app_admin_update_user', {
      p_user_id: text(form, 'user_id', 64),
      p_full_name: text(form, 'full_name', 120) || null,
      p_role: text(form, 'role', 10) === 'admin' ? 'admin' : 'user',
      p_is_active: form.get('is_active') === 'on',
      p_group_ids: numbers(form, 'group_ids'),
    });
  } catch (error) {
    return { status: 'error', message: toMessage(error) };
  }

  revalidatePath('/admin/people');
  return { status: 'saved', message: 'Изменения сохранены.' };
}

export async function setPassword(_prev: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  if (isDemoMode()) return DEMO;

  const password = String(form.get('password') ?? '');
  if (password.length < 10) {
    return { status: 'error', message: 'Пароль должен быть не короче десяти знаков.' };
  }

  try {
    await callRpc('app_admin_set_password', {
      p_user_id: text(form, 'user_id', 64),
      p_password: password,
    });
  } catch (error) {
    return { status: 'error', message: toMessage(error) };
  }

  revalidatePath('/admin/people');
  return { status: 'saved', message: 'Пароль изменён.' };
}

export async function deleteUser(_prev: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  if (isDemoMode()) return DEMO;

  try {
    await callRpc('app_admin_delete_user', { p_user_id: text(form, 'user_id', 64) });
  } catch (error) {
    return { status: 'error', message: toMessage(error) };
  }

  revalidatePath('/admin/people');
  return { status: 'saved', message: 'Пользователь удалён.' };
}

export async function saveGroup(_prev: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  if (isDemoMode()) return DEMO;

  const rawId = text(form, 'id', 20);
  const rawRecipient = text(form, 'recipient_id', 20);

  try {
    await callRpc('app_admin_save_group', {
      p_id: rawId ? Number(rawId) : null,
      p_code: text(form, 'code', 40),
      p_name: text(form, 'name', 80),
      p_description: text(form, 'description', 300),
      p_restrict_view: form.get('restrict_view') === 'on',
      p_min_importance: Number(text(form, 'min_importance', 2)) || 3,
      p_recipient_id: rawRecipient ? Number(rawRecipient) : null,
      p_is_active: form.get('is_active') === 'on',
      p_entity_ids: numbers(form, 'entity_ids'),
      p_member_ids: strings(form, 'member_ids'),
    });
  } catch (error) {
    return { status: 'error', message: toMessage(error) };
  }

  revalidatePath('/admin/people');
  return { status: 'saved', message: 'Группа сохранена.' };
}

export async function deleteGroup(_prev: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  if (isDemoMode()) return DEMO;

  try {
    await callRpc('app_admin_delete_group', { p_id: Number(text(form, 'id', 20)) });
  } catch (error) {
    return { status: 'error', message: toMessage(error) };
  }

  revalidatePath('/admin/people');
  return { status: 'saved', message: 'Группа удалена.' };
}
