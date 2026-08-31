'use client';

import { ExternalLink } from 'lucide-react';
import { useActionState, useMemo, useState } from 'react';

import { saveCatalogState, type ActionState } from './actions';
import { Field, FormNotice, Select, TextArea, TextInput } from '@/components/domain/Field';
import { Badge } from '@/components/ui/Badge';
import { Card, CardBody, CardHead } from '@/components/ui/Card';
import { CATALOG, CATALOG_KINDS, firstUrl, priorityLabel, type CatalogEntry } from '@/lib/catalog';
import { cn } from '@/lib/cn';
import type { Tone } from '@/lib/domain';
import type { CatalogStateRow, CatalogStatus, SourceOptionRow } from '@/lib/types';

const STATUS_LABEL: Record<CatalogStatus, string> = {
  not_connected: 'не подключён',
  in_progress: 'в работе',
  connected: 'подключён',
  rejected: 'отклонён',
};

const STATUS_TONE: Record<CatalogStatus, Tone> = {
  not_connected: 'neutral',
  in_progress: 'attention',
  connected: 'success',
  rejected: 'critical',
};

// Очередь подключения — не тревога. Красный и жёлтый на двухсотстрочном списке
// читались бы как «двести проблем», хотя это просто порядок работ.
const PRIORITY_TONE: Record<number, Tone> = { 1: 'accent', 2: 'neutral', 3: 'neutral' };

const initial: ActionState = { status: 'idle' };

export function CatalogTable({
  states,
  sources,
}: {
  states: CatalogStateRow[];
  sources: SourceOptionRow[];
}) {
  const [query, setQuery] = useState('');
  const [priority, setPriority] = useState('1');
  const [status, setStatus] = useState('all');
  const [kind, setKind] = useState('all');
  const [openOrd, setOpenOrd] = useState<number | null>(null);

  const stateByOrd = useMemo(() => {
    const map = new Map<number, CatalogStateRow>();
    for (const row of states) map.set(row.ord, row);
    return map;
  }, [states]);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return CATALOG.filter((entry) => {
      if (priority !== 'all' && String(entry.priority) !== priority) return false;
      if (kind !== 'all' && entry.kind !== kind) return false;
      const current = stateByOrd.get(entry.ord)?.status ?? 'not_connected';
      if (status !== 'all' && current !== status) return false;
      if (!needle) return true;
      return (
        entry.name.toLowerCase().includes(needle) ||
        entry.kind.toLowerCase().includes(needle) ||
        entry.region.toLowerCase().includes(needle) ||
        entry.industries.toLowerCase().includes(needle) ||
        entry.link.toLowerCase().includes(needle)
      );
    });
  }, [query, priority, status, kind, stateByOrd]);

  const counts = useMemo(() => {
    const done = states.filter((row) => row.status === 'connected').length;
    const work = states.filter((row) => row.status === 'in_progress').length;
    const no = states.filter((row) => row.status === 'rejected').length;
    return { done, work, no, total: CATALOG.length };
  }, [states]);

  return (
    <Card>
      <CardHead
        title="Каталог источников"
        hint={`всего ${counts.total} · подключено ${counts.done} · в работе ${counts.work} · отклонено ${counts.no}`}
      />
      <CardBody className="border-b border-[var(--color-line-2)] pb-3">
        <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
          <Field label="Поиск">
            <TextInput
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="название, регион, отрасль, адрес"
            />
          </Field>
          <Field label="Очередь" hint="в первую очередь — то, что даёт сигнал раньше конкурентов">
            <Select value={priority} onChange={(event) => setPriority(event.target.value)}>
              <option value="1">первая</option>
              <option value="2">вторая</option>
              <option value="3">третья</option>
              <option value="all">все</option>
            </Select>
          </Field>
          <Field label="Состояние">
            <Select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="all">любое</option>
              <option value="not_connected">не подключён</option>
              <option value="in_progress">в работе</option>
              <option value="connected">подключён</option>
              <option value="rejected">отклонён</option>
            </Select>
          </Field>
          <Field label="Тип источника">
            <Select value={kind} onChange={(event) => setKind(event.target.value)}>
              <option value="all">любой</option>
              {CATALOG_KINDS.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </CardBody>

      {rows.length === 0 ? (
        <p className="px-4 py-8 text-center text-[13px] text-[var(--color-ink-2)]">
          Под условия отбора не попал ни один источник.
        </p>
      ) : (
        <ul className="divide-y divide-[var(--color-line-2)]">
          {rows.map((entry) => (
            <CatalogRow
              key={entry.ord}
              entry={entry}
              state={stateByOrd.get(entry.ord) ?? null}
              sources={sources}
              open={openOrd === entry.ord}
              onToggle={() => setOpenOrd(openOrd === entry.ord ? null : entry.ord)}
            />
          ))}
        </ul>
      )}
      <p className="px-4 py-3 text-[11.5px] text-[var(--color-ink-3)]">
        Показано {rows.length} из {CATALOG.length}. Описание источников хранится вместе с приложением и
        не меняется из интерфейса — здесь ставится только решение по строке.
      </p>
    </Card>
  );
}

function CatalogRow({
  entry,
  state,
  sources,
  open,
  onToggle,
}: {
  entry: CatalogEntry;
  state: CatalogStateRow | null;
  sources: SourceOptionRow[];
  open: boolean;
  onToggle: () => void;
}) {
  const [result, action, pending] = useActionState(saveCatalogState, initial);
  const current: CatalogStatus = state?.status ?? 'not_connected';
  const url = firstUrl(entry.link);

  return (
    <li className={cn('px-4 py-3', open && 'bg-[var(--color-raise)]')}>
      {/* Номер и название держатся вместе, а значки на узком экране уходят на
          свою строку: иначе они отжимали заголовок до двух слов в столбик. */}
      <div className="flex flex-wrap items-start gap-x-3 gap-y-1.5">
        <span className="tabular mt-0.5 w-8 shrink-0 text-right text-[12px] text-[var(--color-ink-3)]">
          {entry.ord}
        </span>
        <div className="min-w-0 flex-1 basis-[calc(100%-2.75rem)] sm:basis-0">
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={open}
            className="text-left text-[14px] font-semibold leading-snug text-[var(--color-ink)] hover:text-[var(--color-accent-ink)]"
          >
            {entry.name}
          </button>
          <p className="mt-0.5 text-[12.5px] text-[var(--color-ink-3)]">
            {entry.kind}
            {entry.region ? ` · ${entry.region}` : ''}
            {entry.update_frequency ? ` · ${entry.update_frequency}` : ''}
          </p>
        </div>
        <span className="flex shrink-0 flex-wrap items-center gap-1.5 pl-11 sm:pl-0">
          <Badge tone={PRIORITY_TONE[entry.priority] ?? 'neutral'} title="Очередь подключения">
            {priorityLabel(entry.priority)}
          </Badge>
          <Badge tone={STATUS_TONE[current]}>{STATUS_LABEL[current]}</Badge>
          {state?.source_code ? <Badge tone="accent">{state.source_code}</Badge> : null}
        </span>
      </div>

      {open ? (
        <div className="mt-3 grid items-start gap-4 sm:pl-11 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <dl className="space-y-2 text-[13px]">
            <Line term="Что даёт" value={entry.what_you_get} />
            <Line term="Стадия проекта" value={entry.project_stage} />
            <Line term="Отрасли" value={entry.industries} />
            <Line term="Как собирать" value={entry.collection_method} />
            <Line term="Ограничения" value={entry.limitations} />
            <Line
              term="Оценки"
              value={`достоверность ${entry.reliability} из 5 · коммерческая польза ${entry.commercial_value} из 5`}
            />
            <Line
              term="Адрес"
              value={
                url ? (
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[var(--color-accent-ink)] hover:underline"
                  >
                    {entry.link}
                    <ExternalLink size={11} />
                  </a>
                ) : (
                  entry.link
                )
              }
            />
          </dl>

          <form action={action} className="space-y-2.5 rounded-lg border border-[var(--color-line)] bg-[var(--color-card)] p-3">
            <input type="hidden" name="ord" value={entry.ord} />
            <Field label="Решение по источнику">
              <Select name="status" defaultValue={current}>
                <option value="not_connected">не подключён</option>
                <option value="in_progress">в работе</option>
                <option value="connected">подключён</option>
                <option value="rejected">отклонён</option>
              </Select>
            </Field>
            <Field
              label="Связать с источником системы"
              hint="Если сбор уже настроен, выберите его — тогда состояние сбора видно на одной странице с решением."
            >
              <Select name="source_id" defaultValue={state?.source_id ? String(state.source_id) : ''}>
                <option value="">не связан</option>
                {sources.map((source) => (
                  <option key={source.id} value={source.id}>
                    {source.code} — {source.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field
              label="Примечание"
              hint="Причина отказа или что мешает подключить. Через месяц это единственное, что объяснит решение."
            >
              <TextArea name="note" defaultValue={state?.note ?? ''} maxLength={1000} />
            </Field>
            <FormNotice status={result.status} message={result.message} />
            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-lg bg-[var(--color-accent)] px-3 py-1.5 text-[13px] font-semibold text-white disabled:opacity-60"
            >
              {pending ? 'Сохраняю…' : 'Сохранить решение'}
            </button>
          </form>
        </div>
      ) : null}
    </li>
  );
}

function Line({ term, value }: { term: string; value: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-[minmax(120px,150px)_1fr]">
      <dt className="text-[var(--color-ink-3)]">{term}</dt>
      <dd className="text-[var(--color-ink)]">{value}</dd>
    </div>
  );
}
