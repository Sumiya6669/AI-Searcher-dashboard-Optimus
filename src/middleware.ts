import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login', '/forgot-password', '/reset-password', '/auth/callback', '/no-access'];

/**
 * Middleware обновляет сессию и закрывает приложение от неавторизованных.
 * Это первый рубеж, а не единственный: страницы и функции базы проверяют
 * права ещё раз, потому что маршрут можно обойти прямым обращением к API.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (process.env.DASHBOARD_DEMO === '1') {
    if (pathname === '/') {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (!user && !isPublic) {
    const target = request.nextUrl.clone();
    target.pathname = '/login';
    target.searchParams.set('next', pathname);
    return NextResponse.redirect(target);
  }

  if (user && (pathname === '/login' || pathname === '/')) {
    const target = request.nextUrl.clone();
    target.pathname = '/dashboard';
    target.search = '';
    return NextResponse.redirect(target);
  }

  if (!user && pathname === '/') {
    const target = request.nextUrl.clone();
    target.pathname = '/login';
    return NextResponse.redirect(target);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
};
