import type {
  CatalogGroupRow,
  CatalogItemRow,
  CatalogTotalsRow,
  EventAnalysisRow,
  ProjectRow,
  Result,
  ScoringFactorRow,
  StageRow,
  TenderAnalysisRow,
} from '@/lib/types';
import { callRpc, callRpcRow, isDemoMode, safe } from './client';
import {
  demoCatalogGroups,
  demoCatalogItems,
  demoCatalogTotals,
  demoEventAnalysis,
  demoProjects,
  demoScoring,
  demoStages,
  demoTenderAnalysis,
} from '../demo/analysis';

/**
 * Разбор события по комплекту исполнительного директора: поток, балл со
 * слагаемыми, доказательства, рекомендация. Отдельным запросом, а не в составе
 * карточки: карточку читают ещё Telegram и выгрузка в Excel, и менять её
 * состав ради одного экрана — значит трогать два работающих канала.
 */
export async function fetchEventAnalysis(id: number): Promise<Result<EventAnalysisRow | null>> {
  if (isDemoMode()) return { ok: true, data: demoEventAnalysis(id) };
  return safe(() => callRpcRow<EventAnalysisRow>('app_event_analysis', { p_id: id }));
}

export async function fetchTenderAnalysis(id: number): Promise<Result<TenderAnalysisRow | null>> {
  if (isDemoMode()) return { ok: true, data: demoTenderAnalysis(id) };
  return safe(() => callRpcRow<TenderAnalysisRow>('app_tender_analysis', { p_id: id }));
}

export async function fetchProjects(limit = 100): Promise<Result<ProjectRow[]>> {
  if (isDemoMode()) return { ok: true, data: demoProjects() };
  return safe(() => callRpc<ProjectRow[]>('app_projects', { p_limit: limit }));
}

export async function fetchProject(id: number): Promise<Result<ProjectRow | null>> {
  if (isDemoMode()) return { ok: true, data: demoProjects().find((p) => p.id === id) ?? null };
  return safe(() => callRpcRow<ProjectRow>('app_project', { p_id: id }));
}

export async function fetchCatalogGroups(): Promise<Result<CatalogGroupRow[]>> {
  if (isDemoMode()) return { ok: true, data: demoCatalogGroups() };
  return safe(() => callRpc<CatalogGroupRow[]>('app_catalog_groups'));
}

export async function fetchCatalogTotals(): Promise<Result<CatalogTotalsRow | null>> {
  if (isDemoMode()) return { ok: true, data: demoCatalogTotals() };
  return safe(() => callRpcRow<CatalogTotalsRow>('app_catalog_totals'));
}

export async function fetchCatalogItems(
  query: string,
  category: string | null,
  limit = 60,
): Promise<Result<CatalogItemRow[]>> {
  if (isDemoMode()) return { ok: true, data: demoCatalogItems(query, category) };
  return safe(() =>
    callRpc<CatalogItemRow[]>('app_catalog_search', {
      p_query: query,
      p_category: category,
      p_limit: limit,
    }),
  );
}

export async function fetchScoring(): Promise<Result<ScoringFactorRow[]>> {
  if (isDemoMode()) return { ok: true, data: demoScoring() };
  return safe(() => callRpc<ScoringFactorRow[]>('app_scoring'));
}

export async function fetchStages(): Promise<Result<StageRow[]>> {
  if (isDemoMode()) return { ok: true, data: demoStages() };
  return safe(() => callRpc<StageRow[]>('app_stages'));
}
