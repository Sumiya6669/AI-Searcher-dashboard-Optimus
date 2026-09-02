import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { FreshnessBadge } from '@/components/domain/Badges';
import { EventFeed } from '@/components/domain/EventFeed';
import { KpiRow } from '@/components/domain/KpiCard';
import { Badge } from '@/components/ui/Badge';
import { ButtonLink } from '@/components/ui/Button';
import { Card, CardBody, CardHead, DefinitionList, PageHeader } from '@/components/ui/Card';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { TableWrap, Td, Th, Tr } from '@/components/ui/Table';
import { FRESHNESS } from '@/lib/domain';
import { formatDateTime, formatDuration, formatNumber, formatPercent, formatRelative, truncate } from '@/lib/format';
import { readInt, type SearchParamsInput } from '@/lib/url';
import { fetchEvents } from '@/server/queries/events';
import { fetchSource, fetchSourceAccounts } from '@/server/queries/sources';
import { formatInterval } from '@/lib/interval';

export const metadata: Metadata = { title: 'Источник' };
export const dynamic = 'force-dynamic';

export default async function SourcePage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<SearchParamsInput>;
}) {
  const { code } = await params;
  const query = await searchParams;
  const periodDays = readInt(query, 'period', 30);

  const result = await fetchSource(code, periodDays);
  if (!result.ok) {
    return (
      <Card>
        <ErrorState message={result.error} retryHref={`/admin/sources/${code}`} />
      </Card>
    );
  }
  const source = result.data;
  if (!source) notFound();

  const [accounts, events] = await Promise.all([
    source.kind === 'social' ? fetchSourceAccounts(source.source_id) : Promise.resolve({ ok: true as const, data: [] }),
    fetchEvents({ periodDays, severities: [], sourceCode: source.code, page: 1, pageSize: 6 }),
  ]);

  return (
    <>
      <Link
        href="/admin/sources"
        className="mb-3 inline-flex items-center gap-1 text-[12.5px] text-[var(--color-ink-2)] hover:text-[var(--color-ink)]"
      >
        <ArrowLeft size={13} />
        К списку источников
      </Link>

      <PageHeader
        title={source.name}
        subtitle={`${source.code} · сценарий ${source.workflow_code ?? '—'}`}
        actions={
          <>
            <FreshnessBadge freshness={source.freshness} />
            <ButtonLink href={`/events?source=${source.code}&period=90`} size="sm">
              События этого источника
            </ButtonLink>
          </>
        }
      />

      {source.blocker ? (
        <p className="mb-4 rounded-md border border-[var(--color-warning)]/30 bg-[var(--color-warning-soft)] px-3 py-2 text-[13px] text-[var(--color-warning)]">
          {source.blocker}. {FRESHNESS[source.freshness].hint}.
        </p>
      ) : null}

      <div className="space-y-4">
        <KpiRow
          items={[
            { label: 'Материалов всего', value: formatNumber(source.materials_total) },
            { label: 'За период', value: formatNumber(source.materials_period) },
            { label: 'Событий создано', value: formatNumber(source.events_total) },
            { label: 'Доля потока', value: formatPercent(source.share_pct, 1) },
          ]}
        />

        <div className="grid min-w-0 gap-4 lg:grid-cols-2">
          <Card>
            <CardHead title="Работа источника" />
            <CardBody>
              <DefinitionList
                items={[
                  { term: 'Вид', value: source.kind },
                  { term: 'Включён', value: source.is_active ? 'да' : 'нет' },
                  {
                    term: 'Подключён',
                    value: source.connected ? 'да' : `нет — не заполнено: ${source.missing}`,
                  },
                  {
                    term: 'Ожидаемая частота',
                    // null означает «ожидать нечего»: источник выключен или не подключён
                    value:
                      source.expected_interval_min !== null
                        ? `раз в ${formatInterval(source.expected_interval_min)}`
                        : 'не ожидается — источник не работает',
                  },
                  {
                    term: 'Последняя активность',
                    value: source.last_activity_at
                      ? `${formatDateTime(source.last_activity_at)} (${formatRelative(source.last_activity_at)})`
                      : 'активности не было',
                  },
                  { term: 'Последний успешный запуск', value: formatDateTime(source.last_success_at) },
                  { term: 'Успешных запусков за сутки', value: formatNumber(source.runs_ok_24h) },
                  {
                    term: 'Неуспешных за сутки',
                    value:
                      source.runs_failed_24h > 0 ? (
                        <span className="text-[var(--color-critical)]">{formatNumber(source.runs_failed_24h)}</span>
                      ) : (
                        '0'
                      ),
                  },
                  { term: 'Среднее время запуска', value: formatDuration(source.avg_duration_ms) },
                ]}
              />
              {source.last_error ? (
                <div className="mt-3">
                  <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.09em] text-[var(--color-ink-3)]">
                    Последняя ошибка
                    {source.last_error_at ? (
                      <span className="ml-1.5 font-normal normal-case tracking-normal text-[var(--color-ink-3)]">
                        · {formatDateTime(source.last_error_at)}
                      </span>
                    ) : null}
                  </p>
                  <pre className="thin-scroll max-h-40 overflow-auto rounded border border-[var(--color-line-2)] bg-[var(--color-bg)] p-2 text-[11.5px] text-[var(--color-ink-2)]">
                    {truncate(source.last_error, 1200)}
                  </pre>
                </div>
              ) : null}
            </CardBody>
          </Card>

          {source.kind === 'social' ? (
            <Card>
              <CardHead title="Наблюдаемые аккаунты" hint={`активных: ${source.accounts_active}`} />
              {!accounts.ok ? (
                <ErrorState message={accounts.error} retryHref={`/admin/sources/${code}`} />
              ) : accounts.data.length === 0 ? (
                <EmptyState
                  title="Аккаунты не заведены"
                  hint="Источник подключён, но наблюдать нечего: список сообществ пуст."
                />
              ) : (
                <TableWrap>
                  <thead>
                    <tr>
                      <Th>Аккаунт</Th>
                      <Th numeric>Записей</Th>
                      <Th>Последняя запись</Th>
                      <Th numeric>Отказов</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {accounts.data.map((account) => (
                      <Tr key={account.id}>
                        <Td>
                          {account.url ? (
                            <a
                              href={account.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[var(--color-accent-ink)] hover:underline"
                            >
                              {account.title ?? account.handle}
                            </a>
                          ) : (
                            (account.title ?? account.handle)
                          )}
                          <span className="block text-[11.5px] text-[var(--color-ink-3)]">
                            {account.platform} · {account.handle}
                          </span>
                        </Td>
                        <Td numeric>{formatNumber(account.posts_total)}</Td>
                        <Td className="whitespace-nowrap text-[var(--color-ink-2)]">{formatRelative(account.last_post_at)}</Td>
                        <Td numeric>
                          {account.fail_count && account.fail_count > 0 ? (
                            <Badge tone="warning">{account.fail_count}</Badge>
                          ) : (
                            '0'
                          )}
                        </Td>
                      </Tr>
                    ))}
                  </tbody>
                </TableWrap>
              )}
            </Card>
          ) : (
            <Card>
              <CardHead title="Что даёт этот источник" />
              <CardBody className="space-y-2 text-[13px] text-[var(--color-ink-2)]">
                <p>
                  Материалов много не значит хорошо. Полезность источника видна по отношению событий к материалам:
                  сейчас это{' '}
                  <strong className="text-[var(--color-ink)]">
                    {source.materials_total > 0
                      ? formatPercent((source.events_total / source.materials_total) * 100, 1)
                      : '—'}
                  </strong>
                  .
                </p>
                {source.kind === 'registry' || source.kind === 'crawl' ? (
                  <p>
                    Этот источник не пишет материалы в общий поток: закупки и изменения на сайтах хранятся отдельно,
                    поэтому колонка «материалов» у него нулевая по построению, а не из-за сбоя.
                  </p>
                ) : null}
              </CardBody>
            </Card>
          )}
        </div>

        <Card>
          <CardHead title="Последние события источника" />
          {!events.ok ? (
            <ErrorState message={events.error} retryHref={`/admin/sources/${code}`} />
          ) : (
            <EventFeed events={events.data.rows} />
          )}
        </Card>
      </div>
    </>
  );
}
