import { Badge } from '@/components/ui/Badge';
import { Card, CardBody, CardHead } from '@/components/ui/Card';
import { formatNumber } from '@/lib/format';
import type {
  ConfidenceKind,
  EvidenceItem,
  PriorityKind,
  ScoreFactor,
  StreamKind,
  VerificationKind,
} from '@/lib/types';
import type { Tone } from '@/lib/domain';

/* --- значки ------------------------------------------------------------- */

const PRIORITY: Record<PriorityKind, { label: string; tone: Tone }> = {
  critical: { label: 'критично', tone: 'critical' },
  high: { label: 'высокий', tone: 'warning' },
  medium: { label: 'средний', tone: 'attention' },
  monitoring: { label: 'наблюдение', tone: 'neutral' },
  archive: { label: 'в архив', tone: 'neutral' },
};

const CONFIDENCE: Record<ConfidenceKind, { label: string; tone: Tone }> = {
  high: { label: 'уверенность высокая', tone: 'success' },
  medium: { label: 'уверенность средняя', tone: 'attention' },
  low: { label: 'уверенность низкая', tone: 'neutral' },
};

const VERIFICATION: Record<VerificationKind, { label: string; tone: Tone }> = {
  verified: { label: 'подтверждено документом', tone: 'success' },
  partially_verified: { label: 'подтверждено частично', tone: 'attention' },
  unverified: { label: 'не подтверждено', tone: 'neutral' },
};

const STREAM: Record<StreamKind, string> = {
  competitor_news: 'новость конкурента',
  project_lead: 'проектный лид',
  market_info: 'сведения о рынке',
};

export function PriorityBadge({ priority }: { priority: PriorityKind | null }) {
  if (!priority) return null;
  const p = PRIORITY[priority];
  return <Badge tone={p.tone}>{p.label}</Badge>;
}

export function ConfidenceBadge({ confidence }: { confidence: ConfidenceKind | null }) {
  if (!confidence) return null;
  const c = CONFIDENCE[confidence];
  return <Badge tone={c.tone}>{c.label}</Badge>;
}

export function VerificationBadge({ status }: { status: VerificationKind | null }) {
  if (!status) return null;
  const v = VERIFICATION[status];
  return <Badge tone={v.tone}>{v.label}</Badge>;
}

export function StreamBadge({ stream }: { stream: StreamKind | null }) {
  if (!stream) return null;
  return <Badge tone={stream === 'project_lead' ? 'accent' : 'neutral'}>{STREAM[stream]}</Badge>;
}

/* --- разложение балла --------------------------------------------------- */

/**
 * Балл показывается слагаемыми, а не одним числом.
 *
 * «Важность 4» не объясняет ничего и спорить с ней нельзя. «70 за
 * определённого генподрядчика, плюс 20 за несколько наших направлений, минус
 * 20 за то, что не назван ни один юридический субъект» объясняет всё и
 * позволяет спорить с конкретным слагаемым — а именно этого просил
 * исполнительный директор, когда сказал, что в ленте слишком много лишнего.
 */
export function ScoreBreakdown({
  base,
  positive,
  penalties,
  total,
  priority,
  hint,
}: {
  base?: number | null;
  positive: ScoreFactor[];
  penalties: ScoreFactor[];
  total: number | null;
  priority: PriorityKind | null;
  hint?: string;
}) {
  const pos = Array.isArray(positive) ? positive : [];
  const pen = Array.isArray(penalties) ? penalties : [];
  const nothing = pos.length === 0 && pen.length === 0 && !base;

  return (
    <Card>
      <CardHead
        title="Балл и из чего он собран"
        hint={hint ?? 'веса заданы в администрировании'}
        actions={
          <span className="flex items-center gap-1.5">
            <PriorityBadge priority={priority} />
            <span className="tabular text-[15px] font-semibold text-[var(--color-ink)]">
              {total === null ? '—' : formatNumber(total)}
            </span>
          </span>
        }
      />
      <CardBody className="space-y-1.5">
        {nothing ? (
          <p className="text-[12.5px] text-[var(--color-ink-2)]">
            Слагаемые не записаны: запись обработана до появления этого расчёта.
          </p>
        ) : null}

        {base ? (
          <Row name="Базовый балл: конкурент и релевантное событие" weight={base} />
        ) : null}
        {pos.map((f) => (
          <Row key={f.code} name={f.name} weight={f.weight} />
        ))}
        {pen.map((f) => (
          <Row key={f.code} name={f.name} weight={f.weight} />
        ))}
      </CardBody>
    </Card>
  );
}

function Row({ name, weight }: { name: string; weight: number }) {
  const negative = weight < 0;
  return (
    <p className="flex items-baseline justify-between gap-3 text-[13px]">
      <span className="min-w-0 text-[var(--color-ink-2)]">{name}</span>
      <span
        className={
          negative
            ? 'tabular shrink-0 font-semibold text-[var(--color-critical)]'
            : 'tabular shrink-0 font-semibold text-[var(--color-success)]'
        }
      >
        {negative ? '' : '+'}
        {formatNumber(weight)}
      </span>
    </p>
  );
}

/* --- доказательства ----------------------------------------------------- */

/**
 * Комплект исполнительного директора требует по каждому выводу кусок исходного
 * текста. Смысл прикладной: проверять систему нужно не по её объяснению, а по
 * цитате, из которой вывод сделан.
 */
export function EvidenceCard({ items }: { items: EvidenceItem[] }) {
  const list = Array.isArray(items) ? items : [];
  if (list.length === 0) return null;

  return (
    <Card>
      <CardHead title="На чём основан вывод" hint="утверждение и место в исходном тексте" />
      <CardBody className="space-y-2">
        {list.map((item, i) => (
          <div key={`${item.claim}-${i}`} className="min-w-0">
            <p className="text-[13px] text-[var(--color-ink)]">{item.claim}</p>
            {item.source_fragment ? (
              <p className="mt-0.5 truncate text-[12px] text-[var(--color-ink-3)]">
                по признаку: <code className="text-[var(--color-ink-2)]">{item.source_fragment}</code>
              </p>
            ) : null}
          </div>
        ))}
      </CardBody>
    </Card>
  );
}

/* --- рекомендация ------------------------------------------------------- */

/**
 * Ответ на вопрос, которого системе не хватало с самого начала: что с этим
 * делать и кто отвечает. До этого сводка расходилась на четырнадцать человек,
 * а отвечал ноль — каждый видел новость, никто не видел поручения.
 */
export function RecommendationCard({
  action,
  department,
  departmentScope,
  contactRole,
  categoryNames,
  positions,
}: {
  action: string | null;
  department: string | null;
  departmentScope?: string | null;
  contactRole: string | null;
  categoryNames?: string | null;
  positions?: number | null;
}) {
  if (!action && !department && !categoryNames) return null;

  return (
    <Card>
      <CardHead
        title="Что делать"
        hint={department ? `ответственно: ${department.toLowerCase()}` : 'подразделение не определено'}
      />
      <CardBody className="space-y-2.5">
        {action ? (
          <p className="text-[13.5px] leading-6 text-[var(--color-ink)]">{action}</p>
        ) : (
          <p className="text-[13px] text-[var(--color-ink-2)]">
            Рекомендации нет: по тексту не видно, что произошло. Придуманное поручение хуже его
            отсутствия.
          </p>
        )}

        {contactRole ? (
          <p className="text-[13px] text-[var(--color-ink-2)]">
            Кому звонить у клиента: <span className="text-[var(--color-ink)]">{contactRole}</span>
          </p>
        ) : null}

        {departmentScope ? (
          <p className="text-[12px] text-[var(--color-ink-3)]">{departmentScope}</p>
        ) : null}

        {categoryNames ? (
          <div className="border-t border-[var(--color-line)] pt-2">
            <p className="eyebrow mb-1">Что предложить из нашего</p>
            <p className="text-[13px] text-[var(--color-ink)]">{categoryNames}</p>
            {positions ? (
              <p className="mt-0.5 text-[12px] text-[var(--color-ink-3)]">
                в каталоге {formatNumber(positions)} позиций по этим группам
              </p>
            ) : null}
          </div>
        ) : null}
      </CardBody>
    </Card>
  );
}
