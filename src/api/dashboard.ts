import type { BaseResponse } from '@/types/base'
import type { PlatformDashboardData } from '@/types/dashboard'
import { apiClient, API_V1 } from './client'

// ── Query keys ────────────────────────────────────────────────────────────────

export const DASHBOARD_QUERY_KEYS = {
  platformDashboard: ['platform-dashboard'] as const,
}

// ── Endpoints ─────────────────────────────────────────────────────────────────

/** GET /api/v1/admin/platform/dashboard ✅ — vista agregada del panel de control. Solo ADMIN. */
export async function getPlatformDashboard(): Promise<PlatformDashboardData> {
  const response = await apiClient.get<BaseResponse<PlatformDashboardData>>(
    `${API_V1}/admin/platform/dashboard`,
  )
  const body = response.data
  if (!body.data) throw new Error(body.failure?.message ?? 'Failed to fetch platform dashboard')
  return body.data
}
