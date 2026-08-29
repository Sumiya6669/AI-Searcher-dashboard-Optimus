import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';

import { EventFeed } from '@/components/domain/EventFeed';
import { KpiRow } from '@/components/domain/KpiCard';
import { UrgencyBadge } from '@/components/domain/Badges';
import { Bar } from '@/components/ui/Badge';
import { Card, CardHead, PageHeader } from '@/components/ui/Card';
import { DeniedNotice, ErrorState, KpiSkeleton, LoadingSkeleton } from '@/components/ui/States';
import { Td, TableWrap, Th, Tr, LinkCell } from '@/components/ui/Table';
import { formatHoursLeft, formatMoneyKzt, formatNumber, formatPercent, formatShort } from '@/lib/format';
import { readInt, type SearchParamsInput } from '@/lib/url';
import { requireUser } from '@/server/auth';
import { fetchKpi } from '@/server/queries/dashboard';
import { fetchBrandStats } from '@/server/queries/brands';
import { fetchEvents } from '@/server/queries/events';
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
  // Профиль читается, чтобы страница не открылась без выданного доступа:
  // requireUser уводит на /login и /no-access.
  await requireUser();
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

        {/* items-start: без него левая карточка растягивается до высоты правой
            колонки и под лентой событий повисает пустое полотно. */}
        <div className="grid min-w-0 items-start gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
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
              <BrandVoice periodDays={periodDays === 1 ? 7 : periodDays} />
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
  // Состояние сбора на этот экран не выносится: «89 % успешных запусков» —
  // вопрос дежурного, а не менеджера по продажам, и живёт в администрировании.
  const kpi = result.data;

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

/**
 * Раздел про рынок, а не про систему: по каким брендам сейчас говорят и с
 * каким настроением. На месте прежнего «Всё ли работает» — тот блок переехал
 * в администрирование целиком.
 */
async function BrandVoice({ periodDays }: { periodDays: number }) {
  const result = await fetchBrandStats(periodDays);
  if (!result.ok) {
    return (
      <Card>
        <CardHead title="О чём говорит рынок" />
        <ErrorState message={result.error} retryHref="/dashboard" />
      </Card>
    );
  }
  const rows = [...result.data].sort((a, b) => b.events_count - a.events_count).slice(0, 6);

  return (
    <Card>
      <CardHead
        title="О чём говорит рынок"
        actions={
          <Link href="/brands" className="text-[12.5px] text-[var(--color-accent-ink)] hover:underline">
            все бренды
          </Link>
        }
      />
      {rows.length === 0 ? (
        <p className="px-4 py-6 text-center text-[13px] text-[var(--color-ink-2)]">
          За период по брендам ничего не собрано.
        </p>
      ) : (
        <TableWrap>
          <thead>
            <tr>
              <Th>Бренд или направление</Th>
              <Th numeric>Событий</Th>
              <Th width="38%">Доля потока</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <Tr key={row.entity_id}>
                <LinkCell href={`/brands/${row.entity_id}`}>
                  {row.canonical_name}
                  <span className="block text-[11.5px] font-normal text-[var(--color-ink-3)]">
                    {row.events_high > 0 ? `важных ${formatNumber(row.events_high)}` : 'важных нет'}
                    {row.negative > 0 ? ` · отрицательных ${formatNumber(row.negative)}` : ''}
                  </span>
                </LinkCell>
                <Td numeric>{formatNumber(row.events_count)}</Td>
                <Td>
                  <span className="flex items-center gap-2">
                    <Bar value={row.share_pct} tone="accent" />
                    <span className="tabular w-9 shrink-0 text-right text-[12px] text-[var(--color-ink-3)]">
                      {formatPercent(row.share_pct)}
                    </span>
                  </span>
                </Td>
              </Tr>
            ))}
          </tbody>
        </TableWrap>
      )}
    </Card>
  );
}
