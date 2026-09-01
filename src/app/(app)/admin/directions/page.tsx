import type { Metadata } from 'next';

import { DirectionForm } from './DirectionForm';
import { Card, CardBody, CardHead, PageHeader } from '@/components/ui/Card';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { formatNumber } from '@/lib/format';
import { fetchDirections } from '@/server/queries/directions';
import type { DirectionRow } from '@/lib/types';

export const metadata: Metadata = { title: 'Направления' };
export const dynamic = 'force-dynamic';

const GROUPS: Array<{ kind: DirectionRow['kind']; title: string; hint: string }> = [
  {
    kind: 'interest',
    title: 'Интересует',
    hint: 'поднимает важность; рынок умножает отдельно',
  },
  {
    kind: 'background',
    title: 'Фон',
    hint: 'хранится и видно в разделах, но важность не выше двух и оповещения не будет',
  },
  {
    kind: 'exclude',
    title: 'Не интересует',
    hint: 'отбрасывается на входе, до обращения к модели — по заголовку, а не по тексту',
  },
];

export default async function DirectionsPage() {
  const result = await fetchDirections();

  if (!result.ok) {
    return (
      <>
        <PageHeader title="Направления" />
        <Card>
          <ErrorState message={result.error} retryHref="/admin/directions" />
        </Card>
      </>
    );
  }

  const rows = result.data;
  const interest = rows.filter((r) => r.kind === 'interest').length;
  const exclude = rows.filter((r) => r.kind === 'exclude').length;

  return (
    <>
      <PageHeader
        title="Направления"
        subtitle={`Что считать новостью и на каком рынке: ${formatNumber(interest)} интересов, ${formatNumber(exclude)} исключений`}
      />

      <div className="space-y-4">
        <Card>
          <CardBody className="space-y-2 text-[13px] leading-6 text-[var(--color-ink-2)]">
            <p>
              Словарь брендов и конкурентов отвечает на вопрос «кто упомянут». Этого мало:
              названа Sika — и материал проходит, будь это вакансия оператора производства в
              Калифорнии, котировки Akzo Nobel или покраска самолётов. Проверка ста событий
              исполнительным директором дала пять полезных из ста именно по этой причине.
            </p>
            <p>
              Здесь заданы две недостающие оси. <span className="text-[var(--color-ink)]">Что произошло</span> —
              новый продукт, дилерство, завод, контракт, цены. И{' '}
              <span className="text-[var(--color-ink)]">на каком рынке</span> — Казахстан, Центральная
              Азия, СНГ, остальной мир. Решение считается как произведение: интерес × рынок.
            </p>
            <p className="text-[var(--color-ink-3)]">
              Главное правило: если по тексту не видно, <em>что</em> произошло, — это не новость, а
              товарная страница или обрывок. Такой материал остаётся фоном. Упоминание марки само
              по себе больше не пропуск.
            </p>
          </CardBody>
        </Card>

        {rows.length === 0 ? (
          <Card>
            <EmptyState
              title="Направления не заданы"
              hint="Список создаётся миграцией базы. Если он пуст, значит настройка не применена."
            />
          </Card>
        ) : (
          GROUPS.map((group) => {
            const groupRows = rows.filter((r) => r.kind === group.kind);
            if (groupRows.length === 0) return null;
            return (
              <Card key={group.kind}>
                <CardHead title={group.title} hint={group.hint} />
                <div>
                  {groupRows.map((row) => (
                    <DirectionForm key={row.id} row={row} />
                  ))}
                </div>
              </Card>
            );
          })
        )}
      </div>
    </>
  );
}
