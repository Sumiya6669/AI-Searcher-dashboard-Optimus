'use client';

import { Send } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useActionState } from 'react';

import { askChat, type ChatState } from './actions';
import { DEFAULT_DAYS, DEPTHS } from './depths';

const initial: ChatState = { status: 'idle' };

/**
 * Примеры вопросов — не украшение. Человек, впервые видящий поле ввода, не
 * знает, о чём эту систему можно спрашивать, и обычно спрашивает то, чего в ней
 * нет. Четыре примера показывают границы: бренд, направление, закупки, обзор.
 */
const EXAMPLES = [
  'Что нового по Sika за последние три недели?',
  'Какие сейчас есть закупки по промышленным полам?',
  'Что происходит с гидроизоляцией в Казахстане?',
  'Главное по отрасли за период',
];

export function ChatForm() {
  const [result, action, pending] = useActionState(askChat, initial);
  const [question, setQuestion] = useState('');
  const [days, setDays] = useState<number>(DEFAULT_DAYS);

  // Удачный вопрос уходит в историю ниже, поле освобождается. Неудачный
  // остаётся в поле: набирать его заново из-за недоступного сценария — обидно.
  useEffect(() => {
    if (result.status === 'answered') setQuestion('');
    else if (result.status === 'error' && result.question) setQuestion(result.question);
  }, [result]);

  const tooShort = question.trim().length < 3;

  return (
    <form action={action} className="space-y-2.5">
      <input type="hidden" name="days" value={days} />

      <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-card)] p-2.5 focus-within:border-[var(--color-accent)]">
        <textarea
          name="question"
          value={question}
          onChange={(event) => setQuestion(event.target.value.slice(0, 500))}
          rows={3}
          maxLength={500}
          disabled={pending}
          spellCheck
          placeholder="Например: что нового по Тиккуриле?"
          className="w-full resize-y bg-transparent text-[14px] leading-6 text-[var(--color-ink)] outline-none placeholder:text-[var(--color-ink-3)] disabled:opacity-60"
        />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--color-line)] pt-2">
          <span className="flex flex-wrap items-center gap-1.5">
            <span className="text-[12px] text-[var(--color-ink-3)]">Искать за</span>
            {DEPTHS.map((depth) => (
              <button
                key={depth.days}
                type="button"
                onClick={() => setDays(depth.days)}
                aria-pressed={days === depth.days}
                className={
                  days === depth.days
                    ? 'rounded-md bg-[var(--color-soft)] px-2 py-1 text-[12px] font-semibold text-[var(--color-accent-ink)]'
                    : 'rounded-md px-2 py-1 text-[12px] text-[var(--color-ink-2)] hover:bg-[var(--color-line-2)]'
                }
              >
                {depth.label}
              </button>
            ))}
          </span>
          <span className="flex items-center gap-2">
            <span className="text-[11.5px] text-[var(--color-ink-3)]">{question.length}/500</span>
            <button
              type="submit"
              disabled={pending || tooShort}
              className="flex items-center gap-1.5 rounded-lg bg-[var(--color-accent)] px-3 py-1.5 text-[13px] font-semibold text-white disabled:opacity-50"
            >
              <Send size={14} strokeWidth={2} />
              {pending ? 'Ищу и формулирую…' : 'Спросить'}
            </button>
          </span>
        </div>
      </div>

      {pending ? (
        <p className="text-[12.5px] text-[var(--color-ink-3)]">
          База отбирает материал, затем модель формулирует ответ. Обычно пять–десять секунд.
        </p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => setQuestion(example)}
              className="rounded-full border border-[var(--color-line)] px-2.5 py-1 text-[12px] text-[var(--color-ink-2)] hover:border-[var(--color-accent)] hover:text-[var(--color-ink)]"
            >
              {example}
            </button>
          ))}
        </div>
      )}

      {result.status === 'error' && result.message ? (
        <p
          role="alert"
          className="rounded-lg bg-[var(--color-critical-soft)] px-3 py-2 text-[12.5px] leading-5 text-[var(--color-critical)]"
        >
          Ответа нет. {result.message}
        </p>
      ) : null}
    </form>
  );
}
