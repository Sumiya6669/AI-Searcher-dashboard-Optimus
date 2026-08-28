import { KpiSkeleton, LoadingSkeleton } from '@/components/ui/States';

export default function SectionLoading() {
  return (
    <div className="space-y-4">
      <div className="h-7 w-48 animate-pulse rounded bg-[var(--color-line-2)]" />
      <KpiSkeleton />
      <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-card)]">
        <LoadingSkeleton rows={8} />
      </div>
    </div>
  );
}
