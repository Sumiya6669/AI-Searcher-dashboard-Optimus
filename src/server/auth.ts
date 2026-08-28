import { redirect } from 'next/navigation';
import { cache } from 'react';

import type { AppUser } from '@/lib/types';
import { createSupabaseServerClient, isDemoMode } from './supabase/server';

/**
 * Профиль текущего пользователя. Роль читается из таблицы app_users, а не из
 * метаданных токена: метаданные пользователь способен изменить сам через
 * публичный API обновления профиля, роль в таблице — нет.
 */
export const getCurrentUser = cache(async (): Promise<AppUser | null> => {
  if (isDemoMode()) {
    return {
      user_id: 'demo-user',
      email: 'demo@optimus-kz.kz',
      full_name: 'Демонстрационный доступ',
      role: 'admin',
      is_active: true,
      recipient_id: null,
      locale: 'ru',
      theme: 'system',
      timezone: 'Asia/Almaty',
    };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('app_users')
    .select('user_id, email, full_name, role, is_active, recipient_id, locale, theme, timezone')
    .eq('user_id', user.id)
    .maybeSingle<AppUser>();

  if (data) return data;

  // Профиль создаётся триггером при регистрации. Если строки нет — показываем
  // минимальный профиль с наименьшими правами, а не пускаем как администратора.
  return {
    user_id: user.id,
    email: user.email ?? '',
    full_name: null,
    role: 'user',
    is_active: false,
    recipient_id: null,
    locale: 'ru',
    theme: 'system',
    timezone: 'Asia/Almaty',
  };
});

export async function requireUser(): Promise<AppUser> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  // Вход и право видеть данные — разные вещи. Пока администратор не выдал
  // доступ, база не отдаёт ни одной строки, и показывать пустые разделы
  // вместо внятного объяснения было бы обманом.
  if (!user.is_active) redirect('/no-access');
  return user;
}

/**
 * Проверка роли в приложении. Она не заменяет проверку в базе: служебные
 * функции сами отказывают не администратору. Здесь она нужна, чтобы человек
 * увидел понятный отказ, а не пустой экран.
 */
export async function requireAdmin(): Promise<AppUser> {
  const user = await requireUser();
  if (user.role !== 'admin') redirect('/dashboard?denied=admin');
  return user;
}
