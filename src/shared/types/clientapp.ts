export type ClientAppType = 'PUBLIC' | 'CONFIDENTIAL'

export type GrantType =
  | 'AUTHORIZATION_CODE'
  | 'CLIENT_CREDENTIALS'
  | 'REFRESH_TOKEN'
  | 'IMPLICIT'

export type ClientAppStatus = 'ACTIVE' | 'INACTIVE'

export type RegistrationPolicy = 'OPEN_AUTO_ACTIVE' | 'OPEN_AUTO_PENDING' | 'OPEN_NO_MEMBERSHIP' | 'INVITE_ONLY'

// ── Response DTOs ─────────────────────────────────────────────────────────────

/** Respuesta de GET /tenants/{slug}/apps y GET /tenants/{slug}/apps/{clientId} */
export interface ClientAppData {
  id: string
  client_id: string
  name: string
  description?: string
  type: ClientAppType
  redirect_uris: string[]
  grants: GrantType[]
  scopes: string[]
  status: ClientAppStatus
  created_at: string
  updated_at?: string
}

/** Respuesta de GET /api/v1/tenants/{slug}/apps/public — descubrimiento público sin auth */
export interface ClientAppPublicData {
  id: string
  client_id: string
  name: string
  description?: string
  type: ClientAppType
  registration_policy: RegistrationPolicy
  active: boolean
}

/** Respuesta de POST /tenants/{slug}/apps — incluye el secret solo en creación */
export interface ClientAppCreatedData extends ClientAppData {
  client_secret: string
}

/** Respuesta de POST /tenants/{slug}/apps/{clientId}/rotate-secret */
export interface ClientAppSecretData {
  client_id: string
  client_secret: string
}

// ── Request DTOs ──────────────────────────────────────────────────────────────

export interface CreateClientAppRequest {
  name: string
  description?: string
  type: ClientAppType
  redirect_uris?: string[]
  grants: GrantType[]
  scopes?: string[]
}

export interface UpdateClientAppRequest {
  name: string
  description?: string
  redirect_uris?: string[]
  grants: GrantType[]
  scopes?: string[]
}

// ── App Roles ─────────────────────────────────────────────────────────────────

export interface AppRoleData {
  id: string
  client_app_id: string
  code: string
  display_name?: string
  description?: string
  created_at: string
}

export interface CreateAppRoleRequest {
  code: string
  display_name?: string
  description?: string
}
