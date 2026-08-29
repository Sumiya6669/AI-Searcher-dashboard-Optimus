'use client';

import { KeyRound, Trash2, UserPlus } from 'lucide-react';
import { Fragment, useActionState, useState } from 'react';

import { createUser, deleteUser, setPassword, updateUser, type ActionState } from './actions';
import { Checkbox, Field, FormNotice, Select, TextInput } from '@/components/domain/Field';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHead } from '@/components/ui/Card';
import { TableWrap, Td, Th, Tr } from '@/components/ui/Table';
import { formatRelative } from '@/lib/format';
import type { AccessGroupRow, AdminUserRow } from '@/lib/types';

const IDLE: ActionState = { status: 'idle' };

/**
 * Пароль задаёт администратор и передаёт человеку лично. Приглашение письмом
 * здесь не работает: почтовый сервер проекту не подключён, а молча показывать
 * кнопку, которая ничего не отправляет, — худший вид неработающей функции.
 */
function suggestPassword(): string {
  const alphabet = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = new Uint32Array(16);
  crypto.getRandomValues(bytes);
  let out = '';
  for (const byte of bytes) out += alphabet[byte % alphabet.length];
  return out;
}

function GroupPicker({ groups, selected }: { groups: AccessGroupRow[]; selected: number[] }) {
  if (groups.length === 0) {
    return (
      <p className="text-[12.5px] text-[var(--color-ink-3)]">
        Групп пока нет. Заведите группу ниже — тогда её можно будет назначить.
      </p>
    );
  }
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2">
      {groups.map((group) => (
        <label key={group.id} className="flex items-center gap-2 text-[13px]">
          <input
            type="checkbox"
            name="group_ids"
            value={group.id}
            defaultChecked={selected.includes(group.id)}
            className="size-4 accent-[var(--color-accent)]"
          />
          <span>{group.name}</span>
          {group.restrict_view ? (
            <Badge tone="warning" title="Эта группа ограничивает и просмотр разделов">
              просмотр ограничен
            </Badge>
          ) : null}
        </label>
      ))}
    </div>
  );
}

function CreateUserForm({ groups }: { groups: AccessGroupRow[] }) {
  const [state, action, pending] = useActionState(createUser, IDLE);
  const [password, setPasswordValue] = useState('');

  return (
    <form action={action} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Адрес электронной почты">
          <TextInput name="email" type="email" required autoComplete="off" placeholder="имя@optimus-kz.kz" />
        </Field>
        <Field label="Имя и фамилия">
          <TextInput name="full_name" autoComplete="off" placeholder="Марат Серик" />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <Field label="Пароль" hint="Не короче десяти знаков. Передайте его человеку лично.">
          <TextInput
            name="password"
            required
            minLength={10}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPasswordValue(e.target.value)}
          />
        </Field>
        <div className="flex items-end">
          <Button type="button" onClick={() => setPasswordValue(suggestPassword())}>
            <KeyRound size={14} strokeWidth={1.9} />
            Придумать
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Роль" hint="Администратор видит служебные разделы и управляет доступом.">
          <Select name="role" defaultValue="user">
            <option value="user">Пользователь</option>
            <option value="admin">Администратор</option>
          </Select>
        </Field>
        <div className="flex items-end pb-1">
          <Checkbox
            name="is_active"
            defaultChecked
            label="Доступ выдан"
            hint="Без этого человек войдёт, но не увидит ни одной строки."
          />
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-[12.5px] font-medium text-[var(--color-ink-2)]">Группы</p>
        <GroupPicker groups={groups} selected={[]} />
      </div>

      <FormNotice status={state.status} message={state.message} />

      <Button type="submit" variant="primary" disabled={pending}>
        <UserPlus size={14} strokeWidth={1.9} />
        {pending ? 'Завожу…' : 'Завести пользователя'}
      </Button>
    </form>
  );
}

function EditUserForm({ user, groups }: { user: AdminUserRow; groups: AccessGroupRow[] }) {
  const [state, action, pending] = useActionState(updateUser, IDLE);
  const [pwState, pwAction, pwPending] = useActionState(setPassword, IDLE);
  const [delState, delAction, delPending] = useActionState(deleteUser, IDLE);
  const [newPassword, setNewPassword] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="space-y-4 border-t border-[var(--color-line-2)] bg-[var(--color-raise)] px-4 py-4">
      <form action={action} className="space-y-3">
        <input type="hidden" name="user_id" value={user.user_id} />
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Имя и фамилия">
            <TextInput name="full_name" defaultValue={user.full_name ?? ''} />
          </Field>
          <Field label="Роль">
            <Select name="role" defaultValue={user.role}>
              <option value="user">Пользователь</option>
              <option value="admin">Администратор</option>
            </Select>
          </Field>
          <div className="flex items-end pb-1">
            <Checkbox name="is_active" defaultChecked={user.is_active} label="Доступ выдан" />
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-[12.5px] font-medium text-[var(--color-ink-2)]">Группы</p>
          <GroupPicker groups={groups} selected={user.group_ids} />
        </div>

        <FormNotice status={state.status} message={state.message} />
        <Button type="submit" variant="primary" size="sm" disabled={pending}>
          {pending ? 'Сохраняю…' : 'Сохранить'}
        </Button>
      </form>

      <form action={pwAction} className="flex flex-wrap items-end gap-3 border-t border-[var(--color-line-2)] pt-3">
        <input type="hidden" name="user_id" value={user.user_id} />
        <Field label="Новый пароль" className="w-full max-w-72">
          <TextInput
            name="password"
            minLength={10}
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </Field>
        <Button type="button" size="sm" onClick={() => setNewPassword(suggestPassword())}>
          Придумать
        </Button>
        <Button type="submit" size="sm" disabled={pwPending || newPassword.length < 10}>
          {pwPending ? 'Меняю…' : 'Сменить пароль'}
        </Button>
        <div className="w-full">
          <FormNotice status={pwState.status} message={pwState.message} />
        </div>
      </form>

      <form action={delAction} className="border-t border-[var(--color-line-2)] pt-3">
        <input type="hidden" name="user_id" value={user.user_id} />
        {confirmDelete ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[12.5px] text-[var(--color-ink-2)]">
              Удалить {user.email} без возможности вернуть?
            </span>
            <Button type="submit" variant="danger" size="sm" disabled={delPending}>
              {delPending ? 'Удаляю…' : 'Да, удалить'}
            </Button>
            <Button type="button" size="sm" onClick={() => setConfirmDelete(false)}>
              Отмена
            </Button>
          </div>
        ) : (
          <Button type="button" variant="danger" size="sm" onClick={() => setConfirmDelete(true)}>
            <Trash2 size={13} strokeWidth={1.9} />
            Удалить пользователя
          </Button>
        )}
        <div className="mt-2">
          <FormNotice status={delState.status} message={delState.message} />
        </div>
      </form>
    </div>
  );
}

export function UserManager({ users, groups }: { users: AdminUserRow[]; groups: AccessGroupRow[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <Card>
        <CardHead title="Пользователи" hint={`всего ${users.length}`} />
        <TableWrap>
          <thead>
            <tr>
              <Th>Человек</Th>
              <Th>Роль</Th>
              <Th>Доступ</Th>
              <Th>Группы</Th>
              <Th>Последний вход</Th>
              <Th><span className="sr-only">Действия</span></Th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <Fragment key={user.user_id}>
                <Tr>
                  <Td>
                    <span className="block font-medium text-[var(--color-ink)]">{user.full_name ?? user.email}</span>
                    {user.full_name ? (
                      <span className="block text-[12px] text-[var(--color-ink-3)]">{user.email}</span>
                    ) : null}
                  </Td>
                  <Td>
                    <Badge tone={user.role === 'admin' ? 'accent' : 'neutral'}>
                      {user.role === 'admin' ? 'администратор' : 'пользователь'}
                    </Badge>
                  </Td>
                  <Td>
                    <Badge tone={user.is_active ? 'success' : 'warning'}>
                      {user.is_active ? 'выдан' : 'не выдан'}
                    </Badge>
                  </Td>
                  <Td className="text-[var(--color-ink-2)]">{user.group_names || '—'}</Td>
                  <Td className="whitespace-nowrap text-[var(--color-ink-2)]">
                    {user.last_sign_in_at ? formatRelative(user.last_sign_in_at) : 'ни разу'}
                  </Td>
                  <Td>
                    <Button
                      size="sm"
                      variant="ghost"
                      aria-expanded={openId === user.user_id}
                      onClick={() => setOpenId(openId === user.user_id ? null : user.user_id)}
                    >
                      {openId === user.user_id ? 'Свернуть' : 'Изменить'}
                    </Button>
                  </Td>
                </Tr>
                {openId === user.user_id ? (
                  <tr>
                    <td colSpan={6} className="p-0">
                      <EditUserForm user={user} groups={groups} />
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            ))}
          </tbody>
        </TableWrap>
      </Card>

      <Card>
        <CardHead
          title="Завести пользователя"
          hint="регистрация со стороны закрыта — людей заводит администратор"
        />
        <CardBody>
          <CreateUserForm groups={groups} />
        </CardBody>
      </Card>
    </div>
  );
}
