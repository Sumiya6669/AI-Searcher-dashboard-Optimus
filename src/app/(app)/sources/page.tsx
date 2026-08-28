import type { Metadata } from 'next';
import { Suspense } from 'react';

import { FreshnessBadge } from '@/components/domain/Badges';
import { FilterBar, type FilterField } from '@/components/domain/FilterBar';
import { Bar } from '@/components/ui/Badge';
import { Card, CardBody, CardHead, PageHeader } from '@/components/ui/Card';
import { ErrorState, LoadingSkeleton } from '@/components/ui/States';
import { LinkCell, TableWrap, Td, Th, Tr } from '@/components/ui/Table';
import { PERIOD_OPTIONS } from '@/lib/domain';
import { formatInterval } from '@/lib/interval';
import { formatNumber, formatPercent, formatRelative, truncate } from '@/lib/format';
import { readInt, readParam, type SearchParamsInput } from '@/lib/url';
import { fetchSourceStats } from '@/server/queries/sources';

export const metadata: Metadata = { title: 'Источники' };
export const dynamic = 'force-dynamic';

export default async function SourcesPage({ searchParams }: { searchParams: Promise<SearchParamsInput> }) {
  const params = await searchParams;

  const fields: FilterField[] = [
    { key: 'period', label: 'Период', kind: 'select', options: PERIOD_OPTIONS },
    {
      key: 'state',
      label: 'Состояние',
      kind: 'select',
      options: [
        { value: 'active', label: 'работает' },
        { value: 'stale', label: 'данные устарели' },
        { value: 'error', label: 'ошибка' },
        { value: 'idle', label: 'простаивает' },
        { value: 'disabled', label: 'выключен' },
        { value: 'not_connected', label: 'не подключён' },
      ],
    },
  ];

  return (
    <>
      <PageHeader title="Источники" subtitle="Откуда берётся материал и где охват просел" />
      <FilterBar fields={fields} />
      <Suspense
        fallback={
          <Card>
            <LoadingSkeleton rows={8} />
          </Card>
        }
      >
        <SourceTable params={params} />
      </Suspense>
    </>
  );
}

async function SourceTable({ params }: { params: SearchParamsInput }) {
  const periodDays = readInt(params, 'period', 30);
  const state = readParam(params, 'state');

  const result = await fetchSourceStats(periodDays);
  if (!result.ok) {
    return (
      <Card>
        <ErrorState message={result.error} retryHref="/sources" />
      </Card>
    );
  }

  const rows = state ? result.data.filter((s) => s.freshness === state) : result.data;
  const maxShare = Math.max(1, ...result.data.map((s) => s.share_pct));
  const notConnected = result.data.filter((s) => !s.connected).length;

  return (
    <div className="space-y-4">
      <Card>
        <CardBody className="text-[12.5px] text-[var(--color-ink-2)]">
          Неподключённые источники не скрываются: строка с нулём и подписью, чего не хватает, честнее, чем её
          отсутствие — она показывает, какая часть охвата не работает. Сейчас ожидают настройки: {notConnected}.
        </CardBody>
      </Card>

      <Card>
        <CardHead title={`Источников: ${formatNumber(rows.length)}`} hint="порядок по объёму собственных данных" />
        <TableWrap>
          <thead>
            <tr>
              <Th>Источник</Th>
              <Th numeric>Материалов</Th>
              <Th>Доля</Th>
              <Th numeric>Событий</Th>
              <Th>Состояние</Th>
              <Th>Последнее обновление</Th>
              <Th>Что мешает</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((source) => (
              <Tr key={source.code}>
                <LinkCell href={`/sources/${source.code}`}>
                  {source.name}
                  <span className="block text-[11.5px] font-normal text-[var(--color-ink-3)]">
                    {source.workflow_code ?? '—'}
                    {source.accounts_active > 0 ? ` · ${source.accounts_active} аккаунтов` : ''}
                  </span>
                </LinkCell>
                <Td numeric className={source.materials_total === 0 ? 'text-[var(--color-ink-3)]' : undefined}>
                  {formatNumber(source.materials_total)}
                  {source.materials_period > 0 ? (
                    <span className="block text-[11.5px] font-normal text-[var(--color-ink-3)]">
                      за период {formatNumber(source.materials_period)}
                    </span>
                  ) : null}
                </Td>
                <Td className="w-28">
                  <Bar value={(source.share_pct / maxShare) * 100} />
                  <span className="tabular mt-0.5 block text-[11.5px] text-[var(--color-ink-3)]">
                    {formatPercent(source.share_pct, 1)}
                  </span>
                </Td>
                <Td numeric className={source.events_total === 0 ? 'text-[var(--color-ink-3)]' : undefined}>
                  {formatNumber(source.events_total)}
                </Td>
                <Td>
                  <FreshnessBadge freshness={source.freshness} />
                </Td>
                <Td className="whitespace-nowrap text-[var(--color-ink-2)]">
                  {source.last_activity_at ? formatRelative(source.last_activity_at) : 'активности не было'}
                  <span className="block text-[11.5px] text-[var(--color-ink-3)]">
                    ожидается раз в {formatInterval(source.expected_interval_min)}
                  </span>
                </Td>
                <Td className="max-w-56 text-[12.5px] text-[var(--color-ink-2)]">
                  {source.blocker || (source.last_error ? truncate(source.last_error, 90) : '—')}
                </Td>
              </Tr>
            ))}
          </tbody>
        </TableWrap>
      </Card>
    </div>
  );
}
