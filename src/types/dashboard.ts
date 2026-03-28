// ── Tipos que espeja el wire format JSON del backend (snake_case) ─────────────
// Fuente: PlatformDashboardData.java — GET /api/v1/admin/platform/dashboard

export interface ServiceSummary {
  title: string
  name: string
  version: string
  environment: string
  status: string
}

export interface CountSummary {
  total: number
  active: number
  pending: number
  suspended: number
  recently_created: number
}

export interface AppSummary {
  total: number
  active: number
  pending: number
  suspended: number
  public_count: number
  confidential_count: number
  without_redirect_uris: number
}

export interface MembershipSummary {
  total: number
  active: number
  pending: number
  suspended: number
  users_without_membership: number
}

export interface SigningKeySummary {
  kid: string
  algorithm: string
  activated_at: string   // ISO-8601 (Instant)
  age_days: number
}

export interface SecurityCounts {
  active_signing_keys: number
  retired_signing_keys: number
  revoked_signing_keys: number
  active_sessions: number
  expired_sessions: number
  terminated_sessions: number
  active_refresh_tokens: number
  used_refresh_tokens: number
  expired_refresh_tokens: number
  revoked_refresh_tokens: number
  pending_authorization_codes: number
  used_authorization_codes: number
  expired_authorization_codes: number
  revoked_authorization_codes: number
}

export interface AlertItem {
  level: string   // 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  code: string
  message: string
}

export interface SecuritySummary {
  active_signing_key: SigningKeySummary | null
  counts: SecurityCounts
  alerts: AlertItem[]
}

export interface RegistrationSummary {
  pending_email_verifications: number
  expired_pending_verifications: number
  recent_registrations: number
  recent_verifications: number
}

export interface TopologySummary {
  avg_users_per_tenant: number
  avg_apps_per_tenant: number
  avg_memberships_per_app: number
  tenants_without_apps: number
  tenants_without_users: number
}

export interface RankEntry {
  slug: string
  name: string
  tenant_slug?: string   // solo presente en entradas de apps
  count: number
}

export interface RankingSummary {
  top_tenants_by_users: RankEntry[]
  top_apps_by_memberships: RankEntry[]
}

export interface PendingActionItem {
  type: string
  count: number
  route: string
}

export interface ActivityItem {
  type: string
  label: string
  occurred_at: string   // ISO-8601 (Instant)
  route: string
}

export interface QuickActionItem {
  code: string
  label: string
  route: string
}

// ── Root ──────────────────────────────────────────────────────────────────────

export interface PlatformDashboardData {
  service: ServiceSummary
  security: SecuritySummary
  tenants: CountSummary
  users: CountSummary
  apps: AppSummary
  memberships: MembershipSummary
  registration: RegistrationSummary
  topology: TopologySummary
  rankings: RankingSummary
  pending_actions: PendingActionItem[]
  recent_activity: ActivityItem[]
  quick_actions: QuickActionItem[]
}
