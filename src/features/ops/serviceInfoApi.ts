import type { BaseResponse } from '@/shared/types/base'
import { apiClient, API_V1 } from '@/shared/api/client'
import { unwrapResponseData } from '@/shared/api/response'
import type { RequestOptions } from '@/shared/api/requestOptions'

export interface ServiceInfoData {
  title: string
  name: string
  version: string
  environment?: string
  status?: string
}

export interface PlatformStatsData {
  tenants: { total: number; active: number; suspended: number; pending: number }
  users: { total: number; active: number; pending: number; suspended: number }
  apps: { total: number }
  signingKeys: { active: number }
}

// ── Query key constants ────────────────────────────────────────────────────────

export const PLATFORM_QUERY_KEYS = {
  serviceInfo: ['service-info'] as const,
  stats: ['platform-stats'] as const,
}

export async function getServiceInfo(options?: RequestOptions): Promise<ServiceInfoData> {
  const response = await apiClient.get<BaseResponse<ServiceInfoData>>(`${API_V1}/service/info`, {
    signal: options?.signal,
    timeout: options?.timeoutMs,
  })
  return unwrapResponseData(response.data, 'Failed to fetch service info')
}

/** GET /api/v1/platform/stats ✅ — estadísticas globales. Solo ADMIN. */
export async function getPlatformStats(options?: RequestOptions): Promise<PlatformStatsData> {
  const response = await apiClient.get<BaseResponse<PlatformStatsData>>(`${API_V1}/platform/stats`, {
    signal: options?.signal,
    timeout: options?.timeoutMs,
  })
  return unwrapResponseData(response.data, 'Failed to fetch platform stats')
}
