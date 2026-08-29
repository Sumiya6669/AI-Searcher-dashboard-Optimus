import { Badge, Dot, Meter } from '@/components/ui/Badge';
import { cn } from '@/lib/cn';
import {
  CRAWL_HEALTH,
  FRESHNESS,
  RUN_STATUS,
  SENTIMENT_TONE,
  severityMeta,
  URGENCY,
  type Tone,
} from '@/lib/domain';
import type { CrawlHealth, SourceFreshness, TenderUrgency } from '@/lib/types';

export function SeverityBadge({ level, compact }: { level: number | null | undefined; compact?: boolean }) {
  const meta = severityMeta(level);
  const title = `${meta.level} из 5 — ${meta.label.toLowerCase()}`;
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5" title={title}>
      <Meter level={meta.level} tone={meta.tone} title={title} />
      <span
        className={cn(
          'text-[11px] font-bold uppercase tracking-[0.05em]',
          meta.tone === 'critical'
            ? 'text-[var(--color-critical)]'
            : meta.tone === 'warning'
              ? 'text-[var(--color-warning)]'
              : meta.tone === 'attention'
                ? 'text-[var(--color-attention)]'
                : 'text-[var(--color-ink-3)]',
        )}
      >
        {compact ? meta.level : meta.short}
      </span>
    </span>
  );
}

export function UrgencyBadge({ urgency, text }: { urgency: TenderUrgency; text: string }) {
  const meta = URGENCY[urgency];
  return (
    <Badge tone={meta.tone} title={meta.label}>
      <Dot tone={meta.tone} />
      {text}
    </Badge>
  );
}

export function FreshnessBadge({ freshness }: { freshness: SourceFreshness }) {
  const meta = FRESHNESS[freshness];
  return (
    <Badge tone={meta.tone} title={meta.hint}>
      <Dot tone={meta.tone} />
      {meta.label}
    </Badge>
  );
}

export function CrawlHealthBadge({ health }: { health: CrawlHealth }) {
  const meta = CRAWL_HEALTH[health];
  return (
    <Badge tone={meta.tone}>
      <Dot tone={meta.tone} />
      {meta.label}
    </Badge>
  );
}

export function RunStatusBadge({ status }: { status: string | null | undefined }) {
  const meta = status ? RUN_STATUS[status] : undefined;
  const tone: Tone = meta?.tone ?? 'neutral';
  return (
    <Badge tone={tone}>
      <Dot tone={tone} />
      {meta?.label ?? status ?? '—'}
    </Badge>
  );
}

export function SentimentBadge({ sentiment }: { sentiment: string | null | undefined }) {
  if (!sentiment) return null;
  const tone = SENTIMENT_TONE[sentiment] ?? 'neutral';
  return <Badge tone={tone}>{sentiment}</Badge>;
}

export function SourceBadge({ name }: { name: string | null | undefined }) {
  if (!name) return null;
  return <Badge tone="neutral">{name}</Badge>;
}

export function GapBadge() {
  return (
    <Badge tone="warning" title="События есть, а получателя нет — эти новости никому не уходят">
      настроечная дыра
    </Badge>
  );
}
