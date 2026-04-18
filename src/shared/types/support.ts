import type { ErrorOrigin } from '@/shared/types/base'
import type { PlatformRole } from '@/shared/types/roles'

export interface AccessIncidentResourceContext {
  search_query?: string
  filter_status?: string
  page?: number
  managed_tenant_slug?: string | null
}

export interface CreateAccessIncidentReportRequest {
  incident_type: 'ACCESS_DENIED'
  feature_key: string
  route_path: string
  current_url: string
  resource_path: string
  resource_label: string
  user_comment: string
  http_status: number
  error_code?: string
  client_message: string
  error_origin?: ErrorOrigin
  trace_id?: string
  exception?: string
  detail?: string
  actor_sub: string
  actor_email?: string
  actor_username?: string
  active_role?: PlatformRole | null
  detected_roles: PlatformRole[]
  tenant_claim?: string
  managed_tenant_slug?: string | null
  ui_trace_id: string
  resource_context?: AccessIncidentResourceContext
}

export interface AccessIncidentReportReceipt {
  incident_id: string
  received_at: string
  status: 'RECEIVED'
}
