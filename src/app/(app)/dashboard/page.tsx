import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';

import { EventFeed } from '@/components/domain/EventFeed';
import { KpiRow } from '@/components/domain/KpiCard';
import { FreshnessBadge, UrgencyBadge } from '@/components/domain/Badges';
import { Card, CardHead, PageHeader } from '@/components/ui/Card';
import { DeniedNotice, ErrorState, KpiSkeleton, LoadingSkeleton, StaleNotice } from '@/components/ui/States';
import { Td, TableWrap, Th, Tr, LinkCell } from '@/components/ui/Table';
import { DEFAULT_PERIOD_DAYS } from '@/lib/domain';
import { formatHoursLeft, formatMoneyKzt, formatNumber, formatPercent, formatRelative, formatShort } from '@/lib/format';
import { readInt, type SearchParamsInput } from '@/lib/url';
import { requireUser } from '@/server/auth';
import { fetchKpi } from '@/server/queries/dashboard';
import { fetchEvents } from '@/server/queries/events';
import { fetchSourceStats } from '@/server/queries/sources';
import { fetchTenders } from '@/server/queries/tenders';
import { fetchCompetitorActivity } from '@/server/queries/competitors';

export const metadata: Metadata = { title: 'Дашборд' };
export const dynamic = 'force-dynamic';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParamsInput>;
}) {
  const params = await searchParams;
  const user = await requireUser();
  const periodDays = readInt(params, 'period', 1);
  const denied = params.denied === 'admin';

  return (
    <>
      <PageHeader
        title="Дашборд"
        subtitle="Нужно ли что-то делать прямо сейчас"
        actions={<PeriodLinks params={params} current={periodDays} />}
      />

      {denied ? (
        <DeniedNotice>
          Служебный раздел доступен только администратору. Права выдаёт администратор системы.
        </DeniedNotice>
      ) : null}

      <div className="space-y-4">
        <Suspense fallback={<KpiSkeleton />}>
          <KpiBlock periodDays={periodDays} />
        </Suspense>

        <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
          <Card>
            <CardHead
              title="Лента событий"
              hint="важность по убыванию, затем свежесть"
              actions={
                <Link href="/events" className="text-[12.5px] text-[var(--color-accent-ink)] hover:underline">
                  все события
                </Link>
              }
            />
            <Suspense fallback={<LoadingSkeleton rows={6} />}>
              <FeedBlock periodDays={periodDays} />
            </Suspense>
          </Card>

          <div className="space-y-4">
            <Suspense fallback={<LoadingSkeleton rows={4} />}>
              <UrgentTenders />
            </Suspense>
            <Suspense fallback={<LoadingSkeleton rows={4} />}>
              <CompetitorMovers periodDays={periodDays === 1 ? 7 : periodDays} />
            </Suspense>
            <Suspense fallback={<LoadingSkeleton rows={4} />}>
              <SourceHealth isAdmin={user.role === 'admin'} />
            </Suspense>
          </div>
        </div>
      </div>
    </>
  );
}

function PeriodLinks({ params, current }: { params: SearchParamsInput; current: number }) {
  const options = [
    { days: 1, label: 'сутки' },
    { days: 7, label: '7 дней' },
    { days: 30, label: '30 дней' },
  ];
  const base = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (typeof v === 'string' && k !== 'period') base.set(k, v);
  }
  return (
    <div role="group" aria-label="Период" className="flex items-center gap-0.5 rounded-md border border-[var(--color-line)] p-0.5">
      {options.map((option) => {
        const next = new URLSearchParams(base);
        next.set('period', String(option.days));
        const active = current === option.days;
        return (
          <Link
            key={option.days}
            href={`/dashboard?${next.toString()}`}
            aria-current={active ? 'true' : undefined}
            className={`rounded px-2 py-1 text-[12.5px] ${
              active ? 'bg-[var(--color-soft)] font-semibold text-[var(--color-accent-ink)]' : 'text-[var(--color-ink-2)] hover:bg-[var(--color-line-2)]'
            }`}
          >
            {option.label}
          </Link>
        );
      })}
    </div>
  );
}

async function KpiBlock({ periodDays }: { periodDays: number }) {
  const result = await fetchKpi(periodDays);
  if (!result.ok) {
    return (
      <Card>
        <ErrorState message={result.error} retryHref="/dashboard" />
      </Card>
    );
  }
  const kpi = result.data;
  const successTone =
    kpi.collect_success_pct === null
      ? 'neutral'
      : kpi.collect_success_pct >= 90
        ? 'success'
        : kpi.collect_success_pct >= 75
          ? 'warning'
          : 'critical';

  return (
    <KpiRow
      items={[
        {
          label: periodDays === 1 ? 'Событий за сутки' : `Событий за ${periodDays} дней`,
          value: formatNumber(kpi.events_period),
          hint: `из ${formatNumber(kpi.materials_period)} собранных материалов`,
          href: `/events?period=${periodDays}`,
        },
        {
          label: 'Важных за 7 дней',
          value: formatNumber(kpi.events_high_7d),
          hint: 'уровень 4 и 5',
          tone: kpi.events_high_7d > 0 ? 'warning' : 'neutral',
          href: '/events?period=7&severity=4,5',
        },
        {
          label: 'Открытых тендеров',
          value: formatNumber(kpi.tenders_open),
          hint: 'приём заявок не закрыт',
          href: '/tenders',
        },
        {
          label: 'Изменений у конкурентов',
          value: formatNumber(kpi.competitor_changes),
          hint: 'за всё время наблюдения',
          href: '/competitors',
        },
        {
          label: 'Состояние сбора',
          value: formatPercent(kpi.collect_success_pct),
          hint: `${formatNumber(kpi.runs_ok_24h)} из ${formatNumber(kpi.runs_total_24h)} запусков за сутки`,
          tone: successTone,
          href: '/sources',
        },
      ]}
    />
  );
}

async function FeedBlock({ periodDays }: { periodDays: number }) {
  const result = await fetchEvents({
    periodDays: Math.max(periodDays, 3),
    severities: [],
    page: 1,
    pageSize: 8,
  });
  if (!result.ok) return <ErrorState message={result.error} retryHref="/dashboard" />;
  return <EventFeed events={result.data.rows} />;
}

async function UrgentTenders() {
  const result = await fetchTenders({ page: 1, pageSize: 5, onlyOpen: true });
  if (!result.ok) {
    return (
      <Card>
        <CardHead title="Закупки: что закрывается первым" />
        <ErrorState message={result.error} retryHref="/dashboard" />
      </Card>
    );
  }
  const rows = result.data.rows;
  return (
    <Card>
      <CardHead
        title="Закупки: что закрывается первым"
        hint="порядок по сроку приёма заявок"
        actions={
          <Link href="/tenders" className="text-[12.5px] text-[var(--color-accent-ink)] hover:underline">
            все лоты
          </Link>
        }
      />
      {rows.length === 0 ? (
        <p className="px-4 py-6 text-center text-[13px] text-[var(--color-ink-2)]">
          Подходящих закупок с открытым приёмом заявок сейчас нет.
        </p>
      ) : (
        <TableWrap>
          <thead>
            <tr>
              <Th>Осталось</Th>
              <Th>Лот</Th>
              <Th numeric>Сумма</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((tender) => (
              <Tr key={tender.tender_id}>
                <Td>
                  <UrgencyBadge urgency={tender.urgency} text={formatHoursLeft(tender.hours_left)} />
                </Td>
                <LinkCell href={`/tenders/${tender.tender_id}`}>
                  <span className="line-clamp-2">{tender.title}</span>
                  <span className="block text-[12px] font-normal text-[var(--color-ink-3)]">{tender.customer_name}</span>
                </LinkCell>
                <Td numeric>{formatMoneyKzt(tender.amount)}</Td>
              </Tr>
            ))}
          </tbody>
        </TableWrap>
      )}
    </Card>
  );
}

async function CompetitorMovers({ periodDays }: { periodDays: number }) {
  const result = await fetchCompetitorActivity(periodDays);
  if (!result.ok) {
    return (
      <Card>
        <CardHead title="Кто из конкурентов активизировался" />
        <ErrorState message={result.error} retryHref="/dashboard" />
      </Card>
    );
  }
  const rows = result.data.filter((c) => c.changes_count > 0 || c.events_count > 0).slice(0, 5);
  return (
    <Card>
      <CardHead
        title="Кто из конкурентов активизировался"
        hint={`за ${periodDays} дней`}
        actions={
          <Link href="/competitors" className="text-[12.5px] text-[var(--color-accent-ink)] hover:underline">
            все конкуренты
          </Link>
        }
      />
      {rows.length === 0 ? (
        <p className="px-4 py-6 text-center text-[13px] text-[var(--color-ink-2)]">Изменений за период не зафиксировано.</p>
      ) : (
        <TableWrap>
          <thead>
            <tr>
              <Th>Конкурент</Th>
              <Th numeric>Изменений</Th>
              <Th numeric>Событий</Th>
              <Th>Последнее</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <Tr key={row.competitor_id}>
                <LinkCell href={`/competitors/${row.competitor_id}`}>{row.name}</LinkCell>
                <Td numeric>{formatNumber(row.changes_count)}</Td>
                <Td numeric>{formatNumber(row.events_count)}</Td>
                <Td className="whitespace-nowrap text-[var(--color-ink-2)]">{formatShort(row.last_change_at)}</Td>
              </Tr>
            ))}
          </tbody>
        </TableWrap>
      )}
    </Card>
  );
}

async function SourceHealth({ isAdmin }: { isAdmin: boolean }) {
  const result = await fetchSourceStats(DEFAULT_PERIOD_DAYS);
  if (!result.ok) {
    return (
      <Card>
        <CardHead title="Всё ли работает" />
        <ErrorState message={result.error} retryHref="/dashboard" />
      </Card>
    );
  }
  const rows = result.data;
  const problems = rows.filter((s) => s.freshness === 'error' || s.freshness === 'stale');

  return (
    <Card>
      <CardHead
        title="Всё ли работает"
        hint="источники и их свежесть"
        actions={
          <Link href={isAdmin ? '/admin' : '/sources'} className="text-[12.5px] text-[var(--color-accent-ink)] hover:underline">
            {isAdmin ? 'состояние системы' : 'все источники'}
          </Link>
        }
      />
      {problems.length > 0 ? (
        <StaleNotice>
          {problems.length === 1
            ? `Источник «${problems[0]?.name}» требует внимания.`
            : `Источников с отклонениями: ${problems.length}.`}
        </StaleNotice>
      ) : null}
      <TableWrap>
        <thead>
          <tr>
            <Th>Источник</Th>
            <Th numeric>Материалов</Th>
            <Th>Состояние</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((source) => (
            <Tr key={source.code}>
              <LinkCell href={`/sources/${source.code}`}>
                {source.name}
                <span className="block text-[11.5px] font-normal text-[var(--color-ink-3)]">
                  {source.last_activity_at ? `активность ${formatRelative(source.last_activity_at)}` : 'активности не было'}
                </span>
              </LinkCell>
              <Td numeric>{formatNumber(source.materials_total)}</Td>
              <Td>
                <FreshnessBadge freshness={source.freshness} />
              </Td>
            </Tr>
          ))}
        </tbody>
      </TableWrap>
    </Card>
  );
}
