import { ExternalLink } from 'lucide-react';
import type { Metadata } from 'next';

import { ProfileForm } from './ProfileForm';
import { Badge } from '@/components/ui/Badge';
import { ButtonLink } from '@/components/ui/Button';
import { Card, CardBody, CardHead, DefinitionList, PageHeader } from '@/components/ui/Card';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { TableWrap, Td, Th, Tr } from '@/components/ui/Table';
import { ENTITY_TYPE_LABEL } from '@/lib/domain';
import { requireUser } from '@/server/auth';
import { fetchSubscriptions } from '@/server/queries/brands';
import { fetchDeliveryState } from '@/server/queries/admin';
import { n8nBaseUrl } from '@/server/supabase/server';

export const metadata: Metadata = { title: 'Настройки' };
export const dynamic = 'force-dynamic';

const SCOPE_LABEL: Record<string, string> = {
  entity: 'сущность словаря',
  group: 'товарная группа',
  category: 'категория события',
  agent: 'источник',
  all: 'весь поток',
};

export default async function SettingsPage() {
  const user = await requireUser();
  const [subs, delivery] = await Promise.all([
    fetchSubscriptions(),
    user.role === 'admin' ? fetchDeliveryState() : Promise.resolve({ ok: true as const, data: [] }),
  ]);
  const formUrl = n8nBaseUrl() ? `${n8nBaseUrl()!.replace(/\/+$/, '')}/form/optimus-recipients` : null;

  return (
    <>
      <PageHeader title="Настройки" subtitle="Профиль, оформление, адресная рассылка" />

      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        <Card>
          <CardHead title="Профиль" />
          <CardBody className="space-y-4">
            <DefinitionList
              items={[
                { term: 'Адрес', value: user.email },
                {
                  term: 'Роль',
                  value:
                    user.role === 'admin' ? (
                      <Badge tone="accent">администратор</Badge>
                    ) : (
                      <Badge tone="neutral">пользователь</Badge>
                    ),
                },
              ]}
            />
            <ProfileForm user={user} />
            <p className="text-[12px] text-[var(--color-ink-3)]">
              Роль меняет только администратор. Смена роли из этой формы невозможна не потому, что поля нет, а потому
              что политика базы такое обновление отклоняет.
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardHead title="Оформление" />
          <CardBody className="space-y-2 text-[13px] text-[var(--color-ink-2)]">
            <p>
              Светлая, тёмная и «как в системе» переключаются в правом верхнем углу. Выбор хранится в браузере и
              применяется до первой отрисовки, поэтому страница не мигает при загрузке.
            </p>
            <p>
              Всё время в интерфейсе — время Казахстана; текущее видно в шапке и в боковом меню. Даты записываются как
              28.08.2026 14:20, суммы — как 4 820 000 ₸.
            </p>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHead
            title="Адресная рассылка"
            hint="кто на что подписан"
            actions={
              formUrl ? (
                <ButtonLink href={formUrl} external size="sm">
                  Открыть форму получателей
                  <ExternalLink size={13} />
                </ButtonLink>
              ) : null
            }
          />
          {!subs.ok ? (
            <ErrorState message={subs.error} retryHref="/settings" />
          ) : subs.data.length === 0 ? (
            <EmptyState
              title="Подписок нет"
              hint="Получатели без подписок получают весь поток начиная со своего порога важности — это исходное поведение системы, оно не менялось."
            />
          ) : (
            <TableWrap>
              <thead>
                <tr>
                  <Th>Получатель</Th>
                  <Th>На что</Th>
                  <Th>Область</Th>
                  <Th>Режим</Th>
                  <Th numeric>Порог</Th>
                  <Th>Каналы</Th>
                  <Th>Состояние</Th>
                </tr>
              </thead>
              <tbody>
                {subs.data.map((sub) => (
                  <Tr key={sub.id}>
                    <Td>
                      {sub.recipient_name}
                      {sub.recipient_role ? (
                        <span className="block text-[11.5px] text-[var(--color-ink-3)]">{sub.recipient_role}</span>
                      ) : null}
                    </Td>
                    <Td>
                      {sub.entity_id ? (
                        <a href={`/brands/${sub.entity_id}`} className="text-[var(--color-accent-ink)] hover:underline">
                          {sub.target}
                        </a>
                      ) : (
                        (sub.target ?? '—')
                      )}
                      {sub.target_type ? (
                        <span className="block text-[11.5px] text-[var(--color-ink-3)]">
                          {ENTITY_TYPE_LABEL[sub.target_type] ?? sub.target_type}
                        </span>
                      ) : null}
                    </Td>
                    <Td className="whitespace-nowrap text-[var(--color-ink-2)]">{SCOPE_LABEL[sub.scope] ?? sub.scope}</Td>
                    <Td>
                      {sub.mode === 'exclude' ? (
                        <Badge tone="critical">не присылать</Badge>
                      ) : (
                        <Badge tone="success">присылать</Badge>
                      )}
                    </Td>
                    <Td numeric>{sub.effective_min_importance}/5</Td>
                    <Td className="text-[12.5px] text-[var(--color-ink-2)]">{sub.channels.join(', ')}</Td>
                    <Td>
                      {sub.recipient_active ? (
                        <Badge tone="success">получатель активен</Badge>
                      ) : (
                        <Badge tone="neutral">получатель отключён</Badge>
                      )}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </TableWrap>
          )}
          <CardBody className="border-t border-[var(--color-line-2)] text-[12px] text-[var(--color-ink-3)]">
            Подписки изменяются формой в n8n, а не здесь: там же заводится получатель и берётся его идентификатор чата.
            Дашборд показывает настройку, чтобы было видно, доходят ли новости до человека, но не подменяет собой
            единственное место, где эта настройка живёт. Идентификаторы чатов Telegram интерфейсу недоступны вообще —
            права на этот столбец у роли приложения нет.
          </CardBody>
        </Card>

        {user.role === 'admin' && delivery.ok && delivery.data.length > 0 ? (
          <Card className="lg:col-span-2">
            <CardHead title="Состояние доставки" hint="только для администратора" />
            <TableWrap>
              <thead>
                <tr>
                  <Th>Вид</Th>
                  <Th numeric>Отправлено за 30 дней</Th>
                  <Th numeric>Неудач</Th>
                  <Th>Последняя отправка</Th>
                </tr>
              </thead>
              <tbody>
                {delivery.data.map((row) => (
                  <Tr key={row.kind}>
                    <Td>{row.kind}</Td>
                    <Td numeric>{row.sent_30d}</Td>
                    <Td numeric>{row.failed_30d}</Td>
                    <Td className="text-[var(--color-ink-2)]">{row.last_sent_at ?? '—'}</Td>
                  </Tr>
                ))}
              </tbody>
            </TableWrap>
          </Card>
        ) : null}
      </div>
    </>
  );
}
