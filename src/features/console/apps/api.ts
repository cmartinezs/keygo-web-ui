// ── Client Apps API ────────────────────────────────────────────────────────────
// Endpoints: /api/v1/tenants/{tenantSlug}/apps/*
//            /api/v1/tenants/{tenantSlug}/apps/{clientId}/roles
// Auth: Bearer JWT (ADMIN o ADMIN_TENANT con tenant match)
// Docs: docs/api-docs.json §Client Apps, §App Roles

import { apiClient, tenantUrl } from '@/shared/api/client'
import type { BaseResponse } from '@/shared/types/base'
import { unwrapResponseData } from '@/shared/api/response'
import type {
  ClientAppData,
  ClientAppCreatedData,
  ClientAppSecretData,
  CreateClientAppRequest,
  UpdateClientAppRequest,
  AppRoleData,
  CreateAppRoleRequest,
} from '@/shared/types/clientapp'
import type { RequestOptions } from '@/shared/api/requestOptions'

// ── Query key constants ────────────────────────────────────────────────────────

export const CLIENT_APP_QUERY_KEYS = {
  all: (tenantSlug: string) => ['client-apps', tenantSlug] as const,
  detail: (tenantSlug: string, clientId: string) =>
    ['client-apps', tenantSlug, clientId] as const,
  roles: (tenantSlug: string, clientAppId: string) =>
    ['client-apps', tenantSlug, clientAppId, 'roles'] as const,
} as const

// ── Helpers ───────────────────────────────────────────────────────────────────

const appsUrl = (tenantSlug: string) => `${tenantUrl(tenantSlug)}/apps`
const appUrl = (tenantSlug: string, clientId: string) => `${appsUrl(tenantSlug)}/${clientId}`

// ── Client Apps ───────────────────────────────────────────────────────────────

/** GET /api/v1/tenants/{tenantSlug}/apps ✅ — lista todas las apps del tenant. */
export async function listClientApps(
  tenantSlug: string,
  options?: RequestOptions,
): Promise<ClientAppData[]> {
  const res = await apiClient.get<BaseResponse<ClientAppData[]>>(appsUrl(tenantSlug), {
    signal: options?.signal,
    timeout: options?.timeoutMs,
  })
  return unwrapResponseData(res.data, 'Error al listar apps')
}

/** GET /api/v1/tenants/{tenantSlug}/apps/{clientId} ✅ */
export async function getClientApp(
  tenantSlug: string,
  clientId: string,
  options?: RequestOptions,
): Promise<ClientAppData> {
  const res = await apiClient.get<BaseResponse<ClientAppData>>(appUrl(tenantSlug, clientId), {
    signal: options?.signal,
    timeout: options?.timeoutMs,
  })
  return unwrapResponseData(res.data, 'App no encontrada')
}

/** POST /api/v1/tenants/{tenantSlug}/apps ✅ — crea una nueva ClientApp. */
export async function createClientApp(
  tenantSlug: string,
  data: CreateClientAppRequest,
  options?: RequestOptions,
): Promise<ClientAppCreatedData> {
  const res = await apiClient.post<BaseResponse<ClientAppCreatedData>>(appsUrl(tenantSlug), data, {
    signal: options?.signal,
    timeout: options?.timeoutMs,
    headers: options?.idempotencyKey
      ? { 'X-Idempotency-Key': options.idempotencyKey }
      : undefined,
  })
  return unwrapResponseData(res.data, 'Error al crear la app')
}

/** PUT /api/v1/tenants/{tenantSlug}/apps/{clientId} ✅ — actualiza nombre, descripción y configuración. */
export async function updateClientApp(
  tenantSlug: string,
  clientId: string,
  data: UpdateClientAppRequest,
  options?: RequestOptions,
): Promise<ClientAppData> {
  const res = await apiClient.put<BaseResponse<ClientAppData>>(appUrl(tenantSlug, clientId), data, {
    signal: options?.signal,
    timeout: options?.timeoutMs,
    headers: options?.idempotencyKey
      ? { 'X-Idempotency-Key': options.idempotencyKey }
      : undefined,
  })
  return unwrapResponseData(res.data, 'Error al actualizar la app')
}

/** POST /api/v1/tenants/{tenantSlug}/apps/{clientId}/rotate-secret ✅ — rota el clientSecret. */
export async function rotateClientAppSecret(
  tenantSlug: string,
  clientId: string,
  options?: RequestOptions,
): Promise<ClientAppSecretData> {
  const res = await apiClient.post<BaseResponse<ClientAppSecretData>>(
    `${appUrl(tenantSlug, clientId)}/rotate-secret`,
    undefined,
    {
      signal: options?.signal,
      timeout: options?.timeoutMs,
      headers: options?.idempotencyKey
        ? { 'X-Idempotency-Key': options.idempotencyKey }
        : undefined,
    },
  )
  return unwrapResponseData(res.data, 'Error al rotar el secret')
}

// ── App Roles ─────────────────────────────────────────────────────────────────

/** GET /api/v1/tenants/{tenantSlug}/apps/{clientAppId}/roles ✅ */
export async function listAppRoles(
  tenantSlug: string,
  clientAppId: string,
  options?: RequestOptions,
): Promise<AppRoleData[]> {
  const res = await apiClient.get<BaseResponse<AppRoleData[]>>(
    `${appUrl(tenantSlug, clientAppId)}/roles`,
    {
      signal: options?.signal,
      timeout: options?.timeoutMs,
    },
  )
  return unwrapResponseData(res.data, 'Error al listar roles')
}

/** POST /api/v1/tenants/{tenantSlug}/apps/{clientAppId}/roles ✅ */
export async function createAppRole(
  tenantSlug: string,
  clientAppId: string,
  data: CreateAppRoleRequest,
  options?: RequestOptions,
): Promise<AppRoleData> {
  const res = await apiClient.post<BaseResponse<AppRoleData>>(
    `${appUrl(tenantSlug, clientAppId)}/roles`,
    data,
    {
      signal: options?.signal,
      timeout: options?.timeoutMs,
      headers: options?.idempotencyKey
        ? { 'X-Idempotency-Key': options.idempotencyKey }
        : undefined,
    },
  )
  return unwrapResponseData(res.data, 'Error al crear el rol')
}
