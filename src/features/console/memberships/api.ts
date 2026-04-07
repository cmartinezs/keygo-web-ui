// ── Memberships API ────────────────────────────────────────────────────────────
// Endpoints: /api/v1/tenants/{tenantSlug}/memberships
// Auth: Bearer JWT (ADMIN o ADMIN_TENANT con tenant match)
// Docs: docs/api-docs.json §Memberships

import { apiClient, tenantUrl } from '@/shared/api/client'
import type { BaseResponse } from '@/shared/types/base'
import type { MembershipData, CreateMembershipRequest } from '@/shared/types/membership'
import { unwrapResponseData } from '@/shared/api/response'
import type { RequestOptions } from '@/shared/api/requestOptions'

// ── Query key constants ────────────────────────────────────────────────────────

export const MEMBERSHIP_QUERY_KEYS = {
  byApp: (tenantSlug: string, clientAppId: string) =>
    ['memberships', tenantSlug, 'app', clientAppId] as const,
  byUser: (tenantSlug: string, userId: string) =>
    ['memberships', tenantSlug, 'user', userId] as const,
} as const

// ── Helpers ───────────────────────────────────────────────────────────────────

const membershipsUrl = (tenantSlug: string) => `${tenantUrl(tenantSlug)}/memberships`

// ── Memberships ───────────────────────────────────────────────────────────────

/**
 * GET /api/v1/tenants/{tenantSlug}/memberships?client_app_id={uuid} ✅
 * Lista todas las memberships de una app.
 */
export async function listMembershipsByApp(
  tenantSlug: string,
  clientAppId: string,
  options?: RequestOptions,
): Promise<MembershipData[]> {
  const res = await apiClient.get<BaseResponse<MembershipData[]>>(membershipsUrl(tenantSlug), {
    params: { client_app_id: clientAppId },
    signal: options?.signal,
    timeout: options?.timeoutMs,
  })
  return unwrapResponseData(res.data, 'Error al listar memberships')
}

/**
 * GET /api/v1/tenants/{tenantSlug}/memberships?user_id={uuid} ✅
 * Lista todas las memberships de un usuario.
 */
export async function listMembershipsByUser(
  tenantSlug: string,
  userId: string,
  options?: RequestOptions,
): Promise<MembershipData[]> {
  const res = await apiClient.get<BaseResponse<MembershipData[]>>(membershipsUrl(tenantSlug), {
    params: { user_id: userId },
    signal: options?.signal,
    timeout: options?.timeoutMs,
  })
  return unwrapResponseData(res.data, 'Error al listar memberships del usuario')
}

/**
 * POST /api/v1/tenants/{tenantSlug}/memberships ✅
 * Crea una membership (asigna usuario a una app con roles).
 */
export async function createMembership(
  tenantSlug: string,
  data: CreateMembershipRequest,
  options?: RequestOptions,
): Promise<MembershipData> {
  const res = await apiClient.post<BaseResponse<MembershipData>>(membershipsUrl(tenantSlug), data, {
    signal: options?.signal,
    timeout: options?.timeoutMs,
    headers: options?.idempotencyKey
      ? { 'X-Idempotency-Key': options.idempotencyKey }
      : undefined,
  })
  return unwrapResponseData(res.data, 'Error al crear membership')
}

/**
 * DELETE /api/v1/tenants/{tenantSlug}/memberships/{membershipId} ✅
 * Revoca una membership.
 */
export async function revokeMembership(
  tenantSlug: string,
  membershipId: string,
  options?: RequestOptions,
): Promise<void> {
  await apiClient.delete(`${membershipsUrl(tenantSlug)}/${membershipId}`, {
    signal: options?.signal,
    timeout: options?.timeoutMs,
    headers: options?.idempotencyKey
      ? { 'X-Idempotency-Key': options.idempotencyKey }
      : undefined,
  })
}
