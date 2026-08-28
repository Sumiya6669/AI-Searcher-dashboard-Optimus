import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { GapBadge } from '@/components/domain/Badges';
import { EventFeed } from '@/components/domain/EventFeed';
import { KpiRow } from '@/components/domain/KpiCard';
import { Badge } from '@/components/ui/Badge';
import { ButtonLink } from '@/components/ui/Button';
import { Card, CardBody, CardHead, DefinitionList, PageHeader } from '@/components/ui/Card';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { TableWrap, Td, Th, Tr } from '@/components/ui/Table';
import { ENTITY_TYPE_LABEL, RELATION_LABEL } from '@/lib/domain';
import { formatNumber, formatPercent, formatShort } from '@/lib/format';
import { readInt, type SearchParamsInput } from '@/lib/url';
import { fetchBrand, fetchBrandAliases, fetchSubscriptions } from '@/server/queries/brands';
import { fetchEvents } from '@/server/queries/events';

export const metadata: Metadata = { title: 'Бренд' };
export const dynamic = 'force-dynamic';

export default async function BrandPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParamsInput>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const entityId = Number.parseInt(id, 10);
  if (!Number.isFinite(entityId)) notFound();

  const periodDays = readInt(query, 'period', 30);
  const result = await fetchBrand(entityId, periodDays);
  if (!result.ok) {
    return (
      <Card>
        <ErrorState message={result.error} retryHref={`/brands/${id}`} />
      </Card>
    );
  }
  const brand = result.data;
  if (!brand) notFound();

  const [aliases, subs, events] = await Promise.all([
    fetchBrandAliases(entityId),
    fetchSubscriptions(entityId),
    fetchEvents({ periodDays, severities: [], entityId, page: 1, pageSize: 10 }),
  ]);

  const bySource = new Map<string, number>();
  const byCategory = new Map<string, number>();
  if (events.ok) {
    for (const event of events.data.rows) {
      const source = event.source_name ?? 'источник не указан';
      bySource.set(source, (bySource.get(source) ?? 0) + 1);
      byCategory.set(event.category, (byCategory.get(event.category) ?? 0) + 1);
    }
  }

  return (
    <>
      <Link
        href="/brands"
        className="mb-3 inline-flex items-center gap-1 text-[12.5px] text-[var(--color-ink-2)] hover:text-[var(--color-ink)]"
      >
        <ArrowLeft size={13} />
        К списку брендов и направлений
      </Link>

      <PageHeader
        title={brand.canonical_name}
        subtitle={`${ENTITY_TYPE_LABEL[brand.entity_type] ?? brand.entity_type}${
          brand.product_group ? ` · ${brand.product_group}` : ''
        }`}
        actions={
          <>
            {brand.coverage_gap ? <GapBadge /> : null}
            <ButtonLink href={`/events?entity=${entityId}&period=90`} size="sm">
              Все события за 90 дней
            </ButtonLink>
          </>
        }
      />

      {brand.coverage_gap ? (
        <p className="mb-4 rounded-md border border-[var(--color-warning)]/30 bg-[var(--color-warning-soft)] px-3 py-2 text-[13px] text-[var(--color-warning)]">
          {brand.canonical_name} — {brand.events_count} {brand.events_count === 1 ? 'событие' : 'событий'} за период,
          получатель не назначен. Эти новости система находит, но никому не отправляет. Настраивается формой
          «Получатели и подписки».
        </p>
      ) : null}

      <div className="space-y-4">
        <KpiRow
          items={[
            { label: 'Событий за период', value: formatNumber(brand.events_count) },
            {
              label: 'Из них важных',
              value: formatNumber(brand.events_high),
              tone: brand.events_high > 0 ? 'warning' : 'neutral',
            },
            { label: 'Доля потока', value: formatPercent(brand.share_pct, 1) },
            {
              label: 'Подписчиков',
              value: formatNumber(brand.subscribers),
              tone: brand.subscribers === 0 && brand.events_count > 0 ? 'warning' : 'neutral',
            },
          ]}
        />

        <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <Card>
            <CardHead title="События" hint={`за ${periodDays} дней`} />
            {!events.ok ? (
              <ErrorState message={events.error} retryHref={`/brands/${id}`} />
            ) : (
              <EventFeed events={events.data.rows} />
            )}
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHead title="Карточка словаря" />
              <CardBody>
                <DefinitionList
                  items={[
                    { term: 'Тип', value: ENTITY_TYPE_LABEL[brand.entity_type] ?? brand.entity_type },
                    {
                      term: 'Отношение к нам',
                      value: brand.relation ? RELATION_LABEL[brand.relation] ?? brand.relation : '—',
                    },
                    { term: 'Товарная группа', value: brand.product_group ?? '—' },
                    { term: 'География поиска', value: brand.geo_scope ?? '—' },
                    { term: 'Приоритет поиска', value: `${brand.search_priority} из 3` },
                    { term: 'Вариантов написания', value: formatNumber(brand.aliases_count) },
                    { term: 'Активна', value: brand.is_active ? 'да' : 'нет' },
                  ]}
                />
                {aliases.ok && aliases.data.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {aliases.data.map((alias) => (
                      <Badge key={alias} tone="neutral">
                        {alias}
                      </Badge>
                    ))}
                  </div>
                ) : null}
              </CardBody>
            </Card>

            <Card>
              <CardHead title="Кому уходит" />
              {!subs.ok ? (
                <ErrorState message={subs.error} retryHref={`/brands/${id}`} />
              ) : subs.data.length === 0 ? (
                <EmptyState
                  title="Подписок на эту сущность нет"
                  hint="Получатели без подписок получают весь поток, поэтому отсутствие строки здесь не значит, что новости не доходят вообще."
                />
              ) : (
                <TableWrap>
                  <thead>
                    <tr>
                      <Th>Получатель</Th>
                      <Th>Режим</Th>
                      <Th numeric>Порог</Th>
                      <Th>Каналы</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {subs.data.map((sub) => (
                      <Tr key={sub.id}>
                        <Td>{sub.recipient_name}</Td>
                        <Td>
                          {sub.mode === 'exclude' ? (
                            <Badge tone="critical">не присылать</Badge>
                          ) : (
                            <Badge tone="success">присылать</Badge>
                          )}
                        </Td>
                        <Td numeric>{sub.effective_min_importance}/5</Td>
                        <Td className="text-[12.5px] text-[var(--color-ink-2)]">{sub.channels.join(', ')}</Td>
                      </Tr>
                    ))}
                  </tbody>
                </TableWrap>
              )}
            </Card>

            <Card>
              <CardHead title="Откуда приходит" hint="в пределах показанных событий" />
              <CardBody>
                {bySource.size === 0 ? (
                  <p className="text-[13px] text-[var(--color-ink-3)]">Событий за период нет.</p>
                ) : (
                  <ul className="space-y-1 text-[13px]">
                    {[...bySource.entries()]
                      .sort((a, b) => b[1] - a[1])
                      .map(([source, count]) => (
                        <li key={source} className="flex justify-between gap-3">
                          <span className="text-[var(--color-ink-2)]">{source}</span>
                          <span className="tabular">{count}</span>
                        </li>
                      ))}
                  </ul>
                )}
                {byCategory.size > 0 ? (
                  <>
                    <p className="mb-1 mt-3 text-[11px] font-bold uppercase tracking-[0.09em] text-[var(--color-ink-3)]">
                      Категории
                    </p>
                    <ul className="space-y-1 text-[13px]">
                      {[...byCategory.entries()]
                        .sort((a, b) => b[1] - a[1])
                        .map(([category, count]) => (
                          <li key={category} className="flex justify-between gap-3">
                            <span className="text-[var(--color-ink-2)]">{category}</span>
                            <span className="tabular">{count}</span>
                          </li>
                        ))}
                    </ul>
                  </>
                ) : null}
              </CardBody>
            </Card>

            <Card>
              <CardBody className="text-[12.5px] text-[var(--color-ink-2)]">
                Последнее событие: {formatShort(brand.last_event_at)}.
                {brand.events_count === 0
                  ? ' Ноль событий сам по себе ничего не говорит о рынке: проверьте состояние источников.'
                  : ''}
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
