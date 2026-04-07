import type { BaseResponse } from '@/shared/types/base'
import type { PlatformStatsData } from '@/shared/types/platform'
import { apiClient, API_V1 } from '@/shared/api/client'
import { unwrapResponseData } from '@/shared/api/response'
import type { RequestOptions } from '@/shared/api/requestOptions'

// ── Query key constants ────────────────────────────────────────────────────────

export const PLATFORM_STATS_QUERY_KEYS = {
  stats: ['platform-stats'] as const,
}

// ── Endpoints ─────────────────────────────────────────────────────────────────

/** GET /api/v1/platform/stats ✅ — estadísticas agregadas de la plataforma. Solo keygo_admin. */
export async function getPlatformStats(options?: RequestOptions): Promise<PlatformStatsData> {
  const res = await apiClient.get<BaseResponse<PlatformStatsData>>(
    `${API_V1}/platform/stats`,
    { signal: options?.signal, timeout: options?.timeoutMs },
  )
  return unwrapResponseData(res.data, 'Error al obtener estadísticas de plataforma')
}
