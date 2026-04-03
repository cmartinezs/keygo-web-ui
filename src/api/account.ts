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
  ForgotPasswordRequest,
  ForgotPasswordResult,
  RecoverPasswordRequest,
  RecoverPasswordResult,
  AccountResetPasswordRequest,
  AccountResetPasswordResult,
  AccountSessionData,
  RevokeAccountSessionResult,
  NotificationPreferencesData,
  UpdateNotificationPreferencesRequest,
  AccountAccessData,
  AccountConnectionData,
  LinkAccountConnectionRequest,
  LinkAccountConnectionResult,
  UnlinkAccountConnectionResult,
  WireAccountConnectionData,
  WireLinkAccountConnectionResult,
  WireChangePasswordRequest,
  WireAccountSessionData,
  WireRevokeSessionResult,
  WireNotificationPreferencesData,
  WireUpdateNotificationPreferencesRequest,
  WireUserAccessData,
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
const forgotPasswordUrl = (tenantSlug: string) => `${tenantUrl(tenantSlug)}/account/forgot-password`
const recoverPasswordUrl = (tenantSlug: string) => `${tenantUrl(tenantSlug)}/account/recover-password`
const resetPasswordUrl = (tenantSlug: string) => `${tenantUrl(tenantSlug)}/account/reset-password`
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

// ── Mappers (boundary wire ↔ internal) ────────────────────────────────────────
// Convierten entre el formato camelCase del backend y los DTOs snake_case internos.
// Solo se usan dentro de este módulo; nunca exponer al exterior.

function toWireChangePassword(req: ChangePasswordRequest): WireChangePasswordRequest {
  return { currentPassword: req.current_password, newPassword: req.new_password }
}

function fromWireSession(wire: WireAccountSessionData): AccountSessionData {
  return {
    session_id: wire.sessionId,
    status: wire.status,
    browser: wire.browser,
    os: wire.os,
    device_type: wire.deviceType,
    ip_address: wire.ipAddress,
    created_at: wire.createdAt,
    last_accessed_at: wire.lastAccessedAt,
    expires_at: wire.expiresAt,
    is_current: wire.isCurrent,
  }
}

function fromWireRevokeSession(wire: WireRevokeSessionResult): RevokeAccountSessionResult {
  return { session_id: wire.sessionId, already_closed: wire.alreadyClosed }
}

function fromWireNotificationPreferences(
  wire: WireNotificationPreferencesData,
): NotificationPreferencesData {
  return {
    security_alerts_email: wire.securityAlertsEmail,
    security_alerts_in_app: wire.securityAlertsInApp,
    billing_alerts_email: wire.billingAlertsEmail,
    product_updates_email: wire.productUpdatesEmail,
    weekly_digest: wire.weeklyDigest,
  }
}

function toWireUpdateNotificationPreferences(
  req: UpdateNotificationPreferencesRequest,
): WireUpdateNotificationPreferencesRequest {
  return {
    ...(req.security_alerts_email !== undefined && { securityAlertsEmail: req.security_alerts_email }),
    ...(req.security_alerts_in_app !== undefined && { securityAlertsInApp: req.security_alerts_in_app }),
    ...(req.billing_alerts_email !== undefined && { billingAlertsEmail: req.billing_alerts_email }),
    ...(req.product_updates_email !== undefined && { productUpdatesEmail: req.product_updates_email }),
    ...(req.weekly_digest !== undefined && { weeklyDigest: req.weekly_digest }),
  }
}

function fromWireUserAccess(wire: WireUserAccessData): AccountAccessData {
  return {
    app_id: wire.clientAppId,
    app_name: wire.clientAppName,
    membership_id: wire.membershipId,
    status: wire.status,
    roles: wire.roles,
  }
}

function fromWireAccountConnection(wire: WireAccountConnectionData): AccountConnectionData {
  return {
    id: wire.id,
    provider_name: wire.provider_name ?? wire.providerName ?? wire.provider ?? 'UNKNOWN',
    status: wire.status,
    connected_at: wire.connected_at ?? wire.connectedAt ?? wire.linked_at ?? wire.linkedAt ?? '',
    display_name: wire.display_name ?? wire.displayName ?? null,
    avatar_url: wire.avatar_url ?? wire.avatarUrl ?? null,
    scopes: wire.scopes ?? [],
    last_used_at: wire.last_used_at ?? wire.lastUsedAt ?? null,
  }
}

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
    toWireChangePassword(data),
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
 * POST /api/v1/tenants/{tenantSlug}/account/forgot-password ✅
 * Solicita token de recuperacion por email (respuesta anti-enumeracion).
 */
export async function forgotPassword(
  tenantSlug: string,
  data: ForgotPasswordRequest,
  options?: RequestOptions,
): Promise<ForgotPasswordResult> {
  const res = await apiClient.post<BaseResponse<ForgotPasswordResult>>(
    forgotPasswordUrl(tenantSlug),
    data,
    {
      signal: options?.signal,
      timeout: options?.timeoutMs,
      headers: options?.idempotencyKey
        ? { 'X-Idempotency-Key': options.idempotencyKey }
        : undefined,
    },
  )
  return unwrapResponseData(res.data, 'Error al solicitar recuperacion de contrasena')
}

/**
 * POST /api/v1/tenants/{tenantSlug}/account/recover-password ✅
 * Recupera contrasena por token one-time enviado por email.
 */
export async function recoverPassword(
  tenantSlug: string,
  data: RecoverPasswordRequest,
  options?: RequestOptions,
): Promise<RecoverPasswordResult> {
  const res = await apiClient.post<BaseResponse<RecoverPasswordResult>>(
    recoverPasswordUrl(tenantSlug),
    data,
    {
      signal: options?.signal,
      timeout: options?.timeoutMs,
      headers: options?.idempotencyKey
        ? { 'X-Idempotency-Key': options.idempotencyKey }
        : undefined,
    },
  )
  return unwrapResponseData(res.data, 'Error al recuperar contrasena')
}

/**
 * POST /api/v1/tenants/{tenantSlug}/account/reset-password ✅
 * Resetea contrasena usando password temporal entregada por administrador.
 */
export async function resetPasswordWithTemporaryPassword(
  tenantSlug: string,
  data: AccountResetPasswordRequest,
  options?: RequestOptions,
): Promise<AccountResetPasswordResult> {
  const res = await apiClient.post<BaseResponse<AccountResetPasswordResult>>(
    resetPasswordUrl(tenantSlug),
    data,
    {
      signal: options?.signal,
      timeout: options?.timeoutMs,
      headers: options?.idempotencyKey
        ? { 'X-Idempotency-Key': options.idempotencyKey }
        : undefined,
    },
  )
  return unwrapResponseData(res.data, 'Error al resetear contrasena temporal')
}

/**
 * GET /api/v1/tenants/{tenantSlug}/account/sessions ✅
 * Lista las sesiones activas del usuario autenticado.
 */
export async function getSessions(
  tenantSlug: string,
  options?: RequestOptions,
): Promise<AccountSessionData[]> {
  const res = await apiClient.get<BaseResponse<WireAccountSessionData[]>>(sessionsUrl(tenantSlug), {
    signal: options?.signal,
    timeout: options?.timeoutMs,
  })
  return unwrapResponseData(res.data, 'Error al obtener sesiones activas').map(fromWireSession)
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
  const res = await apiClient.delete<BaseResponse<WireRevokeSessionResult>>(
    sessionUrl(tenantSlug, sessionId),
    {
      signal: options?.signal,
      timeout: options?.timeoutMs,
    },
  )
  return fromWireRevokeSession(unwrapResponseData(res.data, 'Error al cerrar la sesion seleccionada'))
}

/**
 * GET /api/v1/tenants/{tenantSlug}/account/notification-preferences ✅
 * Obtiene preferencias de notificaciones del usuario autenticado.
 */
export async function getNotificationPreferences(
  tenantSlug: string,
  options?: RequestOptions,
): Promise<NotificationPreferencesData> {
  const res = await apiClient.get<BaseResponse<WireNotificationPreferencesData>>(
    notificationPreferencesUrl(tenantSlug),
    {
      signal: options?.signal,
      timeout: options?.timeoutMs,
    },
  )
  return fromWireNotificationPreferences(
    unwrapResponseData(res.data, 'Error al obtener preferencias de notificacion'),
  )
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
  const res = await apiClient.patch<BaseResponse<WireNotificationPreferencesData>>(
    notificationPreferencesUrl(tenantSlug),
    toWireUpdateNotificationPreferences(data),
    {
      signal: options?.signal,
      timeout: options?.timeoutMs,
      headers: options?.idempotencyKey
        ? { 'X-Idempotency-Key': options.idempotencyKey }
        : undefined,
    },
  )
  return fromWireNotificationPreferences(
    unwrapResponseData(res.data, 'Error al actualizar preferencias de notificacion'),
  )
}

/**
 * GET /api/v1/tenants/{tenantSlug}/account/access ✅
 * Obtiene membresias y roles efectivos por aplicacion para el usuario autenticado.
 */
export async function getAccountAccess(
  tenantSlug: string,
  options?: RequestOptions,
): Promise<AccountAccessData[]> {
  const res = await apiClient.get<BaseResponse<WireUserAccessData[]>>(accessUrl(tenantSlug), {
    signal: options?.signal,
    timeout: options?.timeoutMs,
  })
  return unwrapResponseData(res.data, 'Error al obtener permisos de acceso').map(fromWireUserAccess)
}

/**
 * GET /api/v1/tenants/{tenantSlug}/account/connections ⏳ pendiente backend (F-042)
 * Transicion: acepta wire snake_case o camelCase y normaliza a DTO interno estable.
 */
export async function getAccountConnections(
  tenantSlug: string,
  options?: RequestOptions,
): Promise<AccountConnectionData[]> {
  const res = await apiClient.get<BaseResponse<WireAccountConnectionData[]>>(connectionsUrl(tenantSlug), {
    signal: options?.signal,
    timeout: options?.timeoutMs,
  })
  return unwrapResponseData(res.data, 'Error al obtener conexiones vinculadas').map(
    fromWireAccountConnection,
  )
}

/**
 * POST /api/v1/tenants/{tenantSlug}/account/connections/{provider}/link ⏳ pendiente backend (F-042)
 * Transicion: normaliza conexion retornada para evitar quiebres de UI durante rollout.
 */
export async function linkAccountConnection(
  tenantSlug: string,
  provider: string,
  data?: LinkAccountConnectionRequest,
  options?: RequestOptions,
): Promise<LinkAccountConnectionResult> {
  const res = await apiClient.post<BaseResponse<WireLinkAccountConnectionResult>>(
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
  const result = unwrapResponseData(res.data, 'Error al vincular conexion externa')
  return {
    linked: result.linked,
    connection: fromWireAccountConnection(result.connection),
  }
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
