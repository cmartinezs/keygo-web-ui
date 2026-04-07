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

/** Request de POST /platform/users/{userId}/assign-role */
export interface AssignPlatformRoleRequest {
  role: string
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
