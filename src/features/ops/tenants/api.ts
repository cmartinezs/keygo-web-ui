import type { BaseResponse, PagedData } from '@/shared/types/base'
import type { TenantData, CreateTenantRequest, ListTenantsParams } from '@/shared/types/tenant'
import { apiClient, API_V1 } from '@/shared/api/client'
import { unwrapResponseData } from '@/shared/api/response'
import type { RequestOptions } from '@/shared/api/requestOptions'

// ── Query key constants ────────────────────────────────────────────────────────

export const TENANT_QUERY_KEYS = {
  all: ['tenants'] as const,
  list: (params: ListTenantsParams) => ['tenants', 'list', params] as const,
  detail: (slug: string) => ['tenants', slug] as const,
}

// ── API functions ─────────────────────────────────────────────────────────────

/** GET /api/v1/tenants ✅ — paginado, filtrado por status y nombre. Solo ADMIN. */
export async function listTenants(
  params?: ListTenantsParams,
  options?: RequestOptions,
): Promise<PagedData<TenantData>> {
  const res = await apiClient.get<BaseResponse<PagedData<TenantData>>>(`${API_V1}/tenants`, {
    params,
    signal: options?.signal,
    timeout: options?.timeoutMs,
  })
  return unwrapResponseData(res.data, 'Error al listar tenants')
}

/** GET /api/v1/tenants/{slug} ✅ */
export async function getTenant(slug: string, options?: RequestOptions): Promise<TenantData> {
  const res = await apiClient.get<BaseResponse<TenantData>>(`${API_V1}/tenants/${slug}`, {
    signal: options?.signal,
    timeout: options?.timeoutMs,
  })
  return unwrapResponseData(res.data, 'Tenant no encontrado')
}

/** POST /api/v1/tenants ✅ */
export async function createTenant(data: CreateTenantRequest, options?: RequestOptions): Promise<TenantData> {
  const res = await apiClient.post<BaseResponse<TenantData>>(`${API_V1}/tenants`, data, {
    signal: options?.signal,
    timeout: options?.timeoutMs,
    headers: options?.idempotencyKey
      ? { 'X-Idempotency-Key': options.idempotencyKey }
      : undefined,
  })
  return unwrapResponseData(res.data, 'Error al crear el tenant')
}

/** PUT /api/v1/tenants/{slug}/suspend ✅ */
export async function suspendTenant(slug: string, options?: RequestOptions): Promise<void> {
  await apiClient.put(`${API_V1}/tenants/${slug}/suspend`, undefined, {
    signal: options?.signal,
    timeout: options?.timeoutMs,
    headers: options?.idempotencyKey
      ? { 'X-Idempotency-Key': options.idempotencyKey }
      : undefined,
  })
}

/** PUT /api/v1/tenants/{slug}/activate ✅ */
export async function activateTenant(slug: string, options?: RequestOptions): Promise<void> {
  await apiClient.put(`${API_V1}/tenants/${slug}/activate`, undefined, {
    signal: options?.signal,
    timeout: options?.timeoutMs,
    headers: options?.idempotencyKey
      ? { 'X-Idempotency-Key': options.idempotencyKey }
      : undefined,
  })
}
