import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

const CONTROL =
  'w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-raise)] px-2.5 py-1.5 text-[13.5px] text-[var(--color-ink)] placeholder:text-[var(--color-ink-3)]';

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn('block min-w-0', className)}>
      <span className="mb-1 block text-[12.5px] font-medium text-[var(--color-ink-2)]">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-[11.5px] leading-4 text-[var(--color-ink-3)]">{hint}</span> : null}
    </label>
  );
}

export function TextInput(props: React.ComponentProps<'input'>) {
  return <input {...props} className={cn(CONTROL, props.className)} />;
}

export function Select(props: React.ComponentProps<'select'>) {
  return <select {...props} className={cn(CONTROL, props.className)} />;
}

export function TextArea(props: React.ComponentProps<'textarea'>) {
  return <textarea {...props} className={cn(CONTROL, 'min-h-16 resize-y', props.className)} />;
}

export function Checkbox({
  name,
  defaultChecked,
  label,
  hint,
}: {
  name: string;
  defaultChecked?: boolean;
  label: string;
  hint?: string;
}) {
  return (
    <label className="flex items-start gap-2.5">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="mt-0.5 size-4 shrink-0 accent-[var(--color-accent)]"
      />
      <span className="min-w-0">
        <span className="block text-[13px] text-[var(--color-ink)]">{label}</span>
        {hint ? <span className="block text-[11.5px] leading-4 text-[var(--color-ink-3)]">{hint}</span> : null}
      </span>
    </label>
  );
}

/**
 * Отклик формы. Успех и отказ выглядят по-разному не только цветом: цвет —
 * единственный различитель ровно до первого дальтоника в отделе.
 */
export function FormNotice({ status, message }: { status: 'idle' | 'saved' | 'error'; message?: string }) {
  if (status === 'idle' || !message) return null;
  const bad = status === 'error';
  return (
    <p
      role={bad ? 'alert' : 'status'}
      className={cn(
        'rounded-lg px-3 py-2 text-[12.5px]',
        bad
          ? 'bg-[var(--color-critical-soft)] text-[var(--color-critical)]'
          : 'bg-[var(--color-success-soft)] text-[var(--color-success)]',
      )}
    >
      {bad ? 'Не сохранено: ' : 'Готово. '}
      {message}
    </p>
  );
}
