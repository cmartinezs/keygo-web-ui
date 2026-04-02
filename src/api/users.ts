// ── Users API ──────────────────────────────────────────────────────────────────
// Endpoints de gestión: /api/v1/tenants/{tenantSlug}/users/*  (ADMIN / ADMIN_TENANT)
// Endpoints de self-registration: /api/v1/tenants/{tenantSlug}/apps/{clientId}/register
// Docs: docs/api-docs.json §Users

import { apiClient, API_V1, tenantUrl } from './client'
import type { BaseResponse } from '@/types/base'
import { unwrapResponseData } from './response'
import type {
  UserData,
  CreateUserRequest,
  UpdateUserRequest,
  ResetPasswordRequest,
  RegistrationData,
} from '@/types/user'
import type { RequestOptions } from './requestOptions'

// ── Query key constants ────────────────────────────────────────────────────────

export const USER_QUERY_KEYS = {
  all: (tenantSlug: string) => ['users', tenantSlug] as const,
  detail: (tenantSlug: string, userId: string) => ['users', tenantSlug, userId] as const,
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

