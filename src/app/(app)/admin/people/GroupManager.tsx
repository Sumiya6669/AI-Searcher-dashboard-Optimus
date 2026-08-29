'use client';

import { Layers, Trash2 } from 'lucide-react';
import { useActionState, useMemo, useState } from 'react';

import { deleteGroup, saveGroup, type ActionState } from './actions';
import { Checkbox, Field, FormNotice, Select, TextArea, TextInput } from '@/components/domain/Field';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHead } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/States';
import { TableWrap, Td, Th, Tr } from '@/components/ui/Table';
import { SEVERITY_OPTIONS } from '@/lib/domain';
import { formatNumber } from '@/lib/format';
import type { AccessGroupRow, AdminUserRow, EntityOptionRow, RecipientRow } from '@/lib/types';

const IDLE: ActionState = { status: 'idle' };

const TYPE_LABEL: Record<string, string> = {
  brand: 'Бренды',
  competitor: 'Конкуренты',
  supplier: 'Поставщики',
  topic: 'Направления',
  product: 'Продукты',
  company: 'Компании',
};

function slug(value: string): string {
  const map: Record<string, string> = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'i',
    к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f',
    х: 'h', ц: 'c', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
  };
  return value
    .toLowerCase()
    .split('')
    .map((ch) => map[ch] ?? ch)
    .join('')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40);
}

function EntityPicker({ options, selected }: { options: EntityOptionRow[]; selected: number[] }) {
  const [query, setQuery] = useState('');
  const grouped = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = needle
      ? options.filter((o) => o.canonical_name.toLowerCase().includes(needle))
      : options;
    const byType = new Map<string, EntityOptionRow[]>();
    for (const option of filtered) {
      const list = byType.get(option.entity_type) ?? [];
      list.push(option);
      byType.set(option.entity_type, list);
    }
    return [...byType.entries()];
  }, [options, query]);

  return (
    <div className="rounded-lg border border-[var(--color-line)]">
      <div className="border-b border-[var(--color-line-2)] p-2">
        <TextInput
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Найти бренд или направление"
          aria-label="Поиск по справочнику"
        />
      </div>
      <div className="thin-scroll max-h-64 space-y-3 overflow-y-auto p-3">
        {grouped.length === 0 ? (
          <p className="py-4 text-center text-[12.5px] text-[var(--color-ink-3)]">Ничего не нашлось.</p>
        ) : (
          grouped.map(([type, items]) => (
            <div key={type}>
              <p className="eyebrow mb-1.5">{TYPE_LABEL[type] ?? type}</p>
              <div className="grid gap-x-4 gap-y-1.5 sm:grid-cols-2">
                {items.map((option) => (
                  <label key={option.id} className="flex items-center gap-2 text-[13px]">
                    <input
                      type="checkbox"
                      name="entity_ids"
                      value={option.id}
                      defaultChecked={selected.includes(option.id)}
                      className="size-4 shrink-0 accent-[var(--color-accent)]"
                    />
                    <span className="min-w-0 truncate">{option.canonical_name}</span>
                    <span className="tabular ml-auto shrink-0 text-[11.5px] text-[var(--color-ink-3)]">
                      {option.events_30d > 0 ? `${formatNumber(option.events_30d)} за 30 дн` : '—'}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function GroupForm({
  group,
  options,
  users,
  recipients,
  onDone,
}: {
  group: AccessGroupRow | null;
  options: EntityOptionRow[];
  users: AdminUserRow[];
  recipients: RecipientRow[];
  onDone?: () => void;
}) {
  const [state, action, pending] = useActionState(saveGroup, IDLE);
  const [name, setName] = useState(group?.name ?? '');
  const [code, setCode] = useState(group?.code ?? '');
  const [codeTouched, setCodeTouched] = useState(Boolean(group));

  if (state.status === 'saved' && onDone) {
    // Форма отработала — список выше уже перечитан revalidatePath.
    queueMicrotask(onDone);
  }

  return (
    <form action={action} className="space-y-4">
      {group ? <input type="hidden" name="id" value={group.id} /> : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Название">
          <TextInput
            name="name"
            required
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!codeTouched) setCode(slug(e.target.value));
            }}
            placeholder="Тиккурила"
          />
        </Field>
        <Field label="Код" hint="Латиницей. По нему группу находят сценарии рассылки.">
          <TextInput
            name="code"
            required
            value={code}
            onChange={(e) => {
              setCodeTouched(true);
              setCode(slug(e.target.value));
            }}
            placeholder="tikkurila"
          />
        </Field>
      </div>

      <Field label="Пояснение" hint="Зачем группа нужна — чтобы через полгода не гадать.">
        <TextArea name="description" defaultValue={group?.description ?? ''} />
      </Field>

      <div>
        <p className="mb-1.5 text-[12.5px] font-medium text-[var(--color-ink-2)]">Бренды и направления группы</p>
        <EntityPicker options={options} selected={group?.entity_ids ?? []} />
      </div>

      <div>
        <p className="mb-1.5 text-[12.5px] font-medium text-[var(--color-ink-2)]">Участники</p>
        {users.length === 0 ? (
          <p className="text-[12.5px] text-[var(--color-ink-3)]">Пользователей пока нет.</p>
        ) : (
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {users.map((user) => (
              <label key={user.user_id} className="flex items-center gap-2 text-[13px]">
                <input
                  type="checkbox"
                  name="member_ids"
                  value={user.user_id}
                  defaultChecked={group?.member_ids?.includes(user.user_id) ?? false}
                  className="size-4 accent-[var(--color-accent)]"
                />
                <span>{user.full_name ?? user.email}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          label="Порог важности для рассылки"
          hint="Ниже этого уровня события в Telegram по группе не уходят."
        >
          <Select name="min_importance" defaultValue={String(group?.min_importance ?? 3)}>
            {SEVERITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Адресат в Telegram" hint="Получатель заводится формой в n8n — там же берётся его чат.">
          <Select name="recipient_id" defaultValue={group?.recipient_id ? String(group.recipient_id) : ''}>
            <option value="">не привязан</option>
            {recipients.map((recipient) => (
              <option key={recipient.id} value={recipient.id}>
                {recipient.name}
                {recipient.role ? ` — ${recipient.role}` : ''}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="space-y-2 rounded-lg bg-[var(--color-raise)] p-3">
        <Checkbox name="is_active" defaultChecked={group?.is_active ?? true} label="Группа действует" />
        <Checkbox
          name="restrict_view"
          defaultChecked={group?.restrict_view ?? false}
          label="Ограничивать просмотр, а не только рассылку"
          hint="Участник будет видеть в разделах только события и лоты по брендам этой группы. Отбор выполняет база, обойти его через адрес страницы нельзя. Если человек состоит хотя бы в одной неограниченной группе, он видит всё."
        />
      </div>

      <FormNotice status={state.status} message={state.message} />

      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? 'Сохраняю…' : group ? 'Сохранить группу' : 'Создать группу'}
        </Button>
        {onDone ? (
          <Button type="button" onClick={onDone}>
            Отмена
          </Button>
        ) : null}
      </div>
    </form>
  );
}

function DeleteGroupButton({ group }: { group: AccessGroupRow }) {
  const [state, action, pending] = useActionState(deleteGroup, IDLE);
  const [confirm, setConfirm] = useState(false);

  return (
    <form action={action} className="inline">
      <input type="hidden" name="id" value={group.id} />
      {confirm ? (
        <span className="inline-flex items-center gap-1.5">
          <Button type="submit" variant="danger" size="sm" disabled={pending}>
            {pending ? 'Удаляю…' : 'Точно удалить'}
          </Button>
          <Button type="button" size="sm" onClick={() => setConfirm(false)}>
            Отмена
          </Button>
        </span>
      ) : (
        <Button type="button" variant="ghost" size="sm" onClick={() => setConfirm(true)} aria-label="Удалить группу">
          <Trash2 size={13} strokeWidth={1.9} />
        </Button>
      )}
      {state.status === 'error' ? (
        <span className="ml-2 text-[12px] text-[var(--color-critical)]">{state.message}</span>
      ) : null}
    </form>
  );
}

export function GroupManager({
  groups,
  options,
  users,
  recipients,
}: {
  groups: AccessGroupRow[];
  options: EntityOptionRow[];
  users: AdminUserRow[];
  recipients: RecipientRow[];
}) {
  const [editing, setEditing] = useState<number | 'new' | null>(null);

  return (
    <div className="space-y-4">
      <Card>
        <CardHead
          title="Группы доступа"
          hint="что человеку присылать и, при желании, что ему показывать"
          actions={
            <Button size="sm" variant="primary" onClick={() => setEditing(editing === 'new' ? null : 'new')}>
              <Layers size={13} strokeWidth={1.9} />
              Новая группа
            </Button>
          }
        />

        {editing === 'new' ? (
          <CardBody className="border-b border-[var(--color-line-2)] bg-[var(--color-raise)]">
            <GroupForm
              group={null}
              options={options}
              users={users}
              recipients={recipients}
              onDone={() => setEditing(null)}
            />
          </CardBody>
        ) : null}

        {groups.length === 0 ? (
          <EmptyState
            title="Групп пока нет"
            hint="Группа связывает человека с брендами: по ней решается, что ему присылать."
          />
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <Th>Группа</Th>
                <Th>Бренды и направления</Th>
                <Th numeric>Участников</Th>
                <Th numeric>Событий за 30 дней</Th>
                <Th>Просмотр</Th>
                <Th><span className="sr-only">Действия</span></Th>
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => (
                <Tr key={group.id}>
                  <Td>
                    <span className="block font-medium text-[var(--color-ink)]">{group.name}</span>
                    <span className="block text-[12px] text-[var(--color-ink-3)]">
                      {group.code}
                      {group.is_active ? '' : ' · не действует'}
                    </span>
                  </Td>
                  <Td className="max-w-72 text-[var(--color-ink-2)]">
                    {group.entity_names || <span className="text-[var(--color-warning)]">ни одного не выбрано</span>}
                  </Td>
                  <Td numeric>{formatNumber(group.members_count)}</Td>
                  <Td numeric>{formatNumber(group.events_30d)}</Td>
                  <Td>
                    <Badge tone={group.restrict_view ? 'warning' : 'neutral'}>
                      {group.restrict_view ? 'ограничен' : 'полный'}
                    </Badge>
                  </Td>
                  <Td>
                    <span className="flex items-center justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        aria-expanded={editing === group.id}
                        onClick={() => setEditing(editing === group.id ? null : group.id)}
                      >
                        {editing === group.id ? 'Свернуть' : 'Изменить'}
                      </Button>
                      <DeleteGroupButton group={group} />
                    </span>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Card>

      {typeof editing === 'number' ? (
        <Card>
          <CardHead title={`Группа «${groups.find((g) => g.id === editing)?.name ?? ''}»`} />
          <CardBody>
            <GroupForm
              group={groups.find((g) => g.id === editing) ?? null}
              options={options}
              users={users}
              recipients={recipients}
              onDone={() => setEditing(null)}
            />
          </CardBody>
        </Card>
      ) : null}
    </div>
  );
}
