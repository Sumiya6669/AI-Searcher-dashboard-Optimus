import { ExternalLink } from 'lucide-react';
import type { Metadata } from 'next';
import { Suspense } from 'react';

import { RunStatusBadge } from '@/components/domain/Badges';
import { KpiRow } from '@/components/domain/KpiCard';
import { BudgetMeter, SpendChart } from '@/components/domain/SpendChart';
import { Badge } from '@/components/ui/Badge';
import { Card, CardBody, CardHead, DefinitionList, PageHeader } from '@/components/ui/Card';
import { EmptyState, ErrorState, KpiSkeleton, LoadingSkeleton } from '@/components/ui/States';
import { TableWrap, Td, Th, Tr } from '@/components/ui/Table';
import { formatDateTime, formatDuration, formatNumber, formatPercent, formatRelative, truncate } from '@/lib/format';
import { requireAdmin } from '@/server/auth';
import {
  fetchAdminHealth,
  fetchDeliveryState,
  fetchFailedRuns,
  fetchLlmDaily,
  fetchThresholds,
  fetchWorkflowHealth,
} from '@/server/queries/admin';
import { n8nBaseUrl } from '@/server/supabase/server';

export const metadata: Metadata = { title: 'Состояние системы' };
export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  await requireAdmin();

  return (
    <>
      <PageHeader title="Состояние системы" subtitle="Служебный раздел: запуски, отказы, расход, доставка" />

      <div className="space-y-4">
        <Suspense fallback={<KpiSkeleton count={4} />}>
          <HealthBlock />
        </Suspense>

        <div className="grid min-w-0 gap-4 xl:grid-cols-2">
          <Suspense fallback={<Card><LoadingSkeleton rows={6} /></Card>}>
            <WorkflowBlock />
          </Suspense>
          <Suspense fallback={<Card><LoadingSkeleton rows={6} /></Card>}>
            <SpendBlock />
          </Suspense>
        </div>

        <Suspense fallback={<Card><LoadingSkeleton rows={8} /></Card>}>
          <FailedBlock />
        </Suspense>

        <div className="grid min-w-0 gap-4 xl:grid-cols-2">
          <Suspense fallback={<Card><LoadingSkeleton rows={4} /></Card>}>
            <DeliveryBlock />
          </Suspense>
          <Suspense fallback={<Card><LoadingSkeleton rows={6} /></Card>}>
            <ThresholdBlock />
          </Suspense>
        </div>
      </div>
    </>
  );
}

async function HealthBlock() {
  const result = await fetchAdminHealth();
  if (!result.ok) {
    return (
      <Card>
        <ErrorState message={result.error} retryHref="/admin" />
      </Card>
    );
  }
  const h = result.data;

  // Проценты не сравниваются с нормой на малых числах: отсев 88 % от восьми
  // материалов — арифметика, а не отклонение. Порог объёма — из документа.
  const volumeEnough = h.collected_24h >= 30;

  return (
    <div className="space-y-4">
      <KpiRow
        items={[
          {
            label: 'Запусков за сутки',
            value: formatNumber(h.runs_total_24h),
            hint: `успешных ${formatNumber(h.runs_ok_24h)}, отказов ${formatNumber(h.runs_failed_24h)}`,
            tone: h.runs_failed_24h > 0 ? 'warning' : 'neutral',
          },
          {
            label: 'Успешность',
            value: formatPercent(h.success_rate_pct, 1),
            hint: `среднее время ${formatDuration(h.avg_duration_ms)}`,
            tone:
              h.success_rate_pct === null ? 'neutral' : h.success_rate_pct >= 90 ? 'success' : h.success_rate_pct >= 75 ? 'warning' : 'critical',
          },
          {
            label: 'Очередь необработанного',
            value: formatNumber(h.queue_new),
            hint: 'материалов ждёт разбора',
            tone: h.queue_new > 50 ? 'warning' : 'success',
          },
          {
            label: 'Расход на модель',
            value: `$${h.spent_month_usd.toFixed(2)}`,
            hint: `за месяц из $${h.budget_month_usd.toFixed(2)}`,
            tone: (h.budget_used_pct ?? 0) >= 90 ? 'critical' : (h.budget_used_pct ?? 0) >= 70 ? 'warning' : 'success',
          },
        ]}
      />

      <div className="grid min-w-0 gap-4 lg:grid-cols-3">
        <Card>
          <CardHead title="Поток за сутки" as="h3" />
          <CardBody>
            <DefinitionList
              items={[
                { term: 'Собрано материалов', value: formatNumber(h.collected_24h) },
                { term: 'Классифицировано', value: formatNumber(h.classified_24h) },
                {
                  term: 'Дедупликация',
                  value: volumeEnough ? (
                    formatPercent(h.dedup_share_pct, 1)
                  ) : (
                    <span>
                      {formatPercent(h.dedup_share_pct, 1)}{' '}
                      <span className="text-[12px] text-[var(--color-ink-3)]">
                        — объём мал, с нормой не сравнивается
                      </span>
                    </span>
                  ),
                },
                {
                  term: 'Отсев до модели',
                  value: volumeEnough ? (
                    formatPercent(h.filter_share_pct, 1)
                  ) : (
                    <span>
                      {formatPercent(h.filter_share_pct, 1)}{' '}
                      <span className="text-[12px] text-[var(--color-ink-3)]">— объём мал</span>
                    </span>
                  ),
                },
                { term: 'Событий важности 4–5', value: formatNumber(h.events_high_24h) },
              ]}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHead title="Накоплено" as="h3" />
          <CardBody>
            <DefinitionList
              items={[
                { term: 'События', value: formatNumber(h.events_total) },
                { term: 'Словарь', value: `${formatNumber(h.dict_entities)} сущностей` },
                {
                  term: 'Страниц на обходе',
                  value: `${formatNumber(h.pages_active)}, падают подряд ${formatNumber(h.pages_failing)}`,
                },
                { term: 'Сводок сформировано', value: formatNumber(h.digests_total) },
                { term: 'Последняя сводка', value: formatDateTime(h.last_digest_at) },
              ]}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHead title="Резервная копия" as="h3" />
          <CardBody className="space-y-2">
            <p className="text-[14px]">
              {h.last_backup_at ? (
                <>
                  <Badge tone="success">есть</Badge>{' '}
                  <span className="text-[var(--color-ink-2)]">
                    {formatDateTime(h.last_backup_at)}, {formatRelative(h.last_backup_at)}
                  </span>
                </>
              ) : (
                <Badge tone="critical">копий не найдено</Badge>
              )}
            </p>
            <p className="text-[12.5px] text-[var(--color-ink-2)]">
              Каждая копия проверяется учением по восстановлению: данные разворачиваются в отдельную схему со сверкой
              числа строк по каждой таблице. Непроверенных копий система не создаёт.
            </p>
            {h.runs_running > 0 ? (
              <p className="text-[12.5px] text-[var(--color-ink-2)]">
                Сейчас выполняется запусков: {formatNumber(h.runs_running)}.
              </p>
            ) : null}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

async function WorkflowBlock() {
  const result = await fetchWorkflowHealth(24);
  if (!result.ok) {
    return (
      <Card>
        <CardHead title="Сценарии за сутки" />
        <ErrorState message={result.error} retryHref="/admin" />
      </Card>
    );
  }

  return (
    <Card>
      <CardHead title="Сценарии за сутки" hint="порядок по числу отказов" />
      {result.data.length === 0 ? (
        <EmptyState title="Запусков за сутки не было" />
      ) : (
        <TableWrap>
          <thead>
            <tr>
              <Th>Сценарий</Th>
              <Th numeric>Всего</Th>
              <Th numeric>Успешно</Th>
              <Th numeric>Отказы</Th>
              <Th numeric>Среднее</Th>
              <Th>Последний и ожидаемый</Th>
            </tr>
          </thead>
          <tbody>
            {result.data.map((row) => (
              <Tr key={row.workflow_code}>
                <Td>
                  <span className="font-medium">{row.workflow_code}</span>
                  <span className="block text-[11.5px] text-[var(--color-ink-3)]">{row.workflow_name ?? ''}</span>
                </Td>
                <Td numeric>{formatNumber(row.runs_total)}</Td>
                <Td numeric>{formatPercent(row.success_rate, 0)}</Td>
                <Td numeric className={row.runs_failed > 0 ? 'text-[var(--color-critical)]' : undefined}>
                  {formatNumber(row.runs_failed)}
                  {row.runs_partial > 0 ? (
                    <span className="block text-[11.5px] font-normal text-[var(--color-attention)]">
                      частично {row.runs_partial}
                    </span>
                  ) : null}
                </Td>
                <Td numeric>{formatDuration(row.avg_duration_ms)}</Td>
                <Td className="whitespace-nowrap">
                  <RunStatusBadge status={row.last_status} />
                  <span className="mt-0.5 block text-[11.5px] text-[var(--color-ink-3)]">
                    {formatRelative(row.last_run_at)}
                  </span>
                  <span className="block text-[11.5px] text-[var(--color-ink-3)]">
                    {row.next_expected_at ? `ожидается ${formatDateTime(row.next_expected_at)}` : 'ритм не определён'}
                  </span>
                </Td>
              </Tr>
            ))}
          </tbody>
        </TableWrap>
      )}
      <CardBody className="border-t border-[var(--color-line-2)] text-[12px] text-[var(--color-ink-3)]">
        Ожидаемое следующее выполнение считается по фактическому среднему промежутку между запусками. Расписание живёт
        в n8n; дублировать его здесь означало бы получить два расходящихся источника правды.
      </CardBody>
    </Card>
  );
}

async function SpendBlock() {
  const [health, daily] = await Promise.all([fetchAdminHealth(), fetchLlmDaily(14)]);
  if (!health.ok || !daily.ok) {
    return (
      <Card>
        <CardHead title="Расход на модель" />
        <ErrorState message={health.ok ? (daily.ok ? '' : daily.error) : health.error} retryHref="/admin" />
      </Card>
    );
  }
  const h = health.data;
  const perDay = h.budget_month_usd > 0 ? h.budget_month_usd / 30 : null;

  return (
    <Card>
      <CardHead title="Расход на модель" hint="по суткам за 14 дней" />
      <CardBody className="pb-0">
        <BudgetMeter spent={h.spent_month_usd} budget={h.budget_month_usd} usedPct={h.budget_used_pct} />
      </CardBody>
      <SpendChart rows={daily.data} budgetPerDay={perDay} />
      <CardBody className="border-t border-[var(--color-line-2)]">
        <DefinitionList
          items={[
            { term: 'За сутки', value: `$${h.spent_today_usd.toFixed(4)}` },
            { term: 'За всё время', value: `$${h.spent_total_usd.toFixed(4)}` },
            { term: 'Обращений за месяц', value: formatNumber(h.llm_calls_month) },
            {
              term: 'Средняя цена обращения',
              value:
                h.llm_calls_month > 0 ? `$${(h.spent_month_usd / h.llm_calls_month).toFixed(5)}` : '—',
            },
            {
              term: 'Токенов за месяц',
              value: `на входе ${formatNumber(h.tokens_in_month)}, на выходе ${formatNumber(h.tokens_out_month)}`,
            },
          ]}
        />
      </CardBody>
    </Card>
  );
}

async function FailedBlock() {
  const result = await fetchFailedRuns(20);
  const base = n8nBaseUrl();

  if (!result.ok) {
    return (
      <Card>
        <CardHead title="Последние отказы и частичные запуски" />
        <ErrorState message={result.error} retryHref="/admin" />
      </Card>
    );
  }

  return (
    <Card>
      <CardHead title="Последние отказы и частичные запуски" hint="двадцать записей" />
      {result.data.length === 0 ? (
        <EmptyState title="Отказов нет" hint="За доступный период все запуски завершились успешно." />
      ) : (
        <TableWrap>
          <thead>
            <tr>
              <Th>Время</Th>
              <Th>Сценарий</Th>
              <Th>Статус</Th>
              <Th numeric>Длительность</Th>
              <Th numeric>Вход / выход</Th>
              <Th>Ошибка</Th>
              <Th>Выполнение</Th>
            </tr>
          </thead>
          <tbody>
            {result.data.map((run) => (
              <Tr key={run.id}>
                <Td className="whitespace-nowrap text-[var(--color-ink-2)]">{formatDateTime(run.started_at)}</Td>
                <Td className="whitespace-nowrap">
                  <span className="font-medium">{run.workflow_code}</span>
                  <span className="block text-[11.5px] text-[var(--color-ink-3)]">{run.workflow_name ?? ''}</span>
                </Td>
                <Td>
                  <RunStatusBadge status={run.status} />
                </Td>
                <Td numeric>{formatDuration(run.duration_ms)}</Td>
                <Td numeric>
                  {formatNumber(run.items_in ?? 0)} / {formatNumber(run.items_out ?? 0)}
                </Td>
                <Td className="max-w-md text-[12.5px] text-[var(--color-ink-2)]">
                  {run.error_text ? truncate(run.error_text, 220) : '—'}
                </Td>
                <Td>
                  {base && run.execution_id ? (
                    <a
                      href={`${base.replace(/\/+$/, '')}/executions/${run.execution_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 whitespace-nowrap text-[12.5px] text-[var(--color-accent-ink)] hover:underline"
                    >
                      Открыть
                      <ExternalLink size={11} />
                    </a>
                  ) : (
                    <span className="text-[12.5px] text-[var(--color-ink-3)]">—</span>
                  )}
                </Td>
              </Tr>
            ))}
          </tbody>
        </TableWrap>
      )}
    </Card>
  );
}

async function DeliveryBlock() {
  const result = await fetchDeliveryState();
  if (!result.ok) {
    return (
      <Card>
        <CardHead title="Доставка в Telegram" />
        <ErrorState message={result.error} retryHref="/admin" />
      </Card>
    );
  }

  const KIND_LABEL: Record<string, string> = {
    instant: 'немедленные уведомления',
    daily: 'суточные сводки',
    weekly: 'недельные сводки',
    tender: 'оповещения о закупках',
  };

  return (
    <Card>
      <CardHead title="Доставка в Telegram" hint="состояние существующей интеграции" />
      {result.data.length === 0 ? (
        <EmptyState title="Доставок не было" />
      ) : (
        <TableWrap>
          <thead>
            <tr>
              <Th>Вид</Th>
              <Th numeric>Всего</Th>
              <Th numeric>За 30 дней</Th>
              <Th numeric>Неудач</Th>
              <Th>Последняя</Th>
            </tr>
          </thead>
          <tbody>
            {result.data.map((row) => (
              <Tr key={row.kind}>
                <Td>{KIND_LABEL[row.kind] ?? row.kind}</Td>
                <Td numeric>{formatNumber(row.sent_total)}</Td>
                <Td numeric>{formatNumber(row.sent_30d)}</Td>
                <Td numeric className={row.failed_30d > 0 ? 'text-[var(--color-critical)]' : undefined}>
                  {formatNumber(row.failed_30d)}
                </Td>
                <Td className="whitespace-nowrap text-[var(--color-ink-2)]">{formatDateTime(row.last_sent_at)}</Td>
              </Tr>
            ))}
          </tbody>
        </TableWrap>
      )}
      <CardBody className="border-t border-[var(--color-line-2)] text-[12px] text-[var(--color-ink-3)]">
        Дашборд не отправляет сообщения сам. Рассылку выполняют сценарии n8n; здесь видно только её состояние.
      </CardBody>
    </Card>
  );
}

async function ThresholdBlock() {
  const result = await fetchThresholds();
  if (!result.ok) {
    return (
      <Card>
        <CardHead title="Пороги и правила" />
        <ErrorState message={result.error} retryHref="/admin" />
      </Card>
    );
  }

  return (
    <Card>
      <CardHead title="Пороги и правила" hint="значения из настроек базы, только чтение" />
      <TableWrap>
        <thead>
          <tr>
            <Th>Настройка</Th>
            <Th numeric>Значение</Th>
            <Th>Что задаёт</Th>
          </tr>
        </thead>
        <tbody>
          {result.data.map((row) => (
            <Tr key={row.key}>
              <Td className="whitespace-nowrap font-mono text-[12px]">{row.key}</Td>
              <Td numeric>{row.value ?? '—'}</Td>
              <Td className="max-w-sm text-[12.5px] text-[var(--color-ink-2)]">{row.description ?? '—'}</Td>
            </Tr>
          ))}
        </tbody>
      </TableWrap>
      <CardBody className="border-t border-[var(--color-line-2)] text-[12px] text-[var(--color-ink-3)]">
        Ключи и токены в этот перечень не попадают: отбор идёт по белому списку имён, а не исключением по шаблону.
      </CardBody>
    </Card>
  );
}
