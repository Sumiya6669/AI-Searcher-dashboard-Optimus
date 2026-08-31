import type { Metadata } from 'next';

import { SecretForm } from './SecretForm';
import { Badge } from '@/components/ui/Badge';
import { Card, CardBody, CardHead, PageHeader } from '@/components/ui/Card';
import { ErrorState } from '@/components/ui/States';
import { fetchIntegrations } from '@/server/queries/catalog';

export const metadata: Metadata = { title: 'Интеграции' };
export const dynamic = 'force-dynamic';

export default async function IntegrationsPage() {
  const integrations = await fetchIntegrations();

  return (
    <>
      <PageHeader
        title="Интеграции"
        subtitle="Что подключено к системе снаружи и чего не хватает, чтобы включить остальное"
      />

      {/* items-start: без него левая карточка тянется до высоты правой и под
          последним полем повисает пустое полотно на треть экрана. */}
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card>
          <CardHead
            title="Значения, которые вводятся здесь"
            hint="сохраняются в базу, обратно не показываются"
          />
          <CardBody className="space-y-3">
            {!integrations.ok ? (
              <ErrorState message={integrations.error} retryHref="/admin/integrations" />
            ) : integrations.data.length === 0 ? (
              <p className="py-4 text-center text-[13px] text-[var(--color-ink-2)]">
                Список пуст. Так бывает в демонстрационном режиме: он работает без базы, а значения
                подключений хранятся именно в базе.
              </p>
            ) : (
              integrations.data.map((row) => <SecretForm key={row.code} row={row} />)
            )}
            <p className="text-[11.5px] leading-5 text-[var(--color-ink-3)]">
              Правильное место для ключа — учётные данные n8n, а не строка в базе. Здесь ключи
              оставлены потому, что сценарии сбора читают их сами и заказчик может включить
              подключение без разработчика. После приёмки ключи следует перевыпустить и перенести
              в учётные данные.
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardHead title="Состояние подключений" hint="что работает, что ждёт и чего именно ждёт" />
          <CardBody className="space-y-3">
            <Item
              title="Anthropic — модель для классификации и сводок"
              state="работает частично"
              tone="warning"
            >
              Обращения идут через встроенный шлюз n8n, и через него доступна одна модель —
              claude-haiku. Поэтому «сильная» модель в настройках вынужденно совпадает с быстрой:
              сводки пишет та же модель, что и классифицирует. Общий остаток шлюза — 5 USD на всё,
              включая обход сайтов конкурентов, и около 2 USD уже израсходовано.
              <Todo>
                Нужен собственный ключ Anthropic. Порядок: в n8n создать учётные данные типа
                «Anthropic», вставить ключ, затем в настройках вернуть model_strong значение
                claude-sonnet-4-5. Ключ вводится в n8n, а не здесь и не в переписке.
              </Todo>
            </Item>

            <Item title="Google Programmable Search — второй поисковый источник" state="ждёт ключа" tone="critical">
              Сценарий сбора готов и проверен, но не публикуется, пока пусты ключ и идентификатор
              поиска. Бесплатная квота — 100 запросов в сутки; система рассчитана на 32 и
              останавливается заранее, не дожидаясь платного перерасхода.
              <Todo>Заполните два значения слева — после этого сценарий можно публиковать.</Todo>
            </Item>

            <Item title="Brave Search — основной поисковый источник" state="работает" tone="success">
              Бесплатный тариф: 2000 запросов в месяц, расход считается на стороне системы, потому
              что портал при исчерпании квоты просто перестаёт отдавать результаты, ничего не
              сообщая.
              <Todo>Ключ вводился в переписке — перевыпустить после приёмки.</Todo>
            </Item>

            <Item title="Firecrawl — обход сайтов конкурентов" state="работает" tone="success">
              Тоже через шлюз n8n и из того же остатка, что и модель. Один сайт, собираемый в
              браузере (baigenews), намеренно оставлен выключенным: он расходовал бы этот остаток
              ради одного новостного потока из тринадцати.
            </Item>

            <Item title="Perplexity — исследовательский источник" state="отложено" tone="neutral">
              Сценарий заготовлен и не публикуется. Подключение снято с задачи по вашему решению.
            </Item>

            <Item title="Тендерный API" state="отложено" tone="neutral">
              Заготовка приёма закупок из внешнего API готова; подключение выделено в отдельную
              работу.
            </Item>
          </CardBody>
        </Card>
      </div>
    </>
  );
}

function Item({
  title,
  state,
  tone,
  children,
}: {
  title: string;
  state: string;
  tone: 'success' | 'warning' | 'critical' | 'neutral';
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-[var(--color-line)] bg-[var(--color-raise)] p-3.5">
      <div className="mb-1.5 flex flex-wrap items-center gap-2">
        <h3 className="text-[13.5px] font-semibold text-[var(--color-ink)]">{title}</h3>
        <Badge tone={tone}>{state}</Badge>
      </div>
      <div className="space-y-2 text-[12.5px] leading-5 text-[var(--color-ink-2)]">{children}</div>
    </section>
  );
}

function Todo({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-md bg-[var(--color-soft)] px-2.5 py-1.5 text-[12.5px] leading-5 text-[var(--color-accent-ink)]">
      {children}
    </p>
  );
}
