import Image from 'next/image';

/**
 * Логотип Optimus Eye: фирменный знак Optimus KZ + название в стиле логотипа
 * компании — красное «OPTIMUS» и серое «EYE», как «KZ» в основном логотипе.
 *
 * Знак, шрифт и цвета те же, что у Optimus Way: линейка держится на одном
 * знаке и одной паре цветов, различается только слово.
 */
export function Logo({ size = 'md', className }: { size?: 'md' | 'lg'; className?: string }) {
  const lg = size === 'lg';
  const px = lg ? 36 : 28;
  return (
    <span className={['inline-flex items-center', lg ? 'gap-2.5' : 'gap-2', className].filter(Boolean).join(' ')}>
      <Image src="/brand/mark.png" alt="" width={px} height={px} priority style={{ width: px, height: px }} />
      <span
        className={[
          'leading-none font-extrabold uppercase tracking-[0.01em]',
          lg ? 'text-[20px]' : 'text-[15px]',
        ].join(' ')}
      >
        <span className="text-[var(--color-accent)]">Optimus</span>{' '}
        <span className="text-[var(--color-brand-gray)]">Eye</span>
      </span>
    </span>
  );
}
