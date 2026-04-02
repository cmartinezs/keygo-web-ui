// ── Account Profile API ────────────────────────────────────────────────────────
// Endpoints: /api/v1/tenants/{tenantSlug}/account/profile
// Auth: Bearer JWT — todos los roles autenticados (sin X-KEYGO-ADMIN)
// Semantics: PATCH — solo los campos no-null son actualizados
// Docs: docs/api-docs.json §Account Profile

import { apiClient, tenantUrl } from './client'
import type { BaseResponse } from '@/types/base'
import type { UserProfileData, UpdateUserProfileRequest } from '@/types/user'
import { unwrapResponseData } from './response'
import type { RequestOptions } from './requestOptions'

// ── Query key constants ────────────────────────────────────────────────────────

export const ACCOUNT_QUERY_KEYS = {
  profile: (tenantSlug: string) => ['account', 'profile', tenantSlug] as const,
} as const

// ── Helpers ───────────────────────────────────────────────────────────────────

const profileUrl = (tenantSlug: string) => `${tenantUrl(tenantSlug)}/account/profile`

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
