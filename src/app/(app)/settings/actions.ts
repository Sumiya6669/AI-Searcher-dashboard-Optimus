'use server';

import { revalidatePath } from 'next/cache';

import { createSupabaseServerClient, isDemoMode } from '@/server/supabase/server';

export interface ProfileFormState {
  status: 'idle' | 'saved' | 'error';
  message?: string;
}

/**
 * Обновление собственного профиля. Роль в списке полей отсутствует сознательно:
 * право на изменение роли есть только у администратора, и проверяет это
 * политика RLS, а не форма.
 */
export async function updateProfile(_prev: ProfileFormState, formData: FormData): Promise<ProfileFormState> {
  if (isDemoMode()) {
    return { status: 'error', message: 'В демонстрационном режиме профиль не сохраняется.' };
  }

  const fullName = String(formData.get('full_name') ?? '').trim().slice(0, 120);
  const timezone = String(formData.get('timezone') ?? 'Asia/Almaty');
  const locale = String(formData.get('locale') ?? 'ru');

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: 'error', message: 'Сессия истекла. Войдите заново.' };

  const { error } = await supabase
    .from('app_users')
    .update({ full_name: fullName || null, timezone, locale, updated_at: new Date().toISOString() })
    .eq('user_id', user.id);

  if (error) return { status: 'error', message: error.message };

  revalidatePath('/settings');
  return { status: 'saved' };
}
