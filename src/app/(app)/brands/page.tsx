import type { Metadata } from 'next';
import { Suspense } from 'react';

import { GapBadge } from '@/components/domain/Badges';
import { FilterBar, type FilterField } from '@/components/domain/FilterBar';
import { Bar } from '@/components/ui/Badge';
import { Card, CardBody, CardHead, PageHeader } from '@/components/ui/Card';
import { EmptyState, ErrorState, LoadingSkeleton } from '@/components/ui/States';
import { LinkCell, TableWrap, Td, Th, Tr } from '@/components/ui/Table';
import { ENTITY_TYPE_LABEL, PERIOD_OPTIONS, RELATION_LABEL } from '@/lib/domain';
import { formatNumber, formatPercent, formatShort } from '@/lib/format';
import { readInt, readParam, type SearchParamsInput } from '@/lib/url';
import { fetchBrandStats } from '@/server/queries/brands';

export const metadata: Metadata = { title: 'Бренды и направления' };
export const dynamic = 'force-dynamic';

export default async function BrandsPage({ searchParams }: { searchParams: Promise<SearchParamsInput> }) {
  const params = await searchParams;

  const fields: FilterField[] = [
    { key: 'period', label: 'Период', kind: 'select', options: PERIOD_OPTIONS },
    {
      key: 'type',
      label: 'Тип',
      kind: 'select',
      options: Object.entries(ENTITY_TYPE_LABEL).map(([value, label]) => ({ value, label })),
    },
    {
      key: 'gap',
      label: 'Настройка рассылки',
      kind: 'select',
      options: [
        { value: '1', label: 'только настроечные дыры' },
        { value: '0', label: 'только с получателем' },
      ],
    },
    {
      key: 'zero',
      label: 'События',
      kind: 'select',
      options: [
        { value: 'has', label: 'есть события' },
        { value: 'none', label: 'ноль событий' },
      ],
    },
    { key: 'q', label: 'Поиск', kind: 'search', placeholder: 'бренд, тема, конкурент' },
  ];

  return (
    <>
      <PageHeader
        title="Бренды и товарные направления"
        subtitle="По каким брендам рынок говорит, а по каким тишина — и доходит ли это до человека"
      />
      <FilterBar fields={fields} />
      <Suspense
        fallback={
          <Card>
            <LoadingSkeleton rows={10} />
          </Card>
        }
      >
        <BrandTable params={params} />
      </Suspense>
    </>
  );
}

async function BrandTable({ params }: { params: SearchParamsInput }) {
  const periodDays = readInt(params, 'period', 30);
  const type = readParam(params, 'type');
  const gap = readParam(params, 'gap');
  const zero = readParam(params, 'zero');
  const query = readParam(params, 'q')?.trim().toLowerCase();

  const result = await fetchBrandStats(periodDays);
  if (!result.ok) {
    return (
      <Card>
        <ErrorState message={result.error} retryHref="/brands" />
      </Card>
    );
  }

  let rows = result.data;
  if (type) rows = rows.filter((r) => r.entity_type === type);
  if (gap === '1') rows = rows.filter((r) => r.coverage_gap);
  if (gap === '0') rows = rows.filter((r) => r.recipients !== '');
  if (zero === 'has') rows = rows.filter((r) => r.events_count > 0);
  if (zero === 'none') rows = rows.filter((r) => r.events_count === 0);
  if (query) rows = rows.filter((r) => r.canonical_name.toLowerCase().includes(query));

  const gaps = rows.filter((r) => r.coverage_gap).length;
  const zeros = rows.filter((r) => r.events_count === 0).length;
  const maxShare = Math.max(1, ...rows.map((r) => r.share_pct));

  return (
    <div className="space-y-4">
      <Card>
        <CardBody className="text-[12.5px] text-[var(--color-ink-2)]">
          Сущности с нулём не скрываются. Ноль может означать и молчание рынка, и то, что источник не дошёл, и
          исчерпанную квоту поиска. Различить это можно только увидев ноль. Сейчас в выборке: без событий — {zeros},
          настроечных дыр — {gaps}.
        </CardBody>
      </Card>

      <Card>
        <CardHead
          title={`Сущностей в выборке: ${formatNumber(rows.length)}`}
          hint="порядок по числу событий за период"
        />
        {rows.length === 0 ? (
          <EmptyState title="Под эти условия ничего не подходит" hint="Сбросьте фильтры." />
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <Th>Бренд или тема</Th>
                <Th>Тип</Th>
                <Th>Группа</Th>
                <Th numeric>Событий</Th>
                <Th>Доля потока</Th>
                <Th>Тональность</Th>
                <Th>Кому уходит</Th>
                <Th>Последнее</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <Tr key={row.entity_id}>
                  <LinkCell href={`/brands/${row.entity_id}`}>
                    {row.canonical_name}
                    {row.relation ? (
                      <span className="block text-[11.5px] font-normal text-[var(--color-ink-3)]">
                        {RELATION_LABEL[row.relation] ?? row.relation}
                      </span>
                    ) : null}
                  </LinkCell>
                  <Td className="whitespace-nowrap text-[var(--color-ink-2)]">
                    {ENTITY_TYPE_LABEL[row.entity_type] ?? row.entity_type}
                  </Td>
                  <Td className="whitespace-nowrap text-[var(--color-ink-2)]">{row.product_group ?? '—'}</Td>
                  <Td numeric className={row.events_count === 0 ? 'text-[var(--color-ink-3)]' : undefined}>
                    {formatNumber(row.events_count)}
                    {row.events_high > 0 ? (
                      <span className="block text-[11.5px] font-normal text-[var(--color-warning)]">
                        важных {row.events_high}
                      </span>
                    ) : null}
                  </Td>
                  <Td className="w-28">
                    <Bar value={(row.share_pct / maxShare) * 100} />
                    <span className="tabular mt-0.5 block text-[11.5px] text-[var(--color-ink-3)]">
                      {formatPercent(row.share_pct, 1)}
                    </span>
                  </Td>
                  <Td className="whitespace-nowrap text-[12.5px] text-[var(--color-ink-2)]">
                    {row.events_count === 0
                      ? '—'
                      : `+${row.positive} / ${row.neutral} / −${row.negative}`}
                  </Td>
                  <Td className="max-w-48">
                    {row.recipients ? (
                      <span className="text-[var(--color-ink-2)]">{row.recipients}</span>
                    ) : row.coverage_gap ? (
                      <GapBadge />
                    ) : (
                      <span className="text-[var(--color-ink-3)]">получатель не назначен</span>
                    )}
                  </Td>
                  <Td className="whitespace-nowrap text-[var(--color-ink-2)]">{formatShort(row.last_event_at)}</Td>
                </Tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Card>
    </div>
  );
}
