import type { Metadata } from 'next';
import Link from 'next/link';

import { FilterBar } from '@/components/domain/FilterBar';
import { KpiCard } from '@/components/domain/KpiCard';
import { Badge } from '@/components/ui/Badge';
import { Card, CardBody, CardHead, PageHeader } from '@/components/ui/Card';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { Td, Th, TableWrap, Tr } from '@/components/ui/Table';
import { formatNumber } from '@/lib/format';
import { fetchCatalogGroups, fetchCatalogItems, fetchCatalogTotals } from '@/server/queries/analysis';

export const metadata: Metadata = { title: 'Каталог' };
export const dynamic = 'force-dynamic';

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const query = typeof sp.q === 'string' ? sp.q : '';
  const category = typeof sp.group === 'string' && sp.group !== '' ? sp.group : null;

  const [groups, totals, items] = await Promise.all([
    fetchCatalogGroups(),
    fetchCatalogTotals(),
    fetchCatalogItems(query, category),
  ]);

  if (!groups.ok) {
    return (
      <>
        <PageHeader title="Каталог" />
        <Card>
          <ErrorState message={groups.error} retryHref="/catalog" />
        </Card>
      </>
    );
  }

  const t = totals.ok ? totals.data : null;
  const trade = groups.data.filter((g) => g.is_trade);

  return (
    <>
      <PageHeader
        title="Каталог"
        subtitle={
          t
            ? `${formatNumber(t.positions)} позиций из 1С, ${formatNumber(t.brands)} брендов, ${formatNumber(t.lines)} линеек`
            : 'номенклатура из 1С'
        }
      />

      <div className="space-y-4">
        {t ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard label="Позиций" value={formatNumber(t.positions)} hint="торговая номенклатура" />
            <KpiCard
              label="С фасовкой"
              value={formatNumber(t.with_pack)}
              hint="объём или масса разобраны из наименования"
            />
            <KpiCard
              label="С применением"
              value={formatNumber(t.with_application)}
              hint="известно, на каких объектах работает"
            />
            <KpiCard
              label="На разметку"
              value={formatNumber(t.needs_review)}
              hint="автоматика не определила группу"
              tone={t.needs_review > 0 ? 'attention' : 'neutral'}
            />
          </div>
        ) : null}

        <Card>
          <CardBody className="space-y-2 text-[13px] leading-6 text-[var(--color-ink-2)]">
            <p>
              Каталог отвечает на вопрос, которого системе не хватало: чем мы отвечаем на лот или
              новость. Раньше система знала, кто упомянут и что произошло, но не знала, что
              предложить.
            </p>
            <p className="text-[var(--color-ink-3)]">
              Услуги, аренда, ИТ-товары и хозрасходы из выгрузки 1С сюда не попали — иначе на лот
              «поставка краски» система предлагала бы аренду автомобиля.
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardHead title="Товарные группы" hint="группа — кластер комплекта — позиций" />
          <TableWrap>
              <thead>
                <tr>
                  <Th>Группа</Th>
                  <Th>Где применяется</Th>
                  <Th>Кластер</Th>
                  <Th numeric>Позиций</Th>
                  <Th numeric>Брендов</Th>
                  <Th>Основные бренды</Th>
                </tr>
              </thead>
              <tbody>
                {trade.map((g) => (
                  <Tr key={g.code}>
                    <Td>
                      <Link
                        className="font-semibold text-[var(--color-accent-ink)]"
                        href={`/catalog?group=${g.code}`}
                      >
                        {g.name}
                      </Link>
                      {g.needs_review > 0 ? (
                        <Badge tone="attention" className="ml-1.5">
                          {formatNumber(g.needs_review)} на разметку
                        </Badge>
                      ) : null}
                    </Td>
                    <Td className="text-[var(--color-ink-2)]">{g.applies_to ?? '—'}</Td>
                    <Td className="text-[var(--color-ink-2)]">{g.cluster_name ?? '—'}</Td>
                    <Td numeric className="font-semibold">
                      {formatNumber(g.positions)}
                    </Td>
                    <Td numeric>
                      {formatNumber(g.brands)}
                    </Td>
                    <Td className="text-[var(--color-ink-2)]">{g.top_brands ?? '—'}</Td>
                  </Tr>
                ))}
              </tbody>
          </TableWrap>
        </Card>

        <FilterBar
          fields={[
            { key: 'q', kind: 'search', label: 'Поиск', placeholder: 'наименование или артикул' },
            {
              key: 'group',
              kind: 'select',
              label: 'Группа',
              options: trade.map((g) => ({ value: g.code, label: g.name })),
            },
          ]}
        />

        <Card>
          <CardHead
            title="Позиции"
            hint={
              category
                ? `отобрана группа: ${trade.find((g) => g.code === category)?.name ?? category}`
                : 'поиск по наименованию или артикулу'
            }
          />
          {!items.ok ? (
            <ErrorState message={items.error} retryHref="/catalog" />
          ) : items.data.length === 0 ? (
            <EmptyState title="Ничего не нашлось" hint="Уточните запрос или снимите отбор по группе." />
          ) : (
            <TableWrap>
                <thead>
                  <tr>
                    <Th>Артикул</Th>
                    <Th>Наименование</Th>
                    <Th>Бренд</Th>
                    <Th>Линейка</Th>
                    <Th numeric>Фасовка</Th>
                    <Th>Цвет</Th>
                    <Th>База</Th>
                    <Th>Блеск</Th>
                    <Th>Основание</Th>
                  </tr>
                </thead>
                <tbody>
                  {items.data.map((it) => (
                    <Tr key={it.id}>
                      <Td className="tabular text-[var(--color-ink-2)]">
                        {it.sku ?? '—'}
                      </Td>
                      <Td>
                        {it.name}
                        {it.discontinued ? (
                          <Badge tone="warning" className="ml-1.5">
                            неликвид
                          </Badge>
                        ) : null}
                        {it.needs_review ? (
                          <Badge tone="attention" className="ml-1.5">
                            на разметку
                          </Badge>
                        ) : null}
                      </Td>
                      <Td className="text-[var(--color-ink-2)]">{it.brand_name ?? '—'}</Td>
                      <Td className="text-[var(--color-ink-2)]">{it.product_line ?? '—'}</Td>
                      <Td numeric>
                        {it.pack_size ? `${formatNumber(it.pack_size)} ${it.pack_unit ?? ''}`.trim() : '—'}
                      </Td>
                      <Td className="text-[var(--color-ink-2)]">{it.color_code ?? it.color_name ?? '—'}</Td>
                      <Td className="text-[var(--color-ink-2)]">{it.tint_base ?? '—'}</Td>
                      <Td className="text-[var(--color-ink-2)]">{it.gloss ?? '—'}</Td>
                      <Td className="text-[var(--color-ink-2)]">{it.substrate.length > 0 ? it.substrate.join(', ') : '—'}</Td>
                    </Tr>
                  ))}
                </tbody>
            </TableWrap>
          )}
        </Card>
      </div>
    </>
  );
}
