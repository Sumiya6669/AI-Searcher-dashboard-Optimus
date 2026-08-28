'use client';

import { useId, useState } from 'react';

import { formatDate, formatNumber, formatUsd } from '@/lib/format';
import type { LlmDailyRow } from '@/lib/types';

/**
 * Расход на модель по суткам. Один ряд — поэтому легенда не нужна, ряд назван
 * заголовком блока. Столбцы, а не линия: сутки — дискретная единица, между
 * двумя днями нет промежуточных значений, и линия обещала бы их зря.
 *
 * Цвет один, фирменный: проверка на различимость нескольких категорий здесь
 * не применяется, а контраст к подложке в обеих темах достаточен. Подписаны
 * только максимум и последний день — число на каждом столбце превращает
 * график в таблицу.
 */
export function SpendChart({ rows, budgetPerDay }: { rows: LlmDailyRow[]; budgetPerDay: number | null }) {
  const [hover, setHover] = useState<number | null>(null);
  const clipId = useId();

  if (rows.length === 0) {
    return <p className="px-4 py-6 text-[13px] text-[var(--color-ink-2)]">Обращений к модели за период не было.</p>;
  }

  const width = 640;
  const height = 150;
  const padLeft = 44;
  const padRight = 12;
  const padTop = 14;
  const padBottom = 26;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const max = Math.max(...rows.map((r) => Number(r.cost_usd)), budgetPerDay ?? 0, 0.01);
  const step = plotW / rows.length;
  const barW = Math.max(3, Math.min(22, step - 4));

  const maxIndex = rows.reduce((best, row, i) => (Number(row.cost_usd) > Number(rows[best]?.cost_usd ?? 0) ? i : best), 0);
  const lastIndex = rows.length - 1;

  const ticks = [0, max / 2, max];

  return (
    <div className="px-4 pb-3 pt-2">
      <div className="relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-[150px] w-full"
          role="img"
          aria-label={`Расход на модель по суткам, ${rows.length} точек, максимум ${formatUsd(max, 4)}`}
        >
          <defs>
            <clipPath id={clipId}>
              <rect x={padLeft} y={padTop} width={plotW} height={plotH} />
            </clipPath>
          </defs>

          {/* Сетка приглушена: она ориентир, а не содержание. */}
          {ticks.map((tick) => {
            const y = padTop + plotH - (tick / max) * plotH;
            return (
              <g key={tick}>
                <line
                  x1={padLeft}
                  x2={width - padRight}
                  y1={y}
                  y2={y}
                  stroke="var(--color-line-2)"
                  strokeWidth={1}
                  shapeRendering="crispEdges"
                />
                <text x={padLeft - 6} y={y + 3} textAnchor="end" fontSize={10} fill="var(--color-ink-3)">
                  {tick === 0 ? '0' : `$${tick.toFixed(tick < 0.1 ? 3 : 2)}`}
                </text>
              </g>
            );
          })}

          {budgetPerDay ? (
            <g clipPath={`url(#${clipId})`}>
              <line
                x1={padLeft}
                x2={width - padRight}
                y1={padTop + plotH - (budgetPerDay / max) * plotH}
                y2={padTop + plotH - (budgetPerDay / max) * plotH}
                stroke="var(--color-warning)"
                strokeWidth={2}
                strokeDasharray="4 3"
              />
            </g>
          ) : null}

          {rows.map((row, index) => {
            const value = Number(row.cost_usd);
            const h = Math.max(value > 0 ? 2 : 0, (value / max) * plotH);
            const x = padLeft + index * step + (step - barW) / 2;
            const y = padTop + plotH - h;
            const active = hover === index;
            return (
              <g key={row.day}>
                <rect
                  x={x}
                  y={y}
                  width={barW}
                  height={h}
                  rx={Math.min(4, barW / 2)}
                  fill="var(--color-accent)"
                  opacity={hover === null || active ? 1 : 0.45}
                />
                {/* Область наведения шире столбца: попасть в тонкий столбец мышью трудно. */}
                <rect
                  x={padLeft + index * step}
                  y={padTop}
                  width={step}
                  height={plotH}
                  fill="transparent"
                  onMouseEnter={() => setHover(index)}
                  onMouseLeave={() => setHover(null)}
                />
                {index === maxIndex || index === lastIndex ? (
                  <text x={x + barW / 2} y={y - 4} textAnchor="middle" fontSize={10} fill="var(--color-ink-2)">
                    {`$${value.toFixed(3)}`}
                  </text>
                ) : null}
                {index % 3 === 0 || index === lastIndex ? (
                  <text
                    x={x + barW / 2}
                    y={height - 8}
                    textAnchor="middle"
                    fontSize={10}
                    fill="var(--color-ink-3)"
                  >
                    {row.day.slice(8, 10)}.{row.day.slice(5, 7)}
                  </text>
                ) : null}
              </g>
            );
          })}

          <line
            x1={padLeft}
            x2={width - padRight}
            y1={padTop + plotH}
            y2={padTop + plotH}
            stroke="var(--color-line)"
            strokeWidth={1}
            shapeRendering="crispEdges"
          />
        </svg>

        {hover !== null && rows[hover] ? (
          <div
            className="pointer-events-none absolute top-0 rounded-md border border-[var(--color-line)] bg-[var(--color-card)] px-2 py-1 text-[12px] shadow-md"
            style={{ left: `${((hover + 0.5) / rows.length) * 100}%`, transform: 'translateX(-50%)' }}
          >
            <p className="font-semibold">{formatDate(rows[hover]?.day)}</p>
            <p className="tabular text-[var(--color-ink-2)]">
              {formatUsd(Number(rows[hover]?.cost_usd), 4)} · вызовов {formatNumber(rows[hover]?.calls ?? 0)}
            </p>
          </div>
        ) : null}
      </div>

      {budgetPerDay ? (
        <p className="mt-1 text-[11.5px] text-[var(--color-ink-3)]">
          Пунктир — предел месячного бюджета, разложенный на сутки: {formatUsd(budgetPerDay, 3)} в день.
        </p>
      ) : null}

      {/* Табличный вид обязателен: график читается не всеми и не всегда. */}
      <details className="mt-2">
        <summary className="cursor-pointer text-[12px] text-[var(--color-accent-ink)]">Показать числами</summary>
        <div className="thin-scroll mt-1 max-h-48 overflow-auto">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="text-left text-[var(--color-ink-3)]">
                <th className="py-1 pr-3 font-medium">Дата</th>
                <th className="py-1 pr-3 text-right font-medium">Расход</th>
                <th className="py-1 pr-3 text-right font-medium">Вызовов</th>
                <th className="py-1 text-right font-medium">Токенов на входе</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.day} className="border-t border-[var(--color-line-2)]">
                  <td className="py-1 pr-3">{formatDate(row.day)}</td>
                  <td className="tabular py-1 pr-3 text-right">{formatUsd(Number(row.cost_usd), 4)}</td>
                  <td className="tabular py-1 pr-3 text-right">{formatNumber(row.calls)}</td>
                  <td className="tabular py-1 text-right">{formatNumber(row.tokens_in)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

/**
 * Мера использования бюджета. Не график: одно число и его отношение к пределу.
 * Цвет сопровождается подписью и процентом — состояние не передаётся цветом
 * в одиночку.
 */
export function BudgetMeter({
  spent,
  budget,
  usedPct,
}: {
  spent: number;
  budget: number;
  usedPct: number | null;
}) {
  const pct = usedPct ?? (budget > 0 ? (spent / budget) * 100 : 0);
  const clamped = Math.max(0, Math.min(100, pct));
  const state = clamped >= 90 ? 'critical' : clamped >= 70 ? 'warning' : 'success';
  const label = state === 'critical' ? 'предел близко' : state === 'warning' ? 'больше двух третей' : 'в пределах';
  const color =
    state === 'critical'
      ? 'var(--color-critical)'
      : state === 'warning'
        ? 'var(--color-warning)'
        : 'var(--color-success)';

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p className="tabular text-[20px] font-semibold">
          {formatUsd(spent, 2)} <span className="text-[13px] font-normal text-[var(--color-ink-3)]">из {formatUsd(budget, 2)}</span>
        </p>
        <p className="tabular text-[13px] font-semibold" style={{ color }}>
          {clamped.toFixed(1).replace('.', ',')} % · {label}
        </p>
      </div>
      <div
        role="meter"
        aria-valuenow={Math.round(clamped)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Использование месячного бюджета на модель"
        className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-[var(--color-line-2)]"
      >
        <div className="h-full rounded-full" style={{ width: `${clamped}%`, background: color }} />
      </div>
    </div>
  );
}
