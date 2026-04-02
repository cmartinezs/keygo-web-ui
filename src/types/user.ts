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
  session_id: string
  already_closed: boolean
}

/** Preferencias de notificacion del usuario autenticado */
export interface NotificationPreferencesData {
  security_alerts_email: boolean
  security_alerts_in_app: boolean
  billing_alerts_email: boolean
  product_updates_email: boolean
  weekly_digest: boolean
}

/** Request de PATCH /tenants/{slug}/account/notification-preferences */
export interface UpdateNotificationPreferencesRequest {
  security_alerts_email?: boolean
  security_alerts_in_app?: boolean
  billing_alerts_email?: boolean
  product_updates_email?: boolean
  weekly_digest?: boolean
}

/** Membresia y roles por aplicacion en GET /tenants/{slug}/account/access */
export interface AccountAccessData {
  app_id: string
  app_name: string
  membership_id: string
  status: string
  /** Lista de codigos de rol ('ADMIN', 'VIEWER', etc.) */
  roles: string[]
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

// ── Wire types — formato exacto del backend (camelCase) ───────────────────────
// Usados solo en src/api/account.ts como tipos intermedios de Axios.
// Nunca exponer fuera del módulo API.

/** Wire: POST /account/change-password — body enviado al backend */
export interface WireChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

/** Wire: GET /account/sessions — cada elemento de la lista */
export interface WireAccountSessionData {
  sessionId: string
  status: string
  browser: string
  os: string
  deviceType: string
  ipAddress: string
  createdAt: string
  lastAccessedAt: string
  expiresAt: string
  isCurrent: boolean
}

/** Wire: DELETE /account/sessions/{sessionId} — respuesta del backend */
export interface WireRevokeSessionResult {
  sessionId: string
  alreadyClosed: boolean
}

/** Wire: GET /account/notification-preferences — respuesta del backend */
export interface WireNotificationPreferencesData {
  securityAlertsEmail: boolean
  securityAlertsInApp: boolean
  billingAlertsEmail: boolean
  productUpdatesEmail: boolean
  weeklyDigest: boolean
}

/** Wire: PATCH /account/notification-preferences — body enviado al backend */
export interface WireUpdateNotificationPreferencesRequest {
  securityAlertsEmail?: boolean
  securityAlertsInApp?: boolean
  billingAlertsEmail?: boolean
  productUpdatesEmail?: boolean
  weeklyDigest?: boolean
}

/** Wire: GET /account/access — cada elemento de la lista (= UserAccessData en OpenAPI) */
export interface WireUserAccessData {
  clientAppId: string
  clientAppName: string
  membershipId: string
  status: string
  roles: string[]
}

// ── Self-registration  ────────────────────────────────────────────────────────

/** Datos devueltos por POST /register */
export interface RegistrationData {
  id: string
  username: string
  email: string
  status: UserStatus
}
