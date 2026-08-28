import { ButtonLink } from '@/components/ui/Button';

export default function SectionNotFound() {
  return (
    <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-card)] px-4 py-10 text-center">
      <p className="text-[15px] font-semibold">Запись не найдена</p>
      <p className="mx-auto mt-1 max-w-lg text-[13px] text-[var(--color-ink-2)]">
        Возможно, она удалена политикой хранения: события, материалы и снимки страниц хранятся ограниченное время.
      </p>
      <ButtonLink href="/dashboard" variant="primary" size="sm" className="mt-3">
        На дашборд
      </ButtonLink>
    </div>
  );
}
