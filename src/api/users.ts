import { apiClient, API_V1 } from './client'
import type { BaseResponse } from '@/types/base'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RegisterUserRequest {
  username: string
  email: string
  password: string
  firstName?: string
  lastName?: string
}

// ── Self-registration ─────────────────────────────────────────────────────────

/**
 * POST /api/v1/tenants/{tenantSlug}/apps/{clientId}/register
 * Público — no requiere autenticación.
 * Crea el usuario en estado PENDING y envía email de verificación.
 */
export async function registerUser(
  tenantSlug: string,
  clientId: string,
  data: RegisterUserRequest,
): Promise<void> {
  const res = await apiClient.post<BaseResponse<unknown>>(
    `${API_V1}/tenants/${encodeURIComponent(tenantSlug)}/apps/${encodeURIComponent(clientId)}/register`,
    data,
  )
  if (!res.data.success) {
    throw new Error(res.data.failure?.message ?? 'Error al registrar usuario')
  }
}
