import {
  DEMO_ADMIN_HEALTH,
  DEMO_DELIVERY,
  DEMO_FAILED_RUNS,
  DEMO_LLM_DAILY,
  DEMO_THRESHOLDS,
  DEMO_WORKFLOWS,
} from '../demo/data';
import { callRpc, callRpcRow, isDemoMode, safe } from './client';
import type {
  AdminHealth,
  DeliveryStateRow,
  FailedRunRow,
  LlmDailyRow,
  Result,
  ThresholdRow,
  WorkflowHealthRow,
} from '@/lib/types';

export async function fetchAdminHealth(): Promise<Result<AdminHealth>> {
  if (isDemoMode()) return safe(async () => DEMO_ADMIN_HEALTH);
  return safe(async () => {
    const row = await callRpcRow<AdminHealth>('app_admin_health');
    if (!row) throw new Error('показатели не вернулись');
    return row;
  });
}

export async function fetchWorkflowHealth(hours = 24): Promise<Result<WorkflowHealthRow[]>> {
  if (isDemoMode()) return safe(async () => DEMO_WORKFLOWS);
  return safe(async () => {
    const rows = await callRpc<WorkflowHealthRow[]>('app_workflow_health', { p_hours: hours });
    return rows ?? [];
  });
}

export async function fetchFailedRuns(limit = 20): Promise<Result<FailedRunRow[]>> {
  if (isDemoMode()) return safe(async () => DEMO_FAILED_RUNS);
  return safe(async () => {
    const rows = await callRpc<FailedRunRow[]>('app_failed_runs', { p_limit: limit });
    return rows ?? [];
  });
}

export async function fetchLlmDaily(days = 30): Promise<Result<LlmDailyRow[]>> {
  if (isDemoMode()) return safe(async () => DEMO_LLM_DAILY);
  return safe(async () => {
    const rows = await callRpc<LlmDailyRow[]>('app_llm_daily', { p_days: days });
    return rows ?? [];
  });
}

export async function fetchDeliveryState(): Promise<Result<DeliveryStateRow[]>> {
  if (isDemoMode()) return safe(async () => DEMO_DELIVERY);
  return safe(async () => {
    const rows = await callRpc<DeliveryStateRow[]>('app_delivery_state');
    return rows ?? [];
  });
}

export async function fetchThresholds(): Promise<Result<ThresholdRow[]>> {
  if (isDemoMode()) return safe(async () => DEMO_THRESHOLDS);
  return safe(async () => {
    const rows = await callRpc<ThresholdRow[]>('app_thresholds');
    return rows ?? [];
  });
}
