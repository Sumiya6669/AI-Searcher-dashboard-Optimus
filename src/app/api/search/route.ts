import { NextResponse, type NextRequest } from 'next/server';

import type { SearchHit } from '@/lib/types';
import { getCurrentUser } from '@/server/auth';
import { searchAll } from '@/server/queries/events';

export const dynamic = 'force-dynamic';

/**
 * Поиск выполняется на сервере от имени вошедшего пользователя. Браузер не
 * обращается к базе напрямую, поэтому подобрать запрос в обход прав нельзя.
 */
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ hits: [] }, { status: 401 });

  const query = request.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (query.length < 2) return NextResponse.json({ hits: [] });

  try {
    const hits = (await searchAll(query, 6)) as SearchHit[];
    return NextResponse.json({ hits: hits ?? [] });
  } catch {
    return NextResponse.json({ hits: [], error: 'search_failed' }, { status: 500 });
  }
}
