// ── Platform — TypeScript DTOs ─────────────────────────────────────────────
// Source of truth: docs/api-docs.json → schemas: PlatformUserData, PlatformStatsData
// ⚠️ Wire format: snake_case (Jackson ObjectMapper)

// ── Platform users ────────────────────────────────────────────────────────────

export type PlatformUserStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING'

/** Respuesta de GET/POST /platform/users y /platform/users/{userId} */
export interface PlatformUserData {
  id: string
  email: string
  username: string
  first_name: string
  last_name: string
  status: PlatformUserStatus
}

/** Request de POST /platform/users */
export interface CreatePlatformUserRequest {
  email: string
  username: string
  password: string
  first_name?: string
  last_name?: string
}

/** Request de PUT /platform/users/{userId} ⏳ pendiente backend */
export interface UpdatePlatformUserRequest {
  first_name?: string
  last_name?: string
}

/** Request de POST /platform/users/{userId}/platform-roles */
export interface AssignPlatformRoleRequest {
  role: string
}

/** Respuesta de GET /platform/users/{userId}/platform-roles ⏳ pendiente backend */
export interface PlatformUserRoleData {
  role_code: string
  assigned_at: string
}

/** Parámetros de filtrado para GET /platform/users ⏳ pendiente backend */
export interface ListPlatformUsersParams {
  status?: PlatformUserStatus
  email_like?: string
  page?: number
  size?: number
}

// ── Platform stats ────────────────────────────────────────────────────────────

export interface TenantStats {
  total: number
  active: number
  suspended: number
  pending: number
}

export interface UserStats {
  total: number
  active: number
  pending: number
  suspended: number
}

export interface AppStats {
  total: number
}

export interface SigningKeyStats {
  active: number
}

/** Respuesta de GET /platform/stats */
export interface PlatformStatsData {
  tenants: TenantStats
  users: UserStats
  apps: AppStats
  signing_keys: SigningKeyStats
}
