import type { Metadata } from 'next';

import { Badge } from '@/components/ui/Badge';
import { Card, CardBody, CardHead, PageHeader } from '@/components/ui/Card';
import { ErrorState } from '@/components/ui/States';
import { formatNumber } from '@/lib/format';
import { fetchSemantics } from '@/server/queries/semantics';

export const metadata: Metadata = { title: 'Семантика' };
export const dynamic = 'force-dynamic';

export default async function SemanticsPage() {
  const result = await fetchSemantics();

  if (!result.ok) {
    return (
      <>
        <PageHeader title="Семантика" />
        <Card>
          <ErrorState message={result.error} retryHref="/admin/semantics" />
        </Card>
      </>
    );
  }

  const rows = result.data;
  const total = rows.reduce((sum, row) => sum + row.aliases_total, 0);
  const patterns = rows.reduce((sum, row) => sum + row.aliases_pattern, 0);

  return (
    <>
      <PageHeader
        title="Семантика"
        subtitle={`Под какие объекты и работы подходит наша номенклатура: ${rows.length} направлений, ${formatNumber(total)} выражений`}
      />

      <div className="space-y-4">
        <Card>
          <CardBody className="space-y-2 text-[13px] leading-6 text-[var(--color-ink-2)]">
            <p>
              Это то, за что система цепляет новость или лот, в котором не назван ни один наш бренд.
              «В Караганде начали строить мост» — про Sika там нет ни слова, но мост означает
              гидроизоляцию пролётных строений, ремонтные смеси и шовные герметики. Раньше такая
              новость отбрасывалась: порог передачи материала в модель — 1,0, а отраслевая тема
              весила 0,30 и не проходила его даже при точном совпадении в заголовке.
            </p>
            <p>
              Выражения двух видов. Точные — «строительство моста», «наливной пол»,{' '}
              «инъектирование трещин»; они находят и падежи, и множественное число. Образцов{' '}
              {formatNumber(patterns)} — они ловят случаи, где слова стоят не рядом: «кирпичный
              завод начала строить китайская компания».
            </p>
            <p className="text-[var(--color-ink-3)]">
              В поисковые запросы Brave эти выражения намеренно не идут: бесплатная квота — 2000
              запросов в месяц, и тысяча выражений съела бы её за сутки. Их работа — на входном
              фильтре, куда новостные ленты и сайты приносят материал сами.
            </p>
          </CardBody>
        </Card>

        <div className="grid gap-4 xl:grid-cols-2">
          {rows.map((row) => (
            <Card key={row.entity_id}>
              <CardHead
                title={row.canonical_name}
                actions={
                  <span className="flex items-center gap-1.5">
                    <Badge tone="accent" title="Сколько выражений система знает">
                      {formatNumber(row.aliases_total)}
                    </Badge>
                    {row.events_30d > 0 ? (
                      <Badge tone="success" title="Событий за 30 дней">
                        {formatNumber(row.events_30d)} за 30 дней
                      </Badge>
                    ) : (
                      <Badge tone="neutral" title="Событий за 30 дней">
                        событий нет
                      </Badge>
                    )}
                  </span>
                }
              />
              <CardBody className="space-y-2.5">
                {row.description ? (
                  <p className="text-[13px] leading-5 text-[var(--color-ink-2)]">{row.description}</p>
                ) : null}
                {row.product_groups ? (
                  <p className="text-[12.5px] text-[var(--color-ink-3)]">
                    <span className="text-[var(--color-ink-2)]">Товарные группы:</span>{' '}
                    {row.product_groups}
                  </p>
                ) : null}
                {row.examples ? (
                  <p className="text-[12.5px] leading-5 text-[var(--color-ink-3)]">
                    <span className="text-[var(--color-ink-2)]">Например:</span> {row.examples}
                  </p>
                ) : null}
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
