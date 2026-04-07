import type { BaseResponse } from '@/shared/types/base'
import type { PlatformDashboardData } from '@/shared/types/dashboard'
import { apiClient, API_V1 } from '@/shared/api/client'
import { unwrapResponseData } from '@/shared/api/response'
import type { RequestOptions } from '@/shared/api/requestOptions'

// ── Query keys ────────────────────────────────────────────────────────────────

export const DASHBOARD_QUERY_KEYS = {
  platformDashboard: ['platform-dashboard'] as const,
}

// ── Endpoints ─────────────────────────────────────────────────────────────────

/** GET /api/v1/admin/platform/dashboard ✅ — vista agregada del panel de control. Solo ADMIN. */
export async function getPlatformDashboard(options?: RequestOptions): Promise<PlatformDashboardData> {
  const response = await apiClient.get<BaseResponse<PlatformDashboardData>>(
    `${API_V1}/admin/platform/dashboard`,
    {
      signal: options?.signal,
      timeout: options?.timeoutMs,
    },
  )
  return unwrapResponseData(response.data, 'Failed to fetch platform dashboard')
}
