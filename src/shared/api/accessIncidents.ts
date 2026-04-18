import type { BaseResponse } from '@/shared/types/base'
import type {
  AccessIncidentReportReceipt,
  CreateAccessIncidentReportRequest,
} from '@/shared/types/support'
import { apiClient, API_V1 } from '@/shared/api/client'
import { unwrapResponseData } from '@/shared/api/response'
import type { RequestOptions } from '@/shared/api/requestOptions'

/** POST /api/v1/platform/support/access-incidents ⏳ pendiente backend */
export async function createAccessIncidentReport(
  payload: CreateAccessIncidentReportRequest,
  options?: RequestOptions,
): Promise<AccessIncidentReportReceipt> {
  const res = await apiClient.post<BaseResponse<AccessIncidentReportReceipt>>(
    `${API_V1}/platform/support/access-incidents`,
    payload,
    {
      signal: options?.signal,
      timeout: options?.timeoutMs,
      headers: options?.idempotencyKey
        ? { 'X-Idempotency-Key': options.idempotencyKey }
        : undefined,
    },
  )

  return unwrapResponseData(res.data, 'No se pudo registrar el incidente de acceso')
}
