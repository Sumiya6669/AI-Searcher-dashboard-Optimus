import { ExternalLink } from 'lucide-react';
import Link from 'next/link';

import { SeverityBadge, UrgencyBadge } from '@/components/domain/Badges';
import { Badge } from '@/components/ui/Badge';
import { tenderSourceLabel } from '@/lib/domain';
import { formatDate, formatDateTime, formatHoursLeft, formatMoneyKzt, hostOf, plural } from '@/lib/format';
import type { ChatEventSource, ChatSources, ChatTenderSource } from '@/lib/types';

/**
 * Основания ответа. Текст модели — пересказ, и проверять его человек будет не
 * по тексту, а по лоту: сумма, срок, заказчик, номер и адрес объявления. Всё
 * это берётся из снимка материала, сохранённого вместе с ответом, поэтому
 * ссылка ведёт именно туда, о чём был разговор, а не туда, где сейчас
 * оказался тот же поиск.
 */

function LotRow({ lot }: { lot: ChatTenderSource }) {
  const amount = lot.amount !== null && Number(lot.amount) > 0 ? formatMoneyKzt(lot.amount) : 'сумма не указана';

  return (
    <li className="border-t border-[var(--color-line)] px-3.5 py-2.5 first:border-t-0">
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
        <Link
          href={`/tenders/${lot.tender_id}`}
          className="text-[13.5px] font-semibold leading-5 text-[var(--color-ink)] hover:text-[var(--color-accent-ink)] hover:underline"
        >
          {lot.title}
        </Link>
        <span className="flex shrink-0 items-center gap-1.5">
          <UrgencyBadge urgency={lot.urgency} text={formatHoursLeft(lot.hours_left)} />
          <SeverityBadge level={lot.importance} compact />
        </span>
      </div>

      <p className="mt-1 text-[12.5px] leading-5 text-[var(--color-ink-2)]">
        {lot.customer_name ?? 'заказчик не указан'}
        {lot.kato_name ? ` · ${lot.kato_name}` : ''}
        {' · '}
        <span className={lot.amount !== null && Number(lot.amount) > 0 ? 'font-semibold text-[var(--color-ink)]' : ''}>
          {amount}
        </span>
      </p>

      <p className="mt-0.5 text-[11.5px] leading-5 text-[var(--color-ink-3)]">
        Приём заявок до {formatDateTime(lot.apply_to)}
        {lot.trade_method_name ? ` · ${lot.trade_method_name}` : ''}
        {lot.lot_no ? ` · лот ${lot.lot_no}` : ''}
        {lot.announce_no ? ` · объявление ${lot.announce_no}` : ''}
      </p>

      <p className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11.5px] text-[var(--color-ink-3)]">
        <span>через {tenderSourceLabel(lot.source)}</span>
        {lot.link ? (
          <a
            href={lot.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[var(--color-accent-ink)] hover:underline"
          >
            <ExternalLink size={11} strokeWidth={2} />
            объявление на {hostOf(lot.link)}
          </a>
        ) : (
          <span>адрес объявления не пришёл</span>
        )}
      </p>
    </li>
  );
}

function EventRow({ event }: { event: ChatEventSource }) {
  return (
    <li className="border-t border-[var(--color-line)] px-3.5 py-2.5 first:border-t-0">
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
        <Link
          href={`/events/${event.event_id}`}
          className="text-[13.5px] font-semibold leading-5 text-[var(--color-ink)] hover:text-[var(--color-accent-ink)] hover:underline"
        >
          {event.title}
        </Link>
        <SeverityBadge level={event.importance} compact />
      </div>

      {event.vyzhimka ? (
        <p className="mt-1 line-clamp-2 text-[12.5px] leading-5 text-[var(--color-ink-2)]">{event.vyzhimka}</p>
      ) : null}

      <p className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11.5px] text-[var(--color-ink-3)]">
        <span>
          {event.source_name ?? 'источник не указан'} · {formatDate(event.event_date)}
        </span>
        {event.entity_names ? <span className="truncate">{event.entity_names}</span> : null}
        {event.link ? (
          <a
            href={event.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[var(--color-accent-ink)] hover:underline"
          >
            <ExternalLink size={11} strokeWidth={2} />
            {hostOf(event.link)}
          </a>
        ) : null}
      </p>
    </li>
  );
}

export function Sources({ sources }: { sources: ChatSources }) {
  const events = sources.events ?? [];
  const tenders = sources.tenders ?? [];
  if (events.length === 0 && tenders.length === 0) return null;

  const parts: string[] = [];
  if (tenders.length > 0) {
    parts.push(`${tenders.length} ${plural(tenders.length, 'лот', 'лота', 'лотов')}`);
  }
  if (events.length > 0) {
    parts.push(`${events.length} ${plural(events.length, 'событие', 'события', 'событий')}`);
  }

  return (
    <details className="group rounded-lg border border-[var(--color-line)] bg-[var(--color-bg)]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3.5 py-2 text-[12.5px] text-[var(--color-ink-2)] hover:text-[var(--color-ink)]">
        <span>
          <span className="font-semibold text-[var(--color-ink)]">Основания ответа:</span>{' '}
          {parts.join(', ')} — {tenders.length > 0 ? 'со ссылками, суммами и сроками' : 'со ссылками на источники'}
        </span>
        <span className="shrink-0 text-[11.5px] text-[var(--color-ink-3)] group-open:hidden">развернуть</span>
        <span className="hidden shrink-0 text-[11.5px] text-[var(--color-ink-3)] group-open:inline">скрыть</span>
      </summary>

      <div className="space-y-2.5 px-2 pb-2.5">
        {tenders.length > 0 ? (
          <div>
            <p className="eyebrow px-1.5 py-1.5">Закупки</p>
            <ul className="rounded-lg border border-[var(--color-line)] bg-[var(--color-card)]">
              {tenders.map((lot) => (
                <LotRow key={lot.tender_id} lot={lot} />
              ))}
            </ul>
          </div>
        ) : null}

        {events.length > 0 ? (
          <div>
            <p className="eyebrow px-1.5 py-1.5">События</p>
            <ul className="rounded-lg border border-[var(--color-line)] bg-[var(--color-card)]">
              {events.map((event) => (
                <EventRow key={event.event_id} event={event} />
              ))}
            </ul>
          </div>
        ) : null}

        <p className="px-1.5 text-[11.5px] leading-5 text-[var(--color-ink-3)]">
          Это снимок на момент вопроса.{' '}
          {tenders.length > 0
            ? 'Лот мог с тех пор закрыться, но здесь он останется таким, каким его видел ответ, — иначе проверить ответ было бы нечем.'
            : 'Материал мог с тех пор уйти за границу периода, но здесь он останется таким, каким его видел ответ, — иначе проверить ответ было бы нечем.'}{' '}
          <Badge tone="neutral">внешние ссылки ведут на источник, названия — в дашборд</Badge>
        </p>
      </div>
    </details>
  );
}
