// ── Account Profile API ────────────────────────────────────────────────────────
// Endpoints: /api/v1/tenants/{tenantSlug}/account/profile
// Auth: Bearer JWT — todos los roles autenticados (sin X-KEYGO-ADMIN)
// Semantics: PATCH — solo los campos no-null son actualizados
// Docs: docs/api-docs.json §Account Profile

import { apiClient, tenantUrl } from './client'
import type { BaseResponse } from '@/types/base'
import type {
  UserProfileData,
  UpdateUserProfileRequest,
  ChangePasswordRequest,
  ChangePasswordResult,
  AccountSessionData,
  RevokeAccountSessionResult,
  NotificationPreferencesData,
  UpdateNotificationPreferencesRequest,
  AccountAccessData,
  AccountConnectionData,
  LinkAccountConnectionRequest,
  LinkAccountConnectionResult,
  UnlinkAccountConnectionResult,
} from '@/types/user'
import { unwrapResponseData } from './response'
import type { RequestOptions } from './requestOptions'

// ── Query key constants ────────────────────────────────────────────────────────

export const ACCOUNT_QUERY_KEYS = {
  profile: (tenantSlug: string) => ['account', 'profile', tenantSlug] as const,
  sessions: (tenantSlug: string) => ['account', 'sessions', tenantSlug] as const,
  notificationPreferences: (tenantSlug: string) =>
    ['account', 'notification-preferences', tenantSlug] as const,
  access: (tenantSlug: string) => ['account', 'access', tenantSlug] as const,
  connections: (tenantSlug: string) => ['account', 'connections', tenantSlug] as const,
} as const

// ── Helpers ───────────────────────────────────────────────────────────────────

const profileUrl = (tenantSlug: string) => `${tenantUrl(tenantSlug)}/account/profile`
const changePasswordUrl = (tenantSlug: string) => `${tenantUrl(tenantSlug)}/account/change-password`
const sessionsUrl = (tenantSlug: string) => `${tenantUrl(tenantSlug)}/account/sessions`
const sessionUrl = (tenantSlug: string, sessionId: string) =>
  `${sessionsUrl(tenantSlug)}/${encodeURIComponent(sessionId)}`
const notificationPreferencesUrl = (tenantSlug: string) =>
  `${tenantUrl(tenantSlug)}/account/notification-preferences`
const accessUrl = (tenantSlug: string) => `${tenantUrl(tenantSlug)}/account/access`
const connectionsUrl = (tenantSlug: string) => `${tenantUrl(tenantSlug)}/account/connections`
const linkConnectionUrl = (tenantSlug: string, provider: string) =>
  `${connectionsUrl(tenantSlug)}/${encodeURIComponent(provider)}/link`
const connectionUrl = (tenantSlug: string, connectionId: string) =>
  `${connectionsUrl(tenantSlug)}/${encodeURIComponent(connectionId)}`

// ── Endpoints ─────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/tenants/{tenantSlug}/account/profile ✅
 * Devuelve el perfil completo del usuario autenticado (campos OIDC extendidos).
 * Requiere: Authorization: Bearer <access_token>. No requiere X-KEYGO-ADMIN.
 */
export async function getProfile(
  tenantSlug: string,
  options?: RequestOptions,
): Promise<UserProfileData> {
  const res = await apiClient.get<BaseResponse<UserProfileData>>(profileUrl(tenantSlug), {
    signal: options?.signal,
    timeout: options?.timeoutMs,
  })
  return unwrapResponseData(res.data, 'Error al obtener el perfil')
}

/**
 * PATCH /api/v1/tenants/{tenantSlug}/account/profile ✅
 * Actualiza parcialmente el perfil del usuario autenticado.
 * Solo los campos no-null son modificados (PATCH semántica).
 * Requiere: Authorization: Bearer <access_token>. No requiere X-KEYGO-ADMIN.
 */
export async function updateProfile(
  tenantSlug: string,
  data: UpdateUserProfileRequest,
  options?: RequestOptions,
): Promise<UserProfileData> {
  const res = await apiClient.patch<BaseResponse<UserProfileData>>(profileUrl(tenantSlug), data, {
    signal: options?.signal,
    timeout: options?.timeoutMs,
    headers: options?.idempotencyKey
      ? { 'X-Idempotency-Key': options.idempotencyKey }
      : undefined,
  })
  return unwrapResponseData(res.data, 'Error al actualizar el perfil')
}

/**
 * POST /api/v1/tenants/{tenantSlug}/account/change-password ✅
 * Cambia la contrasena del usuario autenticado validando la contrasena actual.
 */
export async function changePassword(
  tenantSlug: string,
  data: ChangePasswordRequest,
  options?: RequestOptions,
): Promise<ChangePasswordResult> {
  const res = await apiClient.post<BaseResponse<ChangePasswordResult>>(
    changePasswordUrl(tenantSlug),
    data,
    {
      signal: options?.signal,
      timeout: options?.timeoutMs,
      headers: options?.idempotencyKey
        ? { 'X-Idempotency-Key': options.idempotencyKey }
        : undefined,
    },
  )
  return unwrapResponseData(res.data, 'Error al cambiar la contrasena')
}

/**
 * GET /api/v1/tenants/{tenantSlug}/account/sessions ✅
 * Lista las sesiones activas del usuario autenticado.
 */
export async function getSessions(
  tenantSlug: string,
  options?: RequestOptions,
): Promise<AccountSessionData[]> {
  const res = await apiClient.get<BaseResponse<AccountSessionData[]>>(sessionsUrl(tenantSlug), {
    signal: options?.signal,
    timeout: options?.timeoutMs,
  })
  return unwrapResponseData(res.data, 'Error al obtener sesiones activas')
}

/**
 * DELETE /api/v1/tenants/{tenantSlug}/account/sessions/{sessionId} ✅
 * Cierra una sesion remota del usuario autenticado.
 */
export async function revokeSession(
  tenantSlug: string,
  sessionId: string,
  options?: RequestOptions,
): Promise<RevokeAccountSessionResult> {
  const res = await apiClient.delete<BaseResponse<RevokeAccountSessionResult>>(
    sessionUrl(tenantSlug, sessionId),
    {
      signal: options?.signal,
      timeout: options?.timeoutMs,
    },
  )
  return unwrapResponseData(res.data, 'Error al cerrar la sesion seleccionada')
}

/**
 * GET /api/v1/tenants/{tenantSlug}/account/notification-preferences ✅
 * Obtiene preferencias de notificaciones del usuario autenticado.
 */
export async function getNotificationPreferences(
  tenantSlug: string,
  options?: RequestOptions,
): Promise<NotificationPreferencesData> {
  const res = await apiClient.get<BaseResponse<NotificationPreferencesData>>(
    notificationPreferencesUrl(tenantSlug),
    {
      signal: options?.signal,
      timeout: options?.timeoutMs,
    },
  )
  return unwrapResponseData(res.data, 'Error al obtener preferencias de notificacion')
}

/**
 * PATCH /api/v1/tenants/{tenantSlug}/account/notification-preferences ✅
 * Actualiza parcialmente preferencias de notificaciones del usuario autenticado.
 */
export async function updateNotificationPreferences(
  tenantSlug: string,
  data: UpdateNotificationPreferencesRequest,
  options?: RequestOptions,
): Promise<NotificationPreferencesData> {
  const res = await apiClient.patch<BaseResponse<NotificationPreferencesData>>(
    notificationPreferencesUrl(tenantSlug),
    data,
    {
      signal: options?.signal,
      timeout: options?.timeoutMs,
      headers: options?.idempotencyKey
        ? { 'X-Idempotency-Key': options.idempotencyKey }
        : undefined,
    },
  )
  return unwrapResponseData(res.data, 'Error al actualizar preferencias de notificacion')
}

/**
 * GET /api/v1/tenants/{tenantSlug}/account/access ✅
 * Obtiene membresias y roles efectivos por aplicacion para el usuario autenticado.
 */
export async function getAccountAccess(
  tenantSlug: string,
  options?: RequestOptions,
): Promise<AccountAccessData[]> {
  const res = await apiClient.get<BaseResponse<AccountAccessData[]>>(accessUrl(tenantSlug), {
    signal: options?.signal,
    timeout: options?.timeoutMs,
  })
  return unwrapResponseData(res.data, 'Error al obtener permisos de acceso')
}

/**
 * GET /api/v1/tenants/{tenantSlug}/account/connections ⏳ pendiente backend (F-042)
 * Flujo temporal para mock/MSW mientras se publica contrato oficial.
 */
export async function getAccountConnections(
  tenantSlug: string,
  options?: RequestOptions,
): Promise<AccountConnectionData[]> {
  const res = await apiClient.get<BaseResponse<AccountConnectionData[]>>(connectionsUrl(tenantSlug), {
    signal: options?.signal,
    timeout: options?.timeoutMs,
  })
  return unwrapResponseData(res.data, 'Error al obtener conexiones vinculadas')
}

/**
 * POST /api/v1/tenants/{tenantSlug}/account/connections/{provider}/link ⏳ pendiente backend (F-042)
 * Flujo temporal para mock/MSW mientras se publica contrato oficial.
 */
export async function linkAccountConnection(
  tenantSlug: string,
  provider: string,
  data?: LinkAccountConnectionRequest,
  options?: RequestOptions,
): Promise<LinkAccountConnectionResult> {
  const res = await apiClient.post<BaseResponse<LinkAccountConnectionResult>>(
    linkConnectionUrl(tenantSlug, provider),
    data,
    {
      signal: options?.signal,
      timeout: options?.timeoutMs,
      headers: options?.idempotencyKey
        ? { 'X-Idempotency-Key': options.idempotencyKey }
        : undefined,
    },
  )
  return unwrapResponseData(res.data, 'Error al vincular conexion externa')
}

/**
 * DELETE /api/v1/tenants/{tenantSlug}/account/connections/{connectionId} ⏳ pendiente backend (F-042)
 * Flujo temporal para mock/MSW mientras se publica contrato oficial.
 */
export async function unlinkAccountConnection(
  tenantSlug: string,
  connectionId: string,
  options?: RequestOptions,
): Promise<UnlinkAccountConnectionResult> {
  const res = await apiClient.delete<BaseResponse<UnlinkAccountConnectionResult>>(
    connectionUrl(tenantSlug, connectionId),
    {
      signal: options?.signal,
      timeout: options?.timeoutMs,
    },
  )
  return unwrapResponseData(res.data, 'Error al desvincular conexion externa')
}
