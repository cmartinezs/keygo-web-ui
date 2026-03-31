// ── Client Apps API ────────────────────────────────────────────────────────────
// Endpoints: /api/v1/tenants/{tenantSlug}/apps/*
//            /api/v1/tenants/{tenantSlug}/apps/{clientId}/roles
// Auth: Bearer JWT (ADMIN o ADMIN_TENANT con tenant match)
// Docs: docs/api-docs.json §Client Apps, §App Roles

import { apiClient, tenantUrl } from './client'
import type { BaseResponse } from '@/types/base'
import type {
  ClientAppData,
  ClientAppCreatedData,
  ClientAppSecretData,
  CreateClientAppRequest,
  UpdateClientAppRequest,
  AppRoleData,
  CreateAppRoleRequest,
} from '@/types/clientapp'

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
export async function listClientApps(tenantSlug: string): Promise<ClientAppData[]> {
  const res = await apiClient.get<BaseResponse<ClientAppData[]>>(appsUrl(tenantSlug))
  if (!res.data.data) throw new Error(res.data.failure?.message ?? 'Error al listar apps')
  return res.data.data
}

/** GET /api/v1/tenants/{tenantSlug}/apps/{clientId} ✅ */
export async function getClientApp(
  tenantSlug: string,
  clientId: string,
): Promise<ClientAppData> {
  const res = await apiClient.get<BaseResponse<ClientAppData>>(appUrl(tenantSlug, clientId))
  if (!res.data.data) throw new Error(res.data.failure?.message ?? 'App no encontrada')
  return res.data.data
}

/** POST /api/v1/tenants/{tenantSlug}/apps ✅ — crea una nueva ClientApp. */
export async function createClientApp(
  tenantSlug: string,
  data: CreateClientAppRequest,
): Promise<ClientAppCreatedData> {
  const res = await apiClient.post<BaseResponse<ClientAppCreatedData>>(appsUrl(tenantSlug), data)
  if (!res.data.data) throw new Error(res.data.failure?.message ?? 'Error al crear la app')
  return res.data.data
}

/** PUT /api/v1/tenants/{tenantSlug}/apps/{clientId} ✅ — actualiza nombre, descripción y configuración. */
export async function updateClientApp(
  tenantSlug: string,
  clientId: string,
  data: UpdateClientAppRequest,
): Promise<ClientAppData> {
  const res = await apiClient.put<BaseResponse<ClientAppData>>(appUrl(tenantSlug, clientId), data)
  if (!res.data.data) throw new Error(res.data.failure?.message ?? 'Error al actualizar la app')
  return res.data.data
}

/** POST /api/v1/tenants/{tenantSlug}/apps/{clientId}/rotate-secret ✅ — rota el clientSecret. */
export async function rotateClientAppSecret(
  tenantSlug: string,
  clientId: string,
): Promise<ClientAppSecretData> {
  const res = await apiClient.post<BaseResponse<ClientAppSecretData>>(
    `${appUrl(tenantSlug, clientId)}/rotate-secret`,
  )
  if (!res.data.data) throw new Error(res.data.failure?.message ?? 'Error al rotar el secret')
  return res.data.data
}

// ── App Roles ─────────────────────────────────────────────────────────────────

/** GET /api/v1/tenants/{tenantSlug}/apps/{clientAppId}/roles ✅ */
export async function listAppRoles(
  tenantSlug: string,
  clientAppId: string,
): Promise<AppRoleData[]> {
  const res = await apiClient.get<BaseResponse<AppRoleData[]>>(
    `${appUrl(tenantSlug, clientAppId)}/roles`,
  )
  if (!res.data.data) throw new Error(res.data.failure?.message ?? 'Error al listar roles')
  return res.data.data
}

/** POST /api/v1/tenants/{tenantSlug}/apps/{clientAppId}/roles ✅ */
export async function createAppRole(
  tenantSlug: string,
  clientAppId: string,
  data: CreateAppRoleRequest,
): Promise<AppRoleData> {
  const res = await apiClient.post<BaseResponse<AppRoleData>>(
    `${appUrl(tenantSlug, clientAppId)}/roles`,
    data,
  )
  if (!res.data.data) throw new Error(res.data.failure?.message ?? 'Error al crear el rol')
  return res.data.data
}
