import { ArrowRight } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { ConfidenceBadge, PriorityBadge } from '@/components/domain/Analysis';
import { Badge } from '@/components/ui/Badge';
import { Card, CardBody, CardHead, PageHeader } from '@/components/ui/Card';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { formatDate, formatNumber, plural } from '@/lib/format';
import { fetchProjects, fetchStages } from '@/server/queries/analysis';

export const metadata: Metadata = { title: 'Проекты' };
export const dynamic = 'force-dynamic';

const STATUS_LABEL: Record<string, string> = {
  monitoring: 'наблюдение',
  active: 'в работе',
  hot: 'горячий',
  commissioned: 'введён',
  lost: 'упущен',
};

export default async function ProjectsPage() {
  const [projects, stages] = await Promise.all([fetchProjects(), fetchStages()]);

  if (!projects.ok) {
    return (
      <>
        <PageHeader title="Проекты" />
        <Card>
          <ErrorState message={projects.error} retryHref="/projects" />
        </Card>
      </>
    );
  }

  const rows = projects.data;
  const hot = rows.filter((r) => r.priority === 'critical' || r.priority === 'high').length;

  return (
    <>
      <PageHeader
        title="Проекты"
        subtitle={
          rows.length === 0
            ? 'объектов пока нет'
            : `${formatNumber(rows.length)} ${plural(rows.length, 'объект', 'объекта', 'объектов')}, из них ${formatNumber(hot)} ${plural(hot, 'требует', 'требуют', 'требуют')} работы сейчас`
        }
      />

      <div className="space-y-4">
        <Card>
          <CardBody className="space-y-2 text-[13px] leading-6 text-[var(--color-ink-2)]">
            <p>
              Это поиск не новостей, а стройки — на той стадии, когда материал ещё не выбран. Когда
              лот опубликован, спецификация уже составлена, и конкурировать остаётся ценой.
            </p>
            <p>
              Запись появляется только если в тексте есть <span className="text-[var(--color-ink)]">тип
              объекта</span> и <span className="text-[var(--color-ink)]">сигнал стадии</span>. «В
              Казахстане будут строить больше жилья» — не объект. «В Караганде начато строительство
              ТЛЦ» — объект.
            </p>
            <p className="text-[var(--color-ink-3)]">
              Один объект приходит много раз за годы. Это не новые записи, а одна, у которой
              двигается стадия: землю выделили, экспертизу прошли, подрядчика определили.
            </p>
          </CardBody>
        </Card>

        {rows.length === 0 ? (
          <Card>
            <EmptyState
              title="Объектов пока не найдено"
              hint="Поток работает, но текущие источники — сайты конкурентов и новости брендов. Стройки живут в другом месте: сообщения акиматов, отраслевые порталы, госэкспертиза. Их нужно подключить отдельно."
            />
          </Card>
        ) : (
          <div className="space-y-2">
            {rows.map((p) => (
              <Card key={p.id}>
                <CardBody className="space-y-2">
                  <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1.5">
                    <Link
                      href={`/projects/${p.id}`}
                      className="min-w-0 text-[14px] font-semibold leading-5 text-[var(--color-ink)] hover:text-[var(--color-accent-ink)]"
                    >
                      {p.project_name}
                    </Link>
                    <span className="flex shrink-0 items-center gap-1.5">
                      <PriorityBadge priority={p.priority} />
                      <span className="tabular text-[14px] font-semibold">{formatNumber(p.total_score)}</span>
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {p.stage_name ? <Badge tone="accent">{p.stage_name}</Badge> : null}
                    {p.object_type_name ? <Badge>{p.object_type_name}</Badge> : null}
                    {p.place ? <Badge>{p.place}</Badge> : null}
                    <Badge>{STATUS_LABEL[p.status] ?? p.status}</Badge>
                    <ConfidenceBadge confidence={p.confidence} />
                  </div>

                  {p.product_category_names ? (
                    <p className="text-[13px] text-[var(--color-ink-2)]">
                      Предложить: <span className="text-[var(--color-ink)]">{p.product_category_names}</span>
                    </p>
                  ) : null}

                  <p className="flex flex-wrap items-center gap-x-3 text-[12px] text-[var(--color-ink-3)]">
                    {p.customer ? <span>заказчик: {p.customer}</span> : null}
                    {p.general_contractor ? <span>подрядчик: {p.general_contractor}</span> : null}
                    <span>обновлён {formatDate(p.updated_at)}</span>
                    <Link
                      href={`/projects/${p.id}`}
                      className="inline-flex items-center gap-1 text-[var(--color-accent-ink)]"
                    >
                      подробно <ArrowRight size={12} />
                    </Link>
                  </p>
                </CardBody>
              </Card>
            ))}
          </div>
        )}

        {stages.ok && stages.data.length > 0 ? (
          <Card>
            <CardHead
              title="Стадии и их вес"
              hint="вес задан заказчиком; определённый подрядчик дороже начатой стройки — он выбирает материал"
            />
            <CardBody>
              <ul className="space-y-1">
                {stages.data.map((s) => (
                  <li key={s.code} className="flex items-baseline justify-between gap-3 text-[13px]">
                    <span className="min-w-0 text-[var(--color-ink-2)]">
                      {s.name}
                      {s.projects > 0 ? (
                        <span className="text-[var(--color-ink-3)]"> · объектов: {formatNumber(s.projects)}</span>
                      ) : null}
                    </span>
                    <span className="tabular shrink-0 font-semibold text-[var(--color-ink)]">{s.score}</span>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        ) : null}
      </div>
    </>
  );
}
