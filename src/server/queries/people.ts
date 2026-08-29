import type { AccessGroupRow, AdminUserRow, EntityOptionRow, RecipientRow, Result } from '@/lib/types';
import { callRpc, isDemoMode, safe } from './client';
import { DEMO_ENTITY_OPTIONS, DEMO_GROUPS, DEMO_USERS } from '../demo/people';

/**
 * Люди и группы читаются функциями с правами владельца, которые сами
 * проверяют роль. Прямого чтения auth.users у приложения нет и не должно быть.
 */
export async function fetchAdminUsers(): Promise<Result<AdminUserRow[]>> {
  if (isDemoMode()) return { ok: true, data: DEMO_USERS };
  return safe(() => callRpc<AdminUserRow[]>('app_admin_users'));
}

export async function fetchAccessGroups(): Promise<Result<AccessGroupRow[]>> {
  if (isDemoMode()) return { ok: true, data: DEMO_GROUPS };
  return safe(() => callRpc<AccessGroupRow[]>('app_admin_groups'));
}

export async function fetchEntityOptions(): Promise<Result<EntityOptionRow[]>> {
  if (isDemoMode()) return { ok: true, data: DEMO_ENTITY_OPTIONS };
  return safe(() => callRpc<EntityOptionRow[]>('app_admin_entity_options'));
}

/** Получатели рассылки — для привязки группы к адресату в Telegram. */
export async function fetchRecipients(): Promise<Result<RecipientRow[]>> {
  if (isDemoMode()) return { ok: true, data: [] };
  return safe(async () => {
    const { createSupabaseServerClient } = await import('../supabase/server');
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from('recipients')
      .select('id, name, role, min_importance, wants_daily, wants_weekly, wants_instant, is_active')
      .order('name');
    if (error) throw new Error(error.message);
    return (data ?? []) as RecipientRow[];
  });
}
