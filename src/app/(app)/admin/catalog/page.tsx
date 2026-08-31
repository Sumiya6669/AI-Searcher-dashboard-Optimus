import type { Metadata } from 'next';

import { CatalogTable } from './CatalogTable';
import { Card, PageHeader } from '@/components/ui/Card';
import { ErrorState } from '@/components/ui/States';
import { CATALOG } from '@/lib/catalog';
import { fetchCatalogState, fetchSourceOptions } from '@/server/queries/catalog';

export const metadata: Metadata = { title: 'Каталог источников' };
export const dynamic = 'force-dynamic';

export default async function CatalogPage() {
  const [states, sources] = await Promise.all([fetchCatalogState(), fetchSourceOptions()]);

  const first = CATALOG.filter((entry) => entry.priority === 1).length;
  const second = CATALOG.filter((entry) => entry.priority === 2).length;
  const third = CATALOG.length - first - second;

  return (
    <>
      <PageHeader
        title="Каталог источников"
        subtitle={`Список наблюдения на ${CATALOG.length} источников: ${first} в первую очередь, ${second} во вторую, ${third} в третью`}
      />

      {states.ok && sources.ok ? (
        <CatalogTable states={states.data} sources={sources.data} />
      ) : (
        <Card>
          <ErrorState
            message={states.ok ? (sources.ok ? '' : sources.error) : states.error}
            retryHref="/admin/catalog"
          />
        </Card>
      )}
    </>
  );
}
