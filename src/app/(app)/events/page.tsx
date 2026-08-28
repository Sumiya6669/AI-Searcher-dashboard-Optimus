import type { Metadata } from 'next';
import { Suspense } from 'react';

import { EventFeed } from '@/components/domain/EventFeed';
import { FilterBar, type FilterField } from '@/components/domain/FilterBar';
import { Card, CardHead, PageHeader } from '@/components/ui/Card';
import { ErrorState, LoadingSkeleton } from '@/components/ui/States';
import { Pagination } from '@/components/ui/Table';
import { AGENT_LABEL, PERIOD_OPTIONS, SEVERITY_OPTIONS, severityFromParam } from '@/lib/domain';
import { formatNumber } from '@/lib/format';
import { readInt, readParam, type SearchParamsInput } from '@/lib/url';
import { fetchEventFilterOptions, fetchEvents } from '@/server/queries/events';

export const metadata: Metadata = { title: 'События' };
export const dynamic = 'force-dynamic';

const PAGE_SIZE = 25;

export default async function EventsPage({ searchParams }: { searchParams: Promise<SearchParamsInput> }) {
  const params = await searchParams;
  const options = await fetchEventFilterOptions();

  const fields: FilterField[] = [
    { key: 'period', label: 'Период', kind: 'select', options: PERIOD_OPTIONS },
    { key: 'severity', label: 'Важность', kind: 'select', options: SEVERITY_OPTIONS },
    {
      key: 'category',
      label: 'Категория',
      kind: 'select',
      options: (options.ok ? options.data.categories : []).map((c) => ({ value: c, label: c })),
    },
    {
      key: 'agent',
      label: 'Тип события',
      kind: 'select',
      options: Object.entries(AGENT_LABEL).map(([value, label]) => ({ value, label })),
    },
    {
      key: 'source',
      label: 'Источник',
      kind: 'select',
      options: (options.ok ? options.data.sources : []).map((s) => ({ value: s.code, label: s.name })),
    },
    {
      key: 'status',
      label: 'Состояние',
      kind: 'select',
      options: [
        { value: 'notified', label: 'было уведомление' },
        { value: 'in_digest', label: 'вошло в сводку' },
        { value: 'new', label: 'ни то, ни другое' },
      ],
    },
    { key: 'q', label: 'Поиск в тексте', kind: 'search', placeholder: 'бренд, конкурент, слово из заголовка' },
  ];

  return (
    <>
      <PageHeader title="События" subtitle="Что произошло, насколько это важно и кого касается" />
      <FilterBar fields={fields} />
      <Suspense fallback={<Card><LoadingSkeleton rows={8} /></Card>}>
        <EventsBlock params={params} />
      </Suspense>
    </>
  );
}

async function EventsBlock({ params }: { params: SearchParamsInput }) {
  const page = Math.max(1, readInt(params, 'page', 1));
  const entityId = readInt(params, 'entity', 0);
  const statusRaw = readParam(params, 'status');
  const status = statusRaw === 'notified' || statusRaw === 'in_digest' || statusRaw === 'new' ? statusRaw : undefined;

  const result = await fetchEvents({
    periodDays: readInt(params, 'period', 30),
    severities: severityFromParam(readParam(params, 'severity')),
    category: readParam(params, 'category'),
    agent: readParam(params, 'agent'),
    sourceCode: readParam(params, 'source'),
    entityId: entityId > 0 ? entityId : undefined,
    status,
    query: readParam(params, 'q'),
    sort: readParam(params, 'sort'),
    page,
    pageSize: PAGE_SIZE,
  });

  if (!result.ok) {
    return (
      <Card>
        <ErrorState message={result.error} retryHref="/events" />
      </Card>
    );
  }

  return (
    <Card>
      <CardHead
        title={`Найдено событий: ${formatNumber(result.data.total)}`}
        hint="порядок: важность по убыванию, затем свежесть"
      />
      <EventFeed events={result.data.rows} />
      {result.data.total > PAGE_SIZE ? (
        <Pagination params={params} page={page} pageSize={PAGE_SIZE} total={result.data.total} />
      ) : null}
    </Card>
  );
}
