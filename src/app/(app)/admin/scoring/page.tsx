import type { Metadata } from 'next';

import { Badge } from '@/components/ui/Badge';
import { Card, CardBody, CardHead, PageHeader } from '@/components/ui/Card';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { formatNumber } from '@/lib/format';
import { fetchScoring, fetchStages } from '@/server/queries/analysis';
import type { ScoringFactorRow } from '@/lib/types';

export const metadata: Metadata = { title: 'Веса оценки' };
export const dynamic = 'force-dynamic';

const STREAMS: Array<{ code: ScoringFactorRow['stream']; title: string; hint: string }> = [
  {
    code: 'competitor_news',
    title: 'Новости конкурентов',
    hint: 'база начисляется только если есть и конкурент, и событие',
  },
  {
    code: 'project_lead',
    title: 'Проектные лиды',
    hint: 'к весу стадии добавляется доказательность: кто назван, есть ли документ',
  },
  { code: 'tender', title: 'Закупки', hint: 'точное совпадение по товару и бренду весит больше всего' },
];

const KIND_LABEL: Record<string, string> = {
  base: 'база',
  positive: 'плюс',
  penalty: 'штраф',
  threshold: 'порог',
};

export default async function ScoringPage() {
  const [factors, stages] = await Promise.all([fetchScoring(), fetchStages()]);

  if (!factors.ok) {
    return (
      <>
        <PageHeader title="Веса оценки" />
        <Card>
          <ErrorState message={factors.error} retryHref="/admin/scoring" />
        </Card>
      </>
    );
  }

  const rows = factors.data;

  return (
    <>
      <PageHeader
        title="Веса оценки"
        subtitle={`${formatNumber(rows.length)} слагаемых по трём потокам`}
      />

      <div className="space-y-4">
        <Card>
          <CardBody className="space-y-2 text-[13px] leading-6 text-[var(--color-ink-2)]">
            <p>
              Веса заданы заказчиком и скопированы из его комплекта без изменений. Балл каждой
              записи собирается из этих слагаемых и показан на карточке — не одним числом, а
              списком, чтобы спорить можно было с конкретной строкой, а не с решением системы.
            </p>
            <p className="text-[var(--color-ink-3)]">
              Здесь только просмотр. Правка веса меняет отбор для всех потоков сразу, и делать её
              стоит после замера, а не до: тот, кто меняет вес, должен видеть, сколько записей
              изменит поведение.
            </p>
          </CardBody>
        </Card>

        {rows.length === 0 ? (
          <Card>
            <EmptyState title="Веса не заданы" hint="Список создаётся миграцией базы." />
          </Card>
        ) : (
          STREAMS.map((stream) => {
            const own = rows.filter((r) => r.stream === stream.code);
            if (own.length === 0) return null;
            const thresholds = own.filter((r) => r.kind === 'threshold');
            const rest = own.filter((r) => r.kind !== 'threshold');
            return (
              <Card key={stream.code}>
                <CardHead title={stream.title} hint={stream.hint} />
                <CardBody className="space-y-1.5">
                  {rest.map((f) => (
                    <div
                      key={f.code}
                      className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 border-b border-[var(--color-line-2)] pb-1.5 last:border-b-0"
                    >
                      <span className="min-w-0">
                        <span className="text-[13px] text-[var(--color-ink)]">{f.name}</span>
                        <Badge
                          tone={f.kind === 'penalty' ? 'critical' : f.kind === 'base' ? 'accent' : 'success'}
                          className="ml-1.5"
                        >
                          {KIND_LABEL[f.kind] ?? f.kind}
                        </Badge>
                        {f.note ? (
                          <span className="mt-0.5 block text-[12px] leading-5 text-[var(--color-ink-3)]">
                            {f.note}
                          </span>
                        ) : null}
                      </span>
                      <span
                        className={
                          f.weight < 0
                            ? 'tabular shrink-0 font-semibold text-[var(--color-critical)]'
                            : 'tabular shrink-0 font-semibold text-[var(--color-success)]'
                        }
                      >
                        {f.weight < 0 ? '' : '+'}
                        {formatNumber(f.weight)}
                      </span>
                    </div>
                  ))}
                  {thresholds.length > 0 ? (
                    <p className="pt-1 text-[12.5px] text-[var(--color-ink-2)]">
                      Пороги:{' '}
                      {thresholds
                        .map((t) => `${t.name.replace('Порог: ', '')} — ${formatNumber(t.weight)}`)
                        .join(', ')}
                      .
                    </p>
                  ) : null}
                </CardBody>
              </Card>
            );
          })
        )}

        {stages.ok && stages.data.length > 0 ? (
          <Card>
            <CardHead
              title="Стадии проекта"
              hint="вес стадии — базовый балл проектного лида"
            />
            <CardBody className="space-y-1">
              {stages.data.map((s) => (
                <div key={s.code} className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0">
                    <span className="text-[13px] text-[var(--color-ink)]">{s.name}</span>
                    {s.note ? (
                      <span className="mt-0.5 block text-[12px] leading-5 text-[var(--color-ink-3)]">{s.note}</span>
                    ) : null}
                  </span>
                  <span className="tabular shrink-0 font-semibold text-[var(--color-ink)]">
                    {formatNumber(s.score)}
                  </span>
                </div>
              ))}
            </CardBody>
          </Card>
        ) : null}
      </div>
    </>
  );
}
