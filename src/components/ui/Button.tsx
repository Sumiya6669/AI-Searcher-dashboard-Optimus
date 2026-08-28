import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';

import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md';

const BASE =
  'inline-flex items-center justify-center gap-1.5 rounded-md border font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-55';

const VARIANT: Record<Variant, string> = {
  primary:
    'border-[var(--color-accent)] bg-[var(--color-accent)] text-white hover:opacity-90 dark:text-[#101215]',
  secondary:
    'border-[var(--color-line)] bg-[var(--color-card)] text-[var(--color-ink)] hover:bg-[var(--color-line-2)]',
  ghost: 'border-transparent bg-transparent text-[var(--color-ink-2)] hover:bg-[var(--color-line-2)] hover:text-[var(--color-ink)]',
  danger: 'border-[var(--color-critical)] bg-transparent text-[var(--color-critical)] hover:bg-[var(--color-critical-soft)]',
};

const SIZE: Record<Size, string> = {
  sm: 'h-7 px-2.5 text-[12.5px]',
  md: 'h-9 px-3.5 text-[13.5px]',
};

export function Button({
  variant = 'secondary',
  size = 'md',
  className,
  ...rest
}: ComponentProps<'button'> & { variant?: Variant; size?: Size }) {
  return <button className={cn(BASE, VARIANT[variant], SIZE[size], className)} {...rest} />;
}

export function ButtonLink({
  href,
  variant = 'secondary',
  size = 'md',
  className,
  external,
  children,
  ...rest
}: {
  href: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  external?: boolean;
  children: ReactNode;
} & Omit<ComponentProps<'a'>, 'href' | 'className' | 'children'>) {
  const classes = cn(BASE, VARIANT[variant], SIZE[size], className);
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={classes} {...rest}>
      {children}
    </Link>
  );
}
