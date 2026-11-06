import type { Metadata } from 'next';
import { Suspense } from 'react';

import { CrawlHealthBadge } from '@/components/domain/Badges';
import { FilterBar, type FilterField } from '@/components/domain/FilterBar';
import { Card, CardHead, PageHeader } from '@/components/ui/Card';
import { EmptyState, ErrorState, LoadingSkeleton } from '@/components/ui/States';
import { LinkCell, TableWrap, Td, Th, Tr } from '@/components/ui/Table';
import { CHANGE_TYPE_LABEL, PERIOD_OPTIONS } from '@/lib/domain';
import { formatNumber, formatPercent, formatShort, hostOf } from '@/lib/format';
import { readInt, readParam, type SearchParamsInput } from '@/lib/url';
import { sortRows } from '@/lib/sort';
import { fetchCompetitorActivity } from '@/server/queries/competitors';

export const metadata: Metadata = { title: 'Конкуренты' };
export const dynamic = 'force-dynamic';

export default async function CompetitorsPage({ searchParams }: { searchParams: Promise<SearchParamsInput> }) {
  const params = await searchParams;

  const fields: FilterField[] = [
    { key: 'period', label: 'Период', kind: 'select', options: PERIOD_OPTIONS },
    {
      key: 'health',
      label: 'Состояние обхода',
      kind: 'select',
      options: [
        { value: 'critical', label: 'падает подряд' },
        { value: 'warning', label: 'часть страниц не читается' },
        { value: 'ok', label: 'исправен' },
        { value: 'not_monitored', label: 'страницы не заведены' },
      ],
    },
    { key: 'q', label: 'Поиск', kind: 'search', placeholder: 'название конкурента' },
  ];

  return (
    <>
      <PageHeader title="Конкуренты" subtitle="Кто из конкурентов активизировался" />
      <FilterBar fields={fields} />
      <Suspense
        fallback={
          <Card>
            <LoadingSkeleton rows={8} />
          </Card>
        }
      >
        <CompetitorTable params={params} />
      </Suspense>
    </>
  );
}

async function CompetitorTable({ params }: { params: SearchParamsInput }) {
  const periodDays = readInt(params, 'period', 30);
  const health = readParam(params, 'health');
  const query = readParam(params, 'q')?.trim().toLowerCase();

  const result = await fetchCompetitorActivity(periodDays);
  if (!result.ok) {
    return (
      <Card>
        <ErrorState message={result.error} retryHref="/competitors" />
      </Card>
    );
  }

  let rows = result.data;
  if (health) rows = rows.filter((r) => r.crawl_health === health);
  if (query) rows = rows.filter((r) => r.name.toLowerCase().includes(query));

  // Отбор отработал — теперь порядок. Это разные вещи: фильтр решает, кто
  // попадёт в список, сортировка — в каком порядке их читать.
  const sort = readParam(params, 'sort');
  rows = sortRows(rows, sort ?? '-changes', {
    name: (r) => r.name,
    events: (r) => r.events_count,
    changes: (r) => r.changes_count,
    date: (r) => r.last_change_at,
    crawl: (r) => r.crawl_success_pct,
  });

  return (
    <Card>
      <CardHead
        title={`Конкурентов под наблюдением: ${formatNumber(rows.length)}`}
        hint="нажмите на заголовок столбца, чтобы изменить порядок"
      />
      {rows.length === 0 ? (
        <EmptyState title="Под эти условия конкуренты не подходят" hint="Сбросьте фильтры или увеличьте период." />
      ) : (
        <TableWrap>
          <thead>
            <tr>
              <Th ascFirst sortKey="name" currentSort={sort} params={params}>
                Конкурент
              </Th>
              <Th numeric sortKey="events" currentSort={sort} params={params}>
                Событий
              </Th>
              <Th numeric sortKey="changes" currentSort={sort ?? '-changes'} params={params}>
                Изменений
              </Th>
              <Th>Что менялось</Th>
              <Th sortKey="date" currentSort={sort} params={params}>
                Последнее изменение
              </Th>
              <Th numeric sortKey="crawl" currentSort={sort} params={params}>
                Обход
              </Th>
              <Th>Состояние</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <Tr key={row.competitor_id}>
                <LinkCell href={`/competitors/${row.competitor_id}`}>
                  {row.name}
                  {row.base_url ? (
                    <span className="block text-[11.5px] font-normal text-[var(--color-ink-3)]">
                      {hostOf(row.base_url)}
                    </span>
                  ) : null}
                </LinkCell>
                <Td numeric>{formatNumber(row.events_count)}</Td>
                <Td numeric>
                  {formatNumber(row.changes_count)}
                  {row.significant_count > 0 ? (
                    <span className="block text-[11.5px] font-normal text-[var(--color-ink-3)]">
                      значимых {row.significant_count}
                    </span>
                  ) : null}
                </Td>
                <Td className="max-w-56 text-[var(--color-ink-2)]">
                  {row.change_types
                    ? row.change_types
                        .split(', ')
                        .map((t) => CHANGE_TYPE_LABEL[t] ?? t)
                        .join(', ')
                    : '—'}
                </Td>
                <Td className="whitespace-nowrap text-[var(--color-ink-2)]">{formatShort(row.last_change_at)}</Td>
                <Td numeric>
                  {formatPercent(row.crawl_success_pct)}
                  <span className="block text-[11.5px] font-normal text-[var(--color-ink-3)]">
                    {row.pages_ok} из {row.pages_active} стр.
                  </span>
                </Td>
                <Td>
                  <CrawlHealthBadge health={row.crawl_health} />
                </Td>
              </Tr>
            ))}
          </tbody>
        </TableWrap>
      )}
    </Card>
  );
}
