// ── Memberships API ────────────────────────────────────────────────────────────
// Endpoints: /api/v1/tenants/{tenantSlug}/memberships
// Auth: Bearer JWT (ADMIN o ADMIN_TENANT con tenant match)
// Docs: docs/api-docs.json §Memberships

import { apiClient, tenantUrl } from './client'
import type { BaseResponse } from '@/types/base'
import type { MembershipData, CreateMembershipRequest } from '@/types/membership'

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
): Promise<MembershipData[]> {
  const res = await apiClient.get<BaseResponse<MembershipData[]>>(membershipsUrl(tenantSlug), {
    params: { client_app_id: clientAppId },
  })
  if (!res.data.data)
    throw new Error(res.data.failure?.message ?? 'Error al listar memberships')
  return res.data.data
}

/**
 * GET /api/v1/tenants/{tenantSlug}/memberships?user_id={uuid} ✅
 * Lista todas las memberships de un usuario.
 */
export async function listMembershipsByUser(
  tenantSlug: string,
  userId: string,
): Promise<MembershipData[]> {
  const res = await apiClient.get<BaseResponse<MembershipData[]>>(membershipsUrl(tenantSlug), {
    params: { user_id: userId },
  })
  if (!res.data.data)
    throw new Error(res.data.failure?.message ?? 'Error al listar memberships del usuario')
  return res.data.data
}

/**
 * POST /api/v1/tenants/{tenantSlug}/memberships ✅
 * Crea una membership (asigna usuario a una app con roles).
 */
export async function createMembership(
  tenantSlug: string,
  data: CreateMembershipRequest,
): Promise<MembershipData> {
  const res = await apiClient.post<BaseResponse<MembershipData>>(membershipsUrl(tenantSlug), data)
  if (!res.data.data) throw new Error(res.data.failure?.message ?? 'Error al crear membership')
  return res.data.data
}

/**
 * DELETE /api/v1/tenants/{tenantSlug}/memberships/{membershipId} ✅
 * Revoca una membership.
 */
export async function revokeMembership(
  tenantSlug: string,
  membershipId: string,
): Promise<void> {
  await apiClient.delete(`${membershipsUrl(tenantSlug)}/${membershipId}`)
}
