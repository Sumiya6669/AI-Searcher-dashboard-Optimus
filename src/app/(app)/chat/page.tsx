import type { Metadata } from 'next';

import { Answer } from './Answer';
import { ChatForm } from './ChatForm';
import { Badge } from '@/components/ui/Badge';
import { Card, CardBody, PageHeader } from '@/components/ui/Card';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { formatDateTime, formatNumber, plural } from '@/lib/format';
import { getCurrentUser } from '@/server/auth';
import { chatSetupProblem, fetchChatHistory } from '@/server/queries/chat';

export const metadata: Metadata = { title: 'Чат' };
export const dynamic = 'force-dynamic';

const STATUS_TEXT: Record<string, string> = {
  pending: 'ответ не получен',
  failed: 'не удалось',
  empty: 'модель не ответила',
};

export default async function ChatPage() {
  const [user, history] = await Promise.all([getCurrentUser(), fetchChatHistory()]);
  const problem = chatSetupProblem();
  const isAdmin = user?.role === 'admin';

  return (
    <>
      <PageHeader
        title="Чат"
        subtitle="Вопрос своими словами — ответ по тому, что система уже собрала"
      />

      <div className="space-y-4">
        <Card>
          <CardBody className="space-y-2 text-[13px] leading-6 text-[var(--color-ink-2)]">
            <p>
              Отвечает не поисковик и не общая модель из интернета. Отбор делает база: по вопросу
              находятся бренды, конкуренты и направления, затем берутся события и лоты за выбранный
              период — и только они уходят в модель, которая формулирует ответ словами.
            </p>
            <p>
              Отсюда два следствия. Модель не может рассказать о том, чего в системе нет: на вопрос
              без материала она обязана ответить «по этому ничего не собрано», и это правильный
              ответ, а не сбой. И она видит ровно то, что разрешено видеть вам: отбор идёт под
              вашими правами доступа, а не от имени системы.
            </p>
          </CardBody>
        </Card>

        {problem ? (
          <Card>
            <CardBody>
              <p className="text-[13px] leading-6 text-[var(--color-ink-2)]">
                <span className="font-semibold text-[var(--color-ink)]">Чат не настроен.</span>{' '}
                {problem}
                {isAdmin ? (
                  <>
                    {' '}
                    Значение уже есть в системе — раздел «Интеграции», строка «Секрет обращения
                    чата»; его нужно задать той же строкой в переменных окружения площадки, где
                    развёрнут дашборд, и пересобрать. Секрет намеренно не читается из базы
                    страницей: тогда любая ошибка в правах доступа выдавала бы его наружу.
                  </>
                ) : (
                  ' Сообщите администратору — поле ввода появится после настройки.'
                )}
              </p>
            </CardBody>
          </Card>
        ) : (
          <ChatForm />
        )}

        {!history.ok ? (
          <Card>
            <ErrorState message={history.error} retryHref="/chat" />
          </Card>
        ) : history.data.length === 0 ? (
          <Card>
            <EmptyState
              title="Вопросов ещё не было"
              hint="История видна только вам. Администратор видит все вопросы — не для контроля, а чтобы понимать, чего системе не хватает."
            />
          </Card>
        ) : (
          <div className="space-y-3">
            {history.data.map((row) => (
              <Card key={row.id}>
                <CardBody className="space-y-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-[14px] font-semibold leading-6 text-[var(--color-ink)]">
                      {row.question}
                    </p>
                    <span className="text-[11.5px] text-[var(--color-ink-3)]">
                      {formatDateTime(row.asked_at)}
                    </span>
                  </div>

                  {row.status === 'answered' && row.answer ? (
                    <Answer text={row.answer} />
                  ) : (
                    <p className="text-[13px] leading-6 text-[var(--color-ink-3)]">
                      {row.error ?? STATUS_TEXT[row.status] ?? row.status}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-1.5 border-t border-[var(--color-line)] pt-2.5">
                    {row.status === 'answered' ? null : (
                      <Badge tone="warning">{STATUS_TEXT[row.status] ?? row.status}</Badge>
                    )}
                    <Badge tone={row.found_events > 0 ? 'accent' : 'neutral'}>
                      {formatNumber(row.found_events)}{' '}
                      {plural(row.found_events, 'событие', 'события', 'событий')}
                    </Badge>
                    <Badge tone={row.found_tenders > 0 ? 'accent' : 'neutral'}>
                      {formatNumber(row.found_tenders)}{' '}
                      {plural(row.found_tenders, 'лот', 'лота', 'лотов')}
                    </Badge>
                    {isAdmin && row.cost_usd !== null ? (
                      <Badge tone="neutral" title="Расход на этот ответ">
                        {Number(row.cost_usd).toFixed(4)} USD
                      </Badge>
                    ) : null}
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
