import type { Metadata } from 'next';
import { Suspense } from 'react';

import { UrgencyBadge } from '@/components/domain/Badges';
import { FilterBar, type FilterField } from '@/components/domain/FilterBar';
import { KpiRow } from '@/components/domain/KpiCard';
import { Card, CardBody, CardHead, PageHeader } from '@/components/ui/Card';
import { EmptyState, ErrorState, KpiSkeleton, LoadingSkeleton } from '@/components/ui/States';
import { LinkCell, Pagination, TableWrap, Td, Th, Tr } from '@/components/ui/Table';
import { formatDateTime, formatHoursLeft, formatMoneyKzt, formatNumber } from '@/lib/format';
import { readInt, readParam, type SearchParamsInput } from '@/lib/url';
import { fetchStopWordStats, fetchTenderKpi, fetchTenders } from '@/server/queries/tenders';
import type { TenderUrgency } from '@/lib/types';

export const metadata: Metadata = { title: 'Государственные закупки' };
export const dynamic = 'force-dynamic';

const PAGE_SIZE = 25;

export default async function TendersPage({ searchParams }: { searchParams: Promise<SearchParamsInput> }) {
  const params = await searchParams;

  const fields: FilterField[] = [
    {
      key: 'urgency',
      label: 'Срочность',
      kind: 'select',
      options: [
        { value: 'critical', label: 'меньше суток' },
        { value: 'warning', label: 'меньше трёх суток' },
        { value: 'normal', label: 'срок не поджимает' },
        { value: 'unknown', label: 'срок неизвестен' },
      ],
    },
    {
      key: 'closed',
      label: 'Приём заявок',
      kind: 'select',
      options: [
        { value: 'open', label: 'только открытые' },
        { value: 'all', label: 'включая закрытые' },
      ],
    },
    {
      key: 'min',
      label: 'Сумма от',
      kind: 'select',
      options: [
        { value: '200000', label: '200 000 ₸' },
        { value: '1000000', label: '1 000 000 ₸' },
        { value: '6000000', label: '6 000 000 ₸' },
      ],
    },
    { key: 'q', label: 'Поиск', kind: 'search', placeholder: 'лот, заказчик, номер' },
  ];

  return (
    <>
      <PageHeader title="Государственные закупки" subtitle="Открытые лоты, требующие внимания" />

      <div className="space-y-4">
        <Suspense fallback={<KpiSkeleton count={5} />}>
          <TenderKpiBlock />
        </Suspense>

        <div>
          <FilterBar fields={fields} />
          <Suspense
            fallback={
              <Card>
                <LoadingSkeleton rows={8} />
              </Card>
            }
          >
            <TenderTable params={params} />
          </Suspense>
        </div>

        <Suspense fallback={null}>
          <StopWords />
        </Suspense>
      </div>
    </>
  );
}

async function TenderKpiBlock() {
  const result = await fetchTenderKpi();
  if (!result.ok) {
    return (
      <Card>
        <ErrorState message={result.error} retryHref="/tenders" />
      </Card>
    );
  }
  const kpi = result.data;
  return (
    <KpiRow
      items={[
        { label: 'Открытых лотов', value: formatNumber(kpi.open) },
        { label: 'Просмотрено всего', value: formatNumber(kpi.found_total), hint: 'за всё время наблюдения' },
        { label: 'Потенциальная сумма', value: formatMoneyKzt(kpi.potential_amount), hint: 'по открытым лотам' },
        {
          label: 'Закрывается за сутки',
          value: formatNumber(kpi.closing_24h),
          tone: kpi.closing_24h > 0 ? 'critical' : 'neutral',
        },
        {
          label: 'Закрывается за 3 суток',
          value: formatNumber(kpi.closing_72h),
          tone: kpi.closing_72h > 0 ? 'warning' : 'neutral',
        },
      ]}
    />
  );
}

async function TenderTable({ params }: { params: SearchParamsInput }) {
  const page = Math.max(1, readInt(params, 'page', 1));
  const urgencyRaw = readParam(params, 'urgency');
  const urgency = (['critical', 'warning', 'normal', 'unknown', 'closed'] as TenderUrgency[]).includes(
    urgencyRaw as TenderUrgency,
  )
    ? (urgencyRaw as TenderUrgency)
    : undefined;

  const result = await fetchTenders({
    urgency,
    onlyOpen: readParam(params, 'closed') !== 'all',
    minAmount: readInt(params, 'min', 0) || undefined,
    query: readParam(params, 'q'),
    sort: readParam(params, 'sort'),
    page,
    pageSize: PAGE_SIZE,
  });

  if (!result.ok) {
    return (
      <Card>
        <ErrorState message={result.error} retryHref="/tenders" />
      </Card>
    );
  }

  return (
    <Card>
      <CardHead
        title={`Лотов в выборке: ${formatNumber(result.data.total)}`}
        hint="порядок по сроку закрытия приёма заявок — самые срочные сверху"
      />
      {result.data.rows.length === 0 ? (
        <EmptyState
          title="Подходящих закупок нет"
          hint="Проверка идёт каждые 15 минут. Лоты ниже порога значимости в базу пишутся, но в этот список не попадают."
        />
      ) : (
        <TableWrap>
          <thead>
            <tr>
              <Th sortKey="deadline" currentSort={readParam(params, 'sort') ?? 'deadline'} params={params}>
                Осталось
              </Th>
              <Th>Лот</Th>
              <Th numeric sortKey="amount" currentSort={readParam(params, 'sort')} params={params}>
                Сумма
              </Th>
              <Th>Заказчик</Th>
              <Th>Совпало по</Th>
              <Th>Дата закрытия</Th>
              <Th>Статус</Th>
            </tr>
          </thead>
          <tbody>
            {result.data.rows.map((tender) => (
              <Tr key={tender.tender_id}>
                <Td className="whitespace-nowrap">
                  <UrgencyBadge urgency={tender.urgency} text={formatHoursLeft(tender.hours_left)} />
                </Td>
                <LinkCell href={`/tenders/${tender.tender_id}`}>
                  <span className="line-clamp-2">{tender.title}</span>
                  <span className="block text-[11.5px] font-normal text-[var(--color-ink-3)]">{tender.lot_no}</span>
                </LinkCell>
                <Td numeric>{formatMoneyKzt(tender.amount)}</Td>
                <Td className="max-w-52 text-[var(--color-ink-2)]">{tender.customer_name ?? '—'}</Td>
                <Td className="max-w-52 text-[12.5px] text-[var(--color-ink-2)]">{tender.matched_on ?? '—'}</Td>
                <Td className="whitespace-nowrap text-[var(--color-ink-2)]">{formatDateTime(tender.apply_to)}</Td>
                <Td className="whitespace-nowrap text-[12.5px] text-[var(--color-ink-2)]">
                  {tender.portal_status ?? '—'}
                  {tender.is_notified ? (
                    <span className="block text-[11.5px] text-[var(--color-ink-3)]">оповещение отправлено</span>
                  ) : null}
                </Td>
              </Tr>
            ))}
          </tbody>
        </TableWrap>
      )}
      {result.data.total > PAGE_SIZE ? (
        <Pagination params={params} page={page} pageSize={PAGE_SIZE} total={result.data.total} />
      ) : null}
    </Card>
  );
}

async function StopWords() {
  const result = await fetchStopWordStats(24);
  if (!result.ok) return null;
  const rows = result.data;

  return (
    <Card>
      <details>
        <summary className="cursor-pointer list-none px-4 py-3 text-[14px] font-semibold hover:bg-[var(--color-line-2)]/50">
          Отсеяно стоп-словами за сутки: {formatNumber(rows.reduce((sum, r) => sum + r.filtered_count, 0))}
          <span className="ml-2 text-[12.5px] font-normal text-[var(--color-ink-3)]">
            раскрыть, чтобы проверить, не отсекает ли стоп-слово нужное
          </span>
        </summary>
        {rows.length === 0 ? (
          <CardBody className="text-[13px] text-[var(--color-ink-2)]">За сутки стоп-слова ничего не отсеяли.</CardBody>
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <Th>Стоп-слово</Th>
                <Th numeric>Отсеяно</Th>
                <Th>Примеры</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <Tr key={row.stop_word}>
                  <Td className="whitespace-nowrap font-medium">{row.stop_word}</Td>
                  <Td numeric>{formatNumber(row.filtered_count)}</Td>
                  <Td className="text-[12.5px] text-[var(--color-ink-2)]">{row.examples ?? '—'}</Td>
                </Tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </details>
    </Card>
  );
}
