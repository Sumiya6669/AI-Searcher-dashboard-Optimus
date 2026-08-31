'use server';

import { revalidatePath } from 'next/cache';

import { requireUser } from '@/server/auth';
import { callRpc, db, isDemoMode } from '@/server/queries/client';
import { chatSetupProblem } from '@/server/queries/chat';
import type { ChatMaterial } from '@/lib/types';
import { DEFAULT_DAYS, DEPTH_DAYS } from './depths';

export interface ChatState {
  status: 'idle' | 'answered' | 'error';
  message?: string;
  /** Вопрос возвращается, чтобы при ошибке человек не набирал его заново. */
  question?: string;
}

const MAX_QUESTION = 500;
const TIMEOUT_MS = 90_000;

function pickDays(raw: unknown): number {
  const n = Number(raw);
  return DEPTH_DAYS.includes(n) ? n : DEFAULT_DAYS;
}

/**
 * Один вопрос — один цикл: база отбирает материал под правами спрашивающего,
 * сценарий n8n просит модель сформулировать ответ по этому материалу, обращение
 * записывается в историю.
 *
 * Отбор делает именно база, а не модель: у модели нет доступа ни к одной
 * строке, она получает только то, что человеку и так разрешено видеть. Поэтому
 * чат не может показать чужое событие или лот, скрытый правилами доступа.
 */
export async function askChat(_prev: ChatState, form: FormData): Promise<ChatState> {
  const user = await requireUser();

  const question = String(form.get('question') ?? '')
    .trim()
    .slice(0, MAX_QUESTION);
  const days = pickDays(form.get('days'));

  if (question.length < 3) {
    return { status: 'error', message: 'Вопрос слишком короткий.', question };
  }

  if (isDemoMode()) {
    return {
      status: 'error',
      message: 'В демонстрационном режиме чат не обращается к модели.',
      question,
    };
  }

  const problem = chatSetupProblem();
  if (problem) return { status: 'error', message: problem, question };

  const base = String(process.env.NEXT_PUBLIC_N8N_BASE_URL).replace(/\/+$/, '');
  const token = String(process.env.N8N_CHAT_TOKEN);

  const supabase = await db();

  const { data: created, error: createError } = await supabase
    .from('chat_messages')
    .insert({ user_id: user.user_id, question })
    .select('id')
    .single<{ id: number }>();

  if (createError || !created) {
    return {
      status: 'error',
      message: createError?.message ?? 'Не удалось записать обращение.',
      question,
    };
  }

  const id = created.id;

  /** Отметить обращение неудачным. Текст ошибки виден только автору и админу. */
  async function markFailed(status: 'failed' | 'empty', text: string): Promise<ChatState> {
    await supabase
      .from('chat_messages')
      .update({ status, error: text.slice(0, 500), answered_at: new Date().toISOString() })
      .eq('id', id);
    revalidatePath('/chat');
    return { status: 'error', message: text, question };
  }

  let material: ChatMaterial;
  try {
    material = await callRpc<ChatMaterial>('app_chat_search', {
      p_question: question,
      p_days: days,
    });
  } catch (error) {
    const text = error instanceof Error ? error.message : 'неизвестная ошибка';
    return markFailed('failed', `Отбор материала не удался: ${text}`);
  }

  const foundEvents = Number(material?.events_count ?? 0);
  const foundTenders = Number(material?.tenders_count ?? 0);

  let payload: { ok?: boolean; answer?: string; cost_usd?: number; prichina?: string };
  try {
    const response = await fetch(`${base}/webhook/chat-answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, question, material }),
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    const raw = await response.text();
    try {
      payload = JSON.parse(raw) as typeof payload;
    } catch {
      payload = {};
    }

    if (!response.ok) {
      // Причина отказа приходит словом, а не кодом: человеку нужно понять,
      // к кому идти — к администратору за секретом или ждать нового месяца.
      const reason =
        payload.prichina === 'token_not_set'
          ? 'Не задан общий секрет в разделе «Интеграции».'
          : payload.prichina === 'bad_token'
            ? 'Секрет обращения не совпадает с сохранённым в системе.'
            : payload.prichina === 'budget_exhausted'
              ? 'Месячный предел расхода на модель исчерпан. Обращения к модели остановлены до начала следующего месяца.'
              : `Сценарий ответил кодом ${response.status}.`;
      return markFailed('failed', reason);
    }
  } catch (error) {
    const text =
      error instanceof Error && error.name === 'TimeoutError'
        ? 'Ответ не пришёл за полторы минуты. Обращение осталось в истории — попробуйте повторить.'
        : `Сценарий недоступен: ${error instanceof Error ? error.message : 'неизвестная ошибка'}`;
    return markFailed('failed', text);
  }

  const answer = String(payload.answer ?? '').trim();
  if (answer === '') {
    return markFailed('empty', 'Модель не вернула текст. Обращение записано, расход не списан.');
  }

  const { error: saveError } = await supabase
    .from('chat_messages')
    .update({
      answer,
      status: 'answered',
      found_events: foundEvents,
      found_tenders: foundTenders,
      cost_usd: Number(payload.cost_usd ?? 0) || null,
      answered_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (saveError) {
    return { status: 'error', message: `Ответ получен, но не сохранён: ${saveError.message}`, question };
  }

  revalidatePath('/chat');
  return { status: 'answered' };
}
