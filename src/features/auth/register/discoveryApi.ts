import type { BaseResponse, PagedData } from '@/shared/types/base'
import type { TenantPublicData } from '@/shared/types/tenant'
import type { ClientAppPublicData } from '@/shared/types/clientapp'
import { authClient, API_V1 } from '@/shared/api/client'
import { unwrapResponseData } from '@/shared/api/response'

// ── API functions ─────────────────────────────────────────────────────────────

/**
 * GET /api/v1/tenants/public
 * Lista pública de tenants sin autenticación (para self-registration discovery)
 * Usa authClient (sesión de cookie) en lugar de apiClient (Bearer token)
 * Devuelve datos paginados
 */
export async function getPublicTenants(page = 0, size = 50): Promise<PagedData<TenantPublicData>> {
  const res = await authClient.get<BaseResponse<PagedData<TenantPublicData>>>(
    `${API_V1}/tenants/public?page=${page}&size=${size}`,
    {
      timeout: 10000,
    },
  )
  return unwrapResponseData(res.data, 'Error al obtener lista de empresas')
}

/**
 * GET /api/v1/tenants/{tenantSlug}/apps/public
 * Lista pública de apps de un tenant sin autenticación (solo OPEN registration policy)
 * Usa authClient (sesión de cookie) en lugar de apiClient (Bearer token)
 * Devuelve datos paginados
 */
export async function getPublicApps(tenantSlug: string, page = 0, size = 50): Promise<PagedData<ClientAppPublicData>> {
  const res = await authClient.get<BaseResponse<PagedData<ClientAppPublicData>>>(
    `${API_V1}/tenants/${tenantSlug}/apps/public?page=${page}&size=${size}`,
    {
      timeout: 10000,
    },
  )
  return unwrapResponseData(res.data, 'Error al obtener lista de aplicaciones')
}
