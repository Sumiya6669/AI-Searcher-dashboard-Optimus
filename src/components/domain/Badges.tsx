import { Badge, Dot } from '@/components/ui/Badge';
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
  return (
    <Badge tone={meta.tone} title={meta.label}>
      <Dot tone={meta.tone} />
      {compact ? `${meta.level}/5` : `${meta.level}/5 · ${meta.label.toLowerCase()}`}
    </Badge>
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
