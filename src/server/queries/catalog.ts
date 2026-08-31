import type { CatalogStateRow, IntegrationRow, Result, SourceOptionRow } from '@/lib/types';
import { callRpc, isDemoMode, safe } from './client';

/**
 * Состояние каталога и подключений читают функции с правами владельца: они сами
 * отказывают не администратору. В демонстрационном режиме база недоступна, и
 * страница должна показывать пустое состояние, а не ошибку.
 */
export async function fetchCatalogState(): Promise<Result<CatalogStateRow[]>> {
  if (isDemoMode()) return { ok: true, data: [] };
  return safe(() => callRpc<CatalogStateRow[]>('app_admin_catalog_state'));
}

export async function fetchSourceOptions(): Promise<Result<SourceOptionRow[]>> {
  if (isDemoMode()) return { ok: true, data: [] };
  return safe(() => callRpc<SourceOptionRow[]>('app_admin_source_options'));
}

export async function fetchIntegrations(): Promise<Result<IntegrationRow[]>> {
  if (isDemoMode()) return { ok: true, data: [] };
  return safe(() => callRpc<IntegrationRow[]>('app_admin_integrations'));
}
