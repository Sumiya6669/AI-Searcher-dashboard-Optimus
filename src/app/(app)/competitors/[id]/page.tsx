import { ArrowLeft, ExternalLink } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { CrawlHealthBadge } from '@/components/domain/Badges';
import { EventFeed } from '@/components/domain/EventFeed';
import { KpiRow } from '@/components/domain/KpiCard';
import { Badge } from '@/components/ui/Badge';
import { ButtonLink } from '@/components/ui/Button';
import { Card, CardBody, CardHead, PageHeader } from '@/components/ui/Card';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { TableWrap, Td, Th, Tr } from '@/components/ui/Table';
import { CHANGE_TYPE_LABEL, SECTION_TYPE_LABEL } from '@/lib/domain';
import { formatDateTime, formatNumber, formatPercent, formatShort, hostOf, truncate } from '@/lib/format';
import { readInt, type SearchParamsInput } from '@/lib/url';
import { fetchCompetitor, fetchCompetitorChanges, fetchCompetitorPages } from '@/server/queries/competitors';
import { fetchEvents } from '@/server/queries/events';

export const metadata: Metadata = { title: 'Конкурент' };
export const dynamic = 'force-dynamic';

export default async function CompetitorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParamsInput>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const competitorId = Number.parseInt(id, 10);
  if (!Number.isFinite(competitorId)) notFound();

  const periodDays = readInt(query, 'period', 30);
  const result = await fetchCompetitor(competitorId, periodDays);
  if (!result.ok) {
    return (
      <Card>
        <ErrorState message={result.error} retryHref={`/competitors/${id}`} />
      </Card>
    );
  }
  const competitor = result.data;
  if (!competitor) notFound();

  const [pages, changes, events] = await Promise.all([
    fetchCompetitorPages(competitorId),
    fetchCompetitorChanges(competitorId, periodDays),
    competitor.entity_id
      ? fetchEvents({ periodDays, severities: [], entityId: competitor.entity_id, page: 1, pageSize: 6 })
      : Promise.resolve({ ok: true as const, data: { rows: [], total: 0 } }),
  ]);

  return (
    <>
      <Link
        href="/competitors"
        className="mb-3 inline-flex items-center gap-1 text-[12.5px] text-[var(--color-ink-2)] hover:text-[var(--color-ink)]"
      >
        <ArrowLeft size={13} />
        К списку конкурентов
      </Link>

      <PageHeader
        title={competitor.name}
        subtitle={competitor.base_url ? hostOf(competitor.base_url) : 'адрес сайта не указан'}
        actions={
          <>
            <CrawlHealthBadge health={competitor.crawl_health} />
            {competitor.base_url ? (
              <ButtonLink href={competitor.base_url} external size="sm">
                Открыть сайт
                <ExternalLink size={13} />
              </ButtonLink>
            ) : null}
            {competitor.entity_id ? (
              <ButtonLink href={`/brands/${competitor.entity_id}`} size="sm">
                Карточка в словаре
              </ButtonLink>
            ) : null}
          </>
        }
      />

      <div className="space-y-4">
        <KpiRow
          items={[
            { label: 'Событий за период', value: formatNumber(competitor.events_count) },
            { label: 'Изменений за период', value: formatNumber(competitor.changes_count) },
            {
              label: 'Из них значимых',
              value: formatNumber(competitor.significant_count),
              hint: 'прошли фильтр и оценку моделью',
            },
            {
              label: 'Успешность обхода',
              value: formatPercent(competitor.crawl_success_pct),
              hint: `${competitor.pages_ok} из ${competitor.pages_active} страниц`,
              tone:
                competitor.crawl_health === 'critical'
                  ? 'critical'
                  : competitor.crawl_health === 'warning'
                    ? 'warning'
                    : 'success',
            },
          ]}
        />

        {competitor.pages_failing_hard > 0 ? (
          <p className="rounded-md border border-[var(--color-critical)]/30 bg-[var(--color-critical-soft)] px-3 py-2 text-[13px] text-[var(--color-critical)]">
            Страниц, падающих три обхода подряд и более: {competitor.pages_failing_hard}. Раздел выглядит спокойным не
            потому, что изменений нет, а потому, что данные не приходят.
          </p>
        ) : null}

        <Card>
          <CardHead
            title="Изменения"
            hint={`за ${periodDays} дней · последний обход ${formatShort(competitor.last_crawled_at)}`}
          />
          {!changes.ok ? (
            <ErrorState message={changes.error} retryHref={`/competitors/${id}`} />
          ) : changes.data.length === 0 ? (
            <EmptyState
              title="Изменений за период не зафиксировано"
              hint="Технические изменения отсекаются по объёму, поэтому пустой список — это чаще всего действительно тишина на сайте."
            />
          ) : (
            <TableWrap>
              <thead>
                <tr>
                  <Th>Дата</Th>
                  <Th>Раздел</Th>
                  <Th>Тип</Th>
                  <Th>Что изменилось</Th>
                  <Th>Оценка</Th>
                </tr>
              </thead>
              <tbody>
                {changes.data.map((change) => (
                  <Tr key={change.id}>
                    <Td className="whitespace-nowrap text-[var(--color-ink-2)]">{formatShort(change.detected_at)}</Td>
                    <Td className="whitespace-nowrap">
                      {change.section_type ? SECTION_TYPE_LABEL[change.section_type] ?? change.section_type : '—'}
                      {change.page_url ? (
                        <a
                          href={change.page_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-[11.5px] text-[var(--color-accent-ink)] hover:underline"
                        >
                          страница
                        </a>
                      ) : null}
                    </Td>
                    <Td className="whitespace-nowrap">
                      {CHANGE_TYPE_LABEL[change.change_type] ?? change.change_type}
                    </Td>
                    <Td className="max-w-xl text-[var(--color-ink-2)]">
                      {change.diff_summary ? truncate(change.diff_summary, 320) : '—'}
                      {change.diff_chars ? (
                        <span className="block text-[11.5px] text-[var(--color-ink-3)]">
                          объём изменения: {formatNumber(change.diff_chars)} знаков
                        </span>
                      ) : null}
                    </Td>
                    <Td>
                      {change.is_significant ? (
                        <Badge tone="warning">значимое</Badge>
                      ) : (
                        <Badge tone="neutral" title={change.reject_reason ?? undefined}>
                          отсеяно
                        </Badge>
                      )}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </TableWrap>
          )}
        </Card>

        <div className="grid min-w-0 gap-4 lg:grid-cols-2">
          <Card>
            <CardHead title="Страницы под наблюдением" />
            {!pages.ok ? (
              <ErrorState message={pages.error} retryHref={`/competitors/${id}`} />
            ) : pages.data.length === 0 ? (
              <EmptyState title="Страницы не заведены" hint="Пока не задан ни один раздел, наблюдение не идёт." />
            ) : (
              <TableWrap>
                <thead>
                  <tr>
                    <Th>Раздел</Th>
                    <Th>Обход</Th>
                    <Th>Последний обход</Th>
                    <Th numeric>Отказов</Th>
                  </tr>
                </thead>
                <tbody>
                  {pages.data.map((page) => (
                    <Tr key={page.id}>
                      <Td>
                        <a
                          href={page.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[var(--color-accent-ink)] hover:underline"
                        >
                          {page.section_type ? SECTION_TYPE_LABEL[page.section_type] ?? page.section_type : 'страница'}
                        </a>
                        <span className="block break-all text-[11.5px] text-[var(--color-ink-3)]">{page.url}</span>
                      </Td>
                      <Td className="whitespace-nowrap">
                        {page.crawl_status === 'ok' ? (
                          <Badge tone="success">читается</Badge>
                        ) : (
                          <Badge tone="critical" title={page.crawl_status ?? undefined}>
                            не читается
                          </Badge>
                        )}
                        <span className="block text-[11.5px] text-[var(--color-ink-3)]">
                          {page.fetch_mode === 'firecrawl' ? 'через Firecrawl' : 'обычным запросом'}
                        </span>
                      </Td>
                      <Td className="whitespace-nowrap text-[var(--color-ink-2)]">{formatDateTime(page.last_crawled_at)}</Td>
                      <Td numeric>{page.fail_count ?? 0}</Td>
                    </Tr>
                  ))}
                </tbody>
              </TableWrap>
            )}
          </Card>

          <Card>
            <CardHead
              title="События по этому конкуренту"
              actions={
                competitor.entity_id ? (
                  <Link
                    href={`/events?entity=${competitor.entity_id}&period=90`}
                    className="text-[12.5px] text-[var(--color-accent-ink)] hover:underline"
                  >
                    все события
                  </Link>
                ) : null
              }
            />
            {!events.ok ? (
              <ErrorState message={events.error} retryHref={`/competitors/${id}`} />
            ) : (
              <EventFeed events={events.data.rows} />
            )}
          </Card>
        </div>

        <Card>
          <CardBody className="text-[12.5px] text-[var(--color-ink-2)]">
            Одна ошибка обхода конкурента критичным не делает: сеть отвечает не всегда. Признак «падает подряд»
            выставляется после трёх неудачных обходов одной страницы — порог задан настройкой{' '}
            <code className="rounded bg-[var(--color-line-2)] px-1">norm_page_fail_max</code> в базе, а не в интерфейсе.
          </CardBody>
        </Card>
      </div>
    </>
  );
}
