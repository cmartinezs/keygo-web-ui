// ── Users API ──────────────────────────────────────────────────────────────────
// Endpoints de gestión: /api/v1/tenants/{tenantSlug}/users/*  (ADMIN / ADMIN_TENANT)
// Endpoints de self-registration: /api/v1/tenants/{tenantSlug}/apps/{clientId}/register
// Docs: docs/api-docs.json §Users

import { apiClient, API_V1, tenantUrl } from '@/shared/api/client'
import type { BaseResponse } from '@/shared/types/base'
import { unwrapResponseData } from '@/shared/api/response'
import type {
  UserData,
  CreateUserRequest,
  UpdateUserRequest,
  ResetPasswordRequest,
  RegistrationData,
  SuspendUserResult,
  ActivateUserResult,
  AccountSessionData,
} from '@/shared/types/user'
import type { RequestOptions } from '@/shared/api/requestOptions'

// ── Query key constants ────────────────────────────────────────────────────────

export const USER_QUERY_KEYS = {
  all: (tenantSlug: string) => ['users', tenantSlug] as const,
  detail: (tenantSlug: string, userId: string) => ['users', tenantSlug, userId] as const,
  sessions: (tenantSlug: string, userId: string) => ['users', tenantSlug, userId, 'sessions'] as const,
} as const

// ── Helpers ───────────────────────────────────────────────────────────────────

const usersUrl = (tenantSlug: string) => `${tenantUrl(tenantSlug)}/users`
const userUrl = (tenantSlug: string, userId: string) => `${usersUrl(tenantSlug)}/${userId}`

// ── Tenant user management (ADMIN / ADMIN_TENANT) ─────────────────────────────

/** GET /api/v1/tenants/{tenantSlug}/users ✅ — lista usuarios del tenant. */
export async function listUsers(
  tenantSlug: string,
  options?: RequestOptions,
): Promise<UserData[]> {
  const res = await apiClient.get<BaseResponse<UserData[]>>(usersUrl(tenantSlug), {
    signal: options?.signal,
    timeout: options?.timeoutMs,
  })
  return unwrapResponseData(res.data, 'Error al listar usuarios')
}

/** GET /api/v1/tenants/{tenantSlug}/users/{userId} ✅ */
export async function getUser(
  tenantSlug: string,
  userId: string,
  options?: RequestOptions,
): Promise<UserData> {
  const res = await apiClient.get<BaseResponse<UserData>>(userUrl(tenantSlug, userId), {
    signal: options?.signal,
    timeout: options?.timeoutMs,
  })
  return unwrapResponseData(res.data, 'Usuario no encontrado')
}

/** POST /api/v1/tenants/{tenantSlug}/users ✅ — crea un usuario en el tenant. */
export async function createUser(
  tenantSlug: string,
  data: CreateUserRequest,
  options?: RequestOptions,
): Promise<UserData> {
  const res = await apiClient.post<BaseResponse<UserData>>(usersUrl(tenantSlug), data, {
    signal: options?.signal,
    timeout: options?.timeoutMs,
    headers: options?.idempotencyKey
      ? { 'X-Idempotency-Key': options.idempotencyKey }
      : undefined,
  })
  return unwrapResponseData(res.data, 'Error al crear el usuario')
}

/** PUT /api/v1/tenants/{tenantSlug}/users/{userId} ✅ — actualiza firstName y lastName. */
export async function updateUser(
  tenantSlug: string,
  userId: string,
  data: UpdateUserRequest,
  options?: RequestOptions,
): Promise<UserData> {
  const res = await apiClient.put<BaseResponse<UserData>>(userUrl(tenantSlug, userId), data, {
    signal: options?.signal,
    timeout: options?.timeoutMs,
    headers: options?.idempotencyKey
      ? { 'X-Idempotency-Key': options.idempotencyKey }
      : undefined,
  })
  return unwrapResponseData(res.data, 'Error al actualizar usuario')
}

/** PUT /api/v1/tenants/{tenantSlug}/users/{userId}/suspend ✅ (T-033 integrado) */
export async function suspendUser(
  tenantSlug: string,
  userId: string,
  options?: RequestOptions,
): Promise<SuspendUserResult> {
  const res = await apiClient.put<BaseResponse<SuspendUserResult>>(
    `${userUrl(tenantSlug, userId)}/suspend`,
    {},
    {
      signal: options?.signal,
      timeout: options?.timeoutMs,
      headers: options?.idempotencyKey
        ? { 'X-Idempotency-Key': options.idempotencyKey }
        : undefined,
    },
  )
  return unwrapResponseData(res.data, 'Error al suspender el usuario')
}

/** PUT /api/v1/tenants/{tenantSlug}/users/{userId}/activate ✅ (T-033 integrado) */
export async function activateUser(
  tenantSlug: string,
  userId: string,
  options?: RequestOptions,
): Promise<ActivateUserResult> {
  const res = await apiClient.put<BaseResponse<ActivateUserResult>>(
    `${userUrl(tenantSlug, userId)}/activate`,
    {},
    {
      signal: options?.signal,
      timeout: options?.timeoutMs,
      headers: options?.idempotencyKey
        ? { 'X-Idempotency-Key': options.idempotencyKey }
        : undefined,
    },
  )
  return unwrapResponseData(res.data, 'Error al activar el usuario')
}

/** GET /api/v1/tenants/{tenantSlug}/users/{userId}/sessions ✅ (T-110 integrado) */
export async function getAdminUserSessions(
  tenantSlug: string,
  userId: string,
  options?: RequestOptions,
): Promise<AccountSessionData[]> {
  const res = await apiClient.get<BaseResponse<AccountSessionData[]>>(
    `${userUrl(tenantSlug, userId)}/sessions`,
    {
      signal: options?.signal,
      timeout: options?.timeoutMs,
    },
  )
  return unwrapResponseData(res.data, 'Error al obtener las sesiones del usuario')
}

/** POST /api/v1/tenants/{tenantSlug}/users/{userId}/reset-password ✅ */
export async function resetUserPassword(
  tenantSlug: string,
  userId: string,
  data: ResetPasswordRequest,
  options?: RequestOptions,
): Promise<void> {
  await apiClient.post(`${userUrl(tenantSlug, userId)}/reset-password`, data, {
    signal: options?.signal,
    timeout: options?.timeoutMs,
    headers: options?.idempotencyKey
      ? { 'X-Idempotency-Key': options.idempotencyKey }
      : undefined,
  })
}

// ── Self-registration (público) ───────────────────────────────────────────────

/**
 * POST /api/v1/tenants/{tenantSlug}/apps/{clientId}/register
 * Público — no requiere autenticación.
 * Crea el usuario en estado PENDING y envía email de verificación.
 */
export async function registerUser(
  tenantSlug: string,
  clientId: string,
  data: {
    username: string
    email: string
    password: string
    first_name?: string
    last_name?: string
  },
): Promise<RegistrationData> {
  const res = await apiClient.post<BaseResponse<RegistrationData>>(
    `${API_V1}/tenants/${encodeURIComponent(tenantSlug)}/apps/${encodeURIComponent(clientId)}/register`,
    data,
  )
  return unwrapResponseData(res.data, 'Error al registrar usuario')
}

