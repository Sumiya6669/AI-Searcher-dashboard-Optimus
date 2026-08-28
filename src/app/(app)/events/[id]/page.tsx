import { ArrowLeft, ExternalLink } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { SentimentBadge, SeverityBadge } from '@/components/domain/Badges';
import { EventFeed } from '@/components/domain/EventFeed';
import { ButtonLink } from '@/components/ui/Button';
import { Card, CardBody, CardHead, DefinitionList, PageHeader } from '@/components/ui/Card';
import { ErrorState } from '@/components/ui/States';
import { AGENT_LABEL } from '@/lib/domain';
import { formatDateTime, hostOf } from '@/lib/format';
import { fetchEventById, fetchRelatedEvents } from '@/server/queries/events';

export const metadata: Metadata = { title: 'Событие' };
export const dynamic = 'force-dynamic';

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const eventId = Number.parseInt(id, 10);
  if (!Number.isFinite(eventId)) notFound();

  const result = await fetchEventById(eventId);
  if (!result.ok) {
    return (
      <Card>
        <ErrorState message={result.error} retryHref={`/events/${id}`} />
      </Card>
    );
  }
  const event = result.data;
  if (!event) notFound();

  const related = await fetchRelatedEvents(event.entity_ids, event.event_id, 5);

  return (
    <>
      <Link
        href="/events"
        className="mb-3 inline-flex items-center gap-1 text-[12.5px] text-[var(--color-ink-2)] hover:text-[var(--color-ink)]"
      >
        <ArrowLeft size={13} />
        К списку событий
      </Link>

      <PageHeader
        title={event.title}
        subtitle={`${event.category} · ${formatDateTime(event.event_date)}`}
        actions={
          <>
            <SeverityBadge level={event.importance} />
            <SentimentBadge sentiment={event.sentiment} />
            {event.link ? (
              <ButtonLink href={event.link} external variant="primary" size="sm">
                Открыть источник
                <ExternalLink size={13} />
              </ButtonLink>
            ) : null}
          </>
        }
      />

      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <Card>
            <CardHead title="Суть" />
            <CardBody className="space-y-3">
              {event.summary ? (
                <p className="text-[14.5px] leading-relaxed text-[var(--color-ink)]">{event.summary}</p>
              ) : (
                <p className="text-[13.5px] text-[var(--color-ink-3)]">Текст сути не сохранён.</p>
              )}
              {event.rationale ? (
                <p className="rounded-md border border-[var(--color-line-2)] bg-[var(--color-bg)] px-3 py-2 text-[13px] text-[var(--color-ink-2)]">
                  <span className="font-semibold text-[var(--color-ink)]">Основание оценки важности. </span>
                  {event.rationale}
                </p>
              ) : null}
            </CardBody>
          </Card>

          <Card>
            <CardHead title="Связанные события" hint="по тем же брендам и конкурентам" />
            {related.ok ? (
              <EventFeed events={related.data} />
            ) : (
              <ErrorState message={related.error} retryHref={`/events/${id}`} />
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHead title="Привязка" />
            <CardBody>
              <DefinitionList
                items={[
                  {
                    term: 'Товар или позиция',
                    value: event.product_focus ?? <span className="text-[var(--color-ink-3)]">не определена</span>,
                  },
                  {
                    term: 'Товарная группа',
                    value: event.product_groups ?? <span className="text-[var(--color-ink-3)]">—</span>,
                  },
                  {
                    term: 'Компании',
                    value: event.company_focus ?? <span className="text-[var(--color-ink-3)]">—</span>,
                  },
                  {
                    term: 'Связано со словарём',
                    value: event.entity_names ? (
                      <span className="flex flex-wrap gap-1.5">
                        {event.entity_names.split(', ').map((name, index) => {
                          const entityId = event.entity_ids[index];
                          return entityId ? (
                            <Link
                              key={`${name}-${entityId}`}
                              href={`/brands/${entityId}`}
                              className="rounded border border-[var(--color-line)] px-1.5 py-0.5 text-[12.5px] hover:bg-[var(--color-line-2)]"
                            >
                              {name}
                            </Link>
                          ) : (
                            <span key={name} className="text-[12.5px]">
                              {name}
                            </span>
                          );
                        })}
                      </span>
                    ) : (
                      <span className="text-[var(--color-ink-3)]">—</span>
                    ),
                  },
                ]}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHead title="Происхождение" />
            <CardBody>
              <DefinitionList
                items={[
                  { term: 'Источник', value: event.source_name ?? '—' },
                  { term: 'Тип события', value: AGENT_LABEL[event.agent] ?? event.agent },
                  { term: 'Дата события', value: formatDateTime(event.event_date) },
                  { term: 'Поступило в систему', value: formatDateTime(event.created_at) },
                  {
                    term: 'Ссылка',
                    value: event.link ? (
                      <a
                        href={event.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="break-all text-[var(--color-accent-ink)] hover:underline"
                      >
                        {hostOf(event.link)}
                      </a>
                    ) : (
                      <span className="text-[var(--color-ink-3)]">адреса нет</span>
                    ),
                  },
                  { term: 'Было уведомление', value: event.is_notified ? 'да' : 'нет' },
                  { term: 'Вошло в сводку', value: event.in_digest ? 'да' : 'нет' },
                  { term: 'Номер события', value: `№ ${event.event_id}` },
                ]}
              />
            </CardBody>
          </Card>

          {event.entity_ids.length > 0 ? (
            <Card>
              <CardHead title="Переходы" />
              <CardBody className="flex flex-wrap gap-2">
                <ButtonLink href={`/events?entity=${event.entity_ids[0]}&period=90`} size="sm">
                  Все события по этой сущности
                </ButtonLink>
                {event.company_focus ? (
                  <ButtonLink href={`/competitors?q=${encodeURIComponent(event.company_focus)}`} size="sm">
                    Открыть конкурента
                  </ButtonLink>
                ) : null}
              </CardBody>
            </Card>
          ) : null}
        </div>
      </div>
    </>
  );
}
