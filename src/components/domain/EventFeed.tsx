import { ExternalLink, Package } from 'lucide-react';
import Link from 'next/link';

import { SentimentBadge, SeverityBadge } from './Badges';
import { EmptyState } from '@/components/ui/States';
import { cn } from '@/lib/cn';
import { formatShort, hostOf, truncate } from '@/lib/format';
import type { EventListRow } from '@/lib/types';

/**
 * Карточка события. Первым идёт источник — решение «читать дальше» человек
 * принимает по тому, кто это сказал. Затем важность, заголовок, выжимка и
 * привязка к товару: то, из-за чего материал вообще попал в систему.
 */
export function EventCard({ event }: { event: EventListRow }) {
  const focus = event.product_focus ?? event.company_focus;
  // Полоса слева зажигается только на важности 4 и 5. Красить каждую строку
  // означало бы получить радугу, в которой критичное перестаёт выделяться:
  // выделение работает, только пока выделено меньшинство.
  const rail =
    event.importance >= 5
      ? 'border-l-[var(--color-critical)]'
      : event.importance === 4
        ? 'border-l-[var(--color-warning)]'
        : 'border-l-transparent';

  return (
    <article
      className={cn(
        'border-b border-l-2 border-b-[var(--color-line-2)] px-4 py-3 transition-colors last:border-b-0 hover:bg-[var(--color-raise)]',
        rail,
      )}
    >
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-[var(--color-ink-3)]">
        {event.link ? (
          <a
            href={event.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[var(--color-accent-ink)] hover:underline"
          >
            {event.source_name ?? hostOf(event.link)}
            <ExternalLink size={11} />
          </a>
        ) : (
          <span>{event.source_name ?? 'источник не указан'}</span>
        )}
        <span aria-hidden>·</span>
        <span>{event.category}</span>
        <span aria-hidden>·</span>
        <time dateTime={event.event_date}>{formatShort(event.event_date)}</time>
        <span className="ml-auto flex items-center gap-1.5">
          <SentimentBadge sentiment={event.sentiment} />
          <SeverityBadge level={event.importance} compact />
        </span>
      </div>

      <h3 className="mt-1.5 text-[14.5px] font-semibold leading-snug">
        <Link href={`/events/${event.event_id}`} className="hover:text-[var(--color-accent-ink)] hover:underline">
          {event.title}
        </Link>
      </h3>

      {event.brief ? <p className="mt-0.5 text-[13.5px] text-[var(--color-ink-2)]">{truncate(event.brief, 260)}</p> : null}

      {focus ? (
        <p className="mt-2 inline-flex items-center gap-1.5 rounded bg-[var(--color-soft)] px-2 py-0.5 text-[12.5px] font-semibold text-[var(--color-accent-ink)]">
          <Package size={12} strokeWidth={2} />
          {focus}
          {event.product_groups ? (
            <span className="font-normal text-[var(--color-ink-2)]">· группа: {event.product_groups}</span>
          ) : null}
        </p>
      ) : null}
    </article>
  );
}

export function EventFeed({ events }: { events: EventListRow[] }) {
  if (events.length === 0) {
    return (
      <EmptyState
        title="Событий за выбранный период нет"
        hint="Измените период или сбросьте фильтры. Ноль здесь может означать и то, что рынок молчит, и то, что источник не дошёл — состояние источников видно в разделе «Источники»."
      />
    );
  }
  return (
    <div>
      {events.map((event) => (
        <EventCard key={event.event_id} event={event} />
      ))}
    </div>
  );
}
