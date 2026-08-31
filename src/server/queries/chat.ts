import type { ChatMessageRow, Result } from '@/lib/types';
import { db, isDemoMode, safe } from './client';
import { DEMO_CHAT } from '../demo/chat';

/**
 * История обращений. Читается напрямую из таблицы под построчными правилами:
 * своё видит автор, всё — администратор. Отдельная функция базы здесь была бы
 * лишним слоем — правило и так живёт в правилах доступа таблицы.
 */
export async function fetchChatHistory(limit = 30): Promise<Result<ChatMessageRow[]>> {
  if (isDemoMode()) return { ok: true, data: DEMO_CHAT };

  return safe(async () => {
    const supabase = await db();
    const { data, error } = await supabase
      .from('chat_messages')
      .select(
        'id, user_id, question, answer, status, error, found_events, found_tenders, cost_usd, asked_at, answered_at',
      )
      .order('id', { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    return (data ?? []) as ChatMessageRow[];
  });
}

/**
 * Готов ли чат к работе. Проверяются обе половины: адрес сценария и общий
 * секрет. Показывать поле ввода, зная, что ответа не будет, — хуже, чем
 * честно сказать, чего не хватает.
 */
export function chatSetupProblem(): string | null {
  if (isDemoMode()) return null;
  const base = process.env.NEXT_PUBLIC_N8N_BASE_URL?.trim();
  const token = process.env.N8N_CHAT_TOKEN?.trim();
  if (!base) return 'Не задан адрес сценариев: переменная окружения NEXT_PUBLIC_N8N_BASE_URL.';
  if (!token) return 'Не задан общий секрет обращения: переменная окружения N8N_CHAT_TOKEN.';
  return null;
}
