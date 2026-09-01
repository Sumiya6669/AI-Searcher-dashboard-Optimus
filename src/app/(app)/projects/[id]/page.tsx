import { ArrowLeft, ExternalLink } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import {
  ConfidenceBadge,
  EvidenceCard,
  PriorityBadge,
  RecommendationCard,
  ScoreBreakdown,
  VerificationBadge,
} from '@/components/domain/Analysis';
import { Badge } from '@/components/ui/Badge';
import { ButtonLink } from '@/components/ui/Button';
import { Card, CardBody, CardHead, DefinitionList, PageHeader } from '@/components/ui/Card';
import { ErrorState } from '@/components/ui/States';
import { formatDateTime, formatNumber } from '@/lib/format';
import { fetchProject } from '@/server/queries/analysis';

export const metadata: Metadata = { title: 'Объект' };
export const dynamic = 'force-dynamic';

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const projectId = Number.parseInt(id, 10);
  if (!Number.isFinite(projectId)) notFound();

  const result = await fetchProject(projectId);
  if (!result.ok) {
    return (
      <Card>
        <ErrorState message={result.error} retryHref={`/projects/${id}`} />
      </Card>
    );
  }
  const p = result.data;
  if (!p) notFound();

  return (
    <>
      <Link
        href="/projects"
        className="mb-3 inline-flex items-center gap-1 text-[12.5px] text-[var(--color-ink-2)] hover:text-[var(--color-ink)]"
      >
        <ArrowLeft size={13} />
        К списку объектов
      </Link>

      <PageHeader
        title={p.project_name}
        subtitle={[p.object_type_name, p.stage_name, p.place].filter(Boolean).join(' · ')}
        actions={
          <>
            <PriorityBadge priority={p.priority} />
            <ConfidenceBadge confidence={p.confidence} />
            <VerificationBadge status={p.verification_status} />
            {p.link ? (
              <ButtonLink href={p.link} external variant="primary" size="sm">
                Источник
                <ExternalLink size={13} />
              </ButtonLink>
            ) : null}
          </>
        }
      />

      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <Card>
            <CardHead title="Объект" />
            <CardBody>
              <DefinitionList
                items={[
                  { term: 'Тип объекта', value: p.object_type_name ?? '—' },
                  {
                    term: 'Стадия',
                    value: p.stage_name ? (
                      <span className="flex items-center gap-2">
                        <Badge tone="accent">{p.stage_name}</Badge>
                        <span className="tabular text-[12.5px] text-[var(--color-ink-3)]">
                          вес стадии {formatNumber(p.stage_score ?? 0)}
                        </span>
                      </span>
                    ) : (
                      '—'
                    ),
                  },
                  { term: 'Страна', value: p.country ?? '—' },
                  { term: 'Регион', value: p.region ?? '—' },
                  { term: 'Город', value: p.city ?? '—' },
                  { term: 'Источников', value: formatNumber(p.sources_count) },
                ]}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHead
              title="Участники"
              hint="кому звонить: материал закупает подрядчик, а не заказчик"
            />
            <CardBody>
              <DefinitionList
                items={[
                  { term: 'Заказчик', value: p.customer ?? 'в тексте не назван' },
                  { term: 'Инвестор', value: p.investor ?? 'в тексте не назван' },
                  { term: 'Проектировщик', value: p.designer ?? 'в тексте не назван' },
                  { term: 'Генподрядчик', value: p.general_contractor ?? 'в тексте не назван' },
                ]}
              />
            </CardBody>
          </Card>

          <EvidenceCard items={p.evidence} />
        </div>

        <div className="space-y-4">
          <RecommendationCard
            action={p.recommended_action}
            department={p.department_name}
            contactRole={p.contact_role}
            categoryNames={p.product_category_names}
          />

          <ScoreBreakdown
            base={p.stage_score}
            positive={p.positive_factors}
            penalties={p.penalties}
            total={p.total_score}
            priority={p.priority}
            hint="базовый балл — вес стадии; пороги: 80 горячий, 60 в работу, 40 наблюдение"
          />

          <Card>
            <CardHead title="Обработка" />
            <CardBody>
              <DefinitionList
                items={[
                  { term: 'Найден', value: formatDateTime(p.first_seen_at) },
                  { term: 'Обновлён', value: formatDateTime(p.updated_at) },
                  {
                    term: 'Первое событие',
                    value: p.first_event_id ? (
                      <Link className="text-[var(--color-accent-ink)]" href={`/events/${p.first_event_id}`}>
                        событие {p.first_event_id}
                      </Link>
                    ) : (
                      '—'
                    ),
                  },
                  {
                    term: 'Последнее событие',
                    value: p.last_event_id ? (
                      <Link className="text-[var(--color-accent-ink)]" href={`/events/${p.last_event_id}`}>
                        событие {p.last_event_id}
                      </Link>
                    ) : (
                      '—'
                    ),
                  },
                ]}
              />
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
