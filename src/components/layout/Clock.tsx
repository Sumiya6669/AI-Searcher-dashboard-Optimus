'use client';

import { useEffect, useState } from 'react';

import { APP_TIMEZONE } from '@/lib/format';

const TIME = new Intl.DateTimeFormat('ru-RU', {
  timeZone: APP_TIMEZONE,
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

const DATE = new Intl.DateTimeFormat('ru-RU', {
  timeZone: APP_TIMEZONE,
  weekday: 'short',
  day: '2-digit',
  month: 'short',
});

/**
 * Настоящее текущее время Казахстана, а не подпись «UTC+5».
 *
 * Часы идут на стороне браузера, но считаются в поясе Казахстана независимо от
 * того, где физически находится смотрящий: сотрудник в командировке должен
 * видеть время офиса, потому что сроки приёма заявок живут именно в нём.
 *
 * До первой отрисовки в браузере часы пустые: время сервера и время машины
 * пользователя расходятся на секунды, и React справедливо ругался бы на
 * несовпадение разметки.
 */
export function Clock({ compact }: { compact?: boolean }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!now) {
    return <span className="tabular inline-block w-[64px] text-[12.5px] text-[var(--color-ink-3)]" aria-hidden />;
  }

  const time = TIME.format(now);
  const date = DATE.format(now).replace('.', '');

  if (compact) {
    return (
      <span className="tabular text-[12.5px] font-medium text-[var(--color-ink-2)]" title={`${date}, Казахстан`}>
        {time}
      </span>
    );
  }

  return (
    <span className="flex items-baseline gap-2" title="Время Казахстана">
      <span className="tabular text-[13px] font-semibold text-[var(--color-ink)]">{time}</span>
      <span className="text-[11.5px] text-[var(--color-ink-3)]">{date}</span>
    </span>
  );
}
