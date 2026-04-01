import type { BaseResponse, PagedData } from '@/types/base'
import type { TenantData, CreateTenantRequest, ListTenantsParams } from '@/types/tenant'
import { apiClient, API_V1 } from './client'
import { unwrapResponseData } from './response'

// ── Query key constants ────────────────────────────────────────────────────────

export const TENANT_QUERY_KEYS = {
  all: ['tenants'] as const,
  list: (params: ListTenantsParams) => ['tenants', 'list', params] as const,
  detail: (slug: string) => ['tenants', slug] as const,
}

// ── API functions ─────────────────────────────────────────────────────────────

/** GET /api/v1/tenants ✅ — paginado, filtrado por status y nombre. Solo ADMIN. */
export async function listTenants(params?: ListTenantsParams): Promise<PagedData<TenantData>> {
  const res = await apiClient.get<BaseResponse<PagedData<TenantData>>>(`${API_V1}/tenants`, {
    params,
  })
  return unwrapResponseData(res.data, 'Error al listar tenants')
}

/** GET /api/v1/tenants/{slug} ✅ */
export async function getTenant(slug: string): Promise<TenantData> {
  const res = await apiClient.get<BaseResponse<TenantData>>(`${API_V1}/tenants/${slug}`)
  return unwrapResponseData(res.data, 'Tenant no encontrado')
}

/** POST /api/v1/tenants ✅ */
export async function createTenant(data: CreateTenantRequest): Promise<TenantData> {
  const res = await apiClient.post<BaseResponse<TenantData>>(`${API_V1}/tenants`, data)
  return unwrapResponseData(res.data, 'Error al crear el tenant')
}

/** PUT /api/v1/tenants/{slug}/suspend ✅ */
export async function suspendTenant(slug: string): Promise<void> {
  await apiClient.put(`${API_V1}/tenants/${slug}/suspend`)
}

/** PUT /api/v1/tenants/{slug}/activate ✅ */
export async function activateTenant(slug: string): Promise<void> {
  await apiClient.put(`${API_V1}/tenants/${slug}/activate`)
}
