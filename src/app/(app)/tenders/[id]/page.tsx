import { ArrowLeft, ExternalLink } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { SeverityBadge, UrgencyBadge } from '@/components/domain/Badges';
import { Badge } from '@/components/ui/Badge';
import { ButtonLink } from '@/components/ui/Button';
import { Card, CardBody, CardHead, DefinitionList, PageHeader } from '@/components/ui/Card';
import { ErrorState } from '@/components/ui/States';
import { formatDateTime, formatHoursLeft, formatMoneyKzt, formatNumber } from '@/lib/format';
import { fetchTenderById } from '@/server/queries/tenders';
import { fetchThresholds } from '@/server/queries/admin';

export const metadata: Metadata = { title: 'Лот' };
export const dynamic = 'force-dynamic';

export default async function TenderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tenderId = Number.parseInt(id, 10);
  if (!Number.isFinite(tenderId)) notFound();

  const result = await fetchTenderById(tenderId);
  if (!result.ok) {
    return (
      <Card>
        <ErrorState message={result.error} retryHref={`/tenders/${id}`} />
      </Card>
    );
  }
  const tender = result.data;
  if (!tender) notFound();

  const thresholds = await fetchThresholds();
  const minAmount = thresholds.ok
    ? (thresholds.data.find((t) => t.key === 'tender_min_amount')?.value_num ?? null)
    : null;

  return (
    <>
      <Link
        href="/tenders"
        className="mb-3 inline-flex items-center gap-1 text-[12.5px] text-[var(--color-ink-2)] hover:text-[var(--color-ink)]"
      >
        <ArrowLeft size={13} />
        К списку закупок
      </Link>

      <PageHeader
        title={tender.title}
        subtitle={`Лот ${tender.lot_no}${tender.announce_no ? ` · объявление ${tender.announce_no}` : ''}`}
        actions={
          <>
            <UrgencyBadge urgency={tender.urgency} text={formatHoursLeft(tender.hours_left)} />
            <SeverityBadge level={tender.importance} compact />
            {tender.link ? (
              <ButtonLink href={tender.link} external variant="primary" size="sm">
                Открыть на goszakup.gov.kz
                <ExternalLink size={13} />
              </ButtonLink>
            ) : null}
          </>
        }
      />

      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <Card>
            <CardHead title="Лот" />
            <CardBody>
              <DefinitionList
                items={[
                  { term: 'Наименование', value: tender.title },
                  { term: 'Объявление', value: tender.announce_title ?? '—' },
                  { term: 'Сумма', value: <strong className="tabular">{formatMoneyKzt(tender.amount)}</strong> },
                  {
                    term: 'Количество',
                    value: tender.qty ? `${formatNumber(tender.qty)} ${tender.unit ?? ''}`.trim() : '—',
                  },
                  { term: 'Способ закупки', value: tender.trade_method ?? '—' },
                  { term: 'Код ТРУ', value: tender.ktru_code ?? 'из карточки не получен' },
                  { term: 'Место поставки', value: tender.kato ?? tender.delivery_place ?? '—' },
                  { term: 'Срок поставки', value: tender.delivery_term ?? '—' },
                  { term: 'Описание', value: tender.description ?? '—' },
                ]}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHead title="Почему лот попал в выборку" />
            <CardBody className="space-y-2">
              <p className="text-[13.5px] text-[var(--color-ink)]">{tender.match_reason ?? 'основание не записано'}</p>
              {tender.matched_on ? (
                <div className="flex flex-wrap gap-1.5">
                  {tender.matched_on.split(', ').map((term) => (
                    <Badge key={term} tone="accent">
                      {term}
                    </Badge>
                  ))}
                </div>
              ) : null}
              <p className="text-[12.5px] text-[var(--color-ink-2)]">
                Порог значимости — {minAmount ? formatMoneyKzt(minAmount) : 'задан в настройках базы'}. Лот с прямо
                названным брендом проходит независимо от суммы: правило применяется при записи лота в базу, а не в
                этом окне.
                {tender.has_brand ? ' У этого лота бренд назван прямо.' : ''}
              </p>
              {tender.entity_names ? (
                <p className="text-[13px] text-[var(--color-ink-2)]">
                  Связано со словарём: <span className="text-[var(--color-ink)]">{tender.entity_names}</span>
                </p>
              ) : null}
            </CardBody>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHead title="Сроки" />
            <CardBody>
              <DefinitionList
                items={[
                  { term: 'Опубликовано', value: formatDateTime(tender.published_at) },
                  { term: 'Приём заявок с', value: formatDateTime(tender.apply_from) },
                  { term: 'Приём заявок до', value: <strong>{formatDateTime(tender.apply_to)}</strong> },
                  { term: 'Осталось', value: formatHoursLeft(tender.hours_left) },
                  { term: 'Статус на портале', value: tender.portal_status ?? '—' },
                ]}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHead title="Заказчик" />
            <CardBody>
              <DefinitionList
                items={[
                  { term: 'Наименование', value: tender.customer_name ?? '—' },
                  { term: 'БИН', value: tender.customer_bin ?? '—' },
                  { term: 'Организатор', value: tender.organizer_name ?? '—' },
                ]}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHead title="Обработка" />
            <CardBody>
              <DefinitionList
                items={[
                  { term: 'Источник', value: tender.source === 'goszakup' ? 'goszakup.gov.kz' : tender.source },
                  { term: 'Карточка получена', value: tender.enriched ? 'да' : 'нет' },
                  { term: 'Оповещение', value: tender.is_notified ? 'отправлено' : 'не отправлялось' },
                  { term: 'Напоминание', value: tender.reminder_sent ? 'отправлено' : 'не отправлялось' },
                  { term: 'Найден', value: formatDateTime(tender.created_at) },
                  { term: 'Обновлён', value: formatDateTime(tender.updated_at) },
                ]}
              />
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
