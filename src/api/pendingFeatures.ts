import { apiClient, API_V1 } from './client'
import { unwrapResponseData } from './response'
import type { BaseResponse } from '@/types/base'
import type {
  PendingFeatureActionResult,
  PendingFeatureSnapshot,
} from '@/types/pendingFeature'
import type { RequestOptions } from './requestOptions'

export const PENDING_FEATURE_QUERY_KEYS = {
  detail: (featureId: string) => ['pending-feature', featureId] as const,
} as const

const pendingFeatureUrl = (featureId: string) => `${API_V1}/platform/pending-features/${featureId}`

// ⏳ pendiente backend: endpoint temporal MSW para vistas placeholder de dashboard.
export async function getPendingFeatureSnapshot(
  featureId: string,
  options?: RequestOptions,
): Promise<PendingFeatureSnapshot> {
  const res = await apiClient.get<BaseResponse<PendingFeatureSnapshot>>(pendingFeatureUrl(featureId), {
    signal: options?.signal,
    timeout: options?.timeoutMs,
  })

  return unwrapResponseData(res.data, 'No se pudo cargar el modulo')
}

// ⏳ pendiente backend: endpoint temporal MSW para acciones de cada modulo.
export async function runPendingFeatureAction(
  featureId: string,
  action: string,
  itemId?: string,
  options?: RequestOptions,
): Promise<PendingFeatureActionResult> {
  const res = await apiClient.post<BaseResponse<PendingFeatureActionResult>>(
    `${pendingFeatureUrl(featureId)}/actions`,
    {
      action,
      item_id: itemId,
    },
    {
      signal: options?.signal,
      timeout: options?.timeoutMs,
      headers: options?.idempotencyKey
        ? { 'X-Idempotency-Key': options.idempotencyKey }
        : undefined,
    },
  )

  return unwrapResponseData(res.data, 'No se pudo ejecutar la accion')
}
