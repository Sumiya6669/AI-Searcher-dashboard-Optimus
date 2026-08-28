import { NextResponse, type NextRequest } from 'next/server';

import { createSupabaseServerClient } from '@/server/supabase/server';

/**
 * Приём кода из письма: подтверждение адреса и смена пароля. Код обменивается
 * на сессию на сервере, чтобы он не оставался в истории браузера.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get('code');
  const nextPath = searchParams.get('next') ?? '/dashboard';
  const safeNext = nextPath.startsWith('/') ? nextPath : '/dashboard';

  if (!code) return NextResponse.redirect(`${origin}/login`);

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(`${origin}/login?notice=link-expired`);

  return NextResponse.redirect(`${origin}${safeNext}`);
}
