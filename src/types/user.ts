export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING'

// ── Tenant user management (ADMIN / ADMIN_TENANT) ─────────────────────────────

/** Respuesta de GET/POST/PUT /tenants/{slug}/users y /users/{userId} */
export interface UserData {
  id: string
  tenant_id: string
  username: string
  email: string
  first_name?: string
  last_name?: string
  status: UserStatus
  phone_number?: string
  locale?: string
  zoneinfo?: string
  profile_picture_url?: string
  birthdate?: string
  website?: string
}

/** Request de POST /tenants/{slug}/users */
export interface CreateUserRequest {
  username: string
  email: string
  password: string
  first_name?: string
  last_name?: string
}

/** Request de PUT /tenants/{slug}/users/{userId} */
export interface UpdateUserRequest {
  first_name?: string
  last_name?: string
}

/** Request de POST /tenants/{slug}/users/{userId}/reset-password */
export interface ResetPasswordRequest {
  new_password: string
}

// ── Account profile (self-service — todos los roles) ─────────────────────────

/** Respuesta de GET /tenants/{slug}/account/profile */
export interface UserProfileData {
  id: string
  tenant_id: string
  username: string
  email: string
  first_name?: string
  last_name?: string
  status: UserStatus
  phone_number?: string
  locale?: string
  zoneinfo?: string
  profile_picture_url?: string
  birthdate?: string
  website?: string
}

/** Request de PATCH /tenants/{slug}/account/profile */
export interface UpdateUserProfileRequest {
  first_name?: string
  last_name?: string
  phone_number?: string
  locale?: string
  zoneinfo?: string
  profile_picture_url?: string
  birthdate?: string
  website?: string
}

/** Request de POST /tenants/{slug}/account/change-password */
export interface ChangePasswordRequest {
  current_password: string
  new_password: string
}

/** Respuesta de POST /tenants/{slug}/account/change-password */
export interface ChangePasswordResult {
  changed: boolean
}

/** Sesion de usuario en GET /tenants/{slug}/account/sessions */
export interface AccountSessionData {
  session_id: string
  status: string
  browser: string
  os: string
  device_type: string
  ip_address: string
  created_at: string
  last_accessed_at: string
  expires_at: string
  is_current: boolean
}

/** Respuesta de DELETE /tenants/{slug}/account/sessions/{sessionId} */
export interface RevokeAccountSessionResult {
  revoked: boolean
}

/** Preferencias de notificacion del usuario autenticado */
export interface NotificationPreferencesData {
  security_alerts_email: boolean
  security_alerts_in_app: boolean
  billing_alerts_email: boolean
  billing_alerts_in_app: boolean
  product_updates_email: boolean
  product_updates_in_app: boolean
}

/** Request de PATCH /tenants/{slug}/account/notification-preferences */
export interface UpdateNotificationPreferencesRequest {
  security_alerts_email?: boolean
  security_alerts_in_app?: boolean
  billing_alerts_email?: boolean
  billing_alerts_in_app?: boolean
  product_updates_email?: boolean
  product_updates_in_app?: boolean
}

/** Rol efectivo de una app dentro del endpoint /account/access */
export interface AccountAccessRoleData {
  role_code: string
  role_name: string
}

/** Membresia por app dentro del endpoint /account/access */
export interface AccountAccessData {
  app_id: string
  app_code: string
  app_name: string
  roles: AccountAccessRoleData[]
}

/** Conexion externa vinculada (temporal hasta contrato OpenAPI oficial) */
export interface AccountConnectionData {
  id: string
  provider: string
  provider_user_id?: string
  status: string
  linked_at: string
  last_used_at?: string | null
}

/** Request de vinculacion para /account/connections/{provider}/link (temporal) */
export interface LinkAccountConnectionRequest {
  authorization_code?: string
  state?: string
}

/** Respuesta de POST /account/connections/{provider}/link (temporal) */
export interface LinkAccountConnectionResult {
  linked: boolean
  connection: AccountConnectionData
}

/** Respuesta de DELETE /account/connections/{connectionId} (temporal) */
export interface UnlinkAccountConnectionResult {
  unlinked: boolean
}

// ── Self-registration  ────────────────────────────────────────────────────────

/** Datos devueltos por POST /register */
export interface RegistrationData {
  id: string
  username: string
  email: string
  status: UserStatus
}
