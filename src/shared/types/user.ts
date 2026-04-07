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
  phone_number?: string
  locale?: string
  zoneinfo?: string
  profile_picture_url?: string
  birthdate?: string
  website?: string
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

/** Request de POST /tenants/{slug}/account/forgot-password */
export interface ForgotPasswordRequest {
  email: string
}

/** Respuesta de POST /tenants/{slug}/account/forgot-password */
export interface ForgotPasswordResult {
  sent: boolean
}

/** Request de POST /tenants/{slug}/account/recover-password */
export interface RecoverPasswordRequest {
  recovery_token: string
  new_password: string
}

/** Respuesta de POST /tenants/{slug}/account/recover-password */
export interface RecoverPasswordResult {
  recovered: boolean
}

/**
 * Request de POST /tenants/{slug}/account/reset-password
 * Flujo RESET_PASSWORD_REQUIRED: usuario con status RESET_PASSWORD establece su contrasena definitiva.
 * Requiere: request_id (UUID del 401 login), codigo de verificacion (6 digitos, enviado por email),
 * contrasena temporal (asignada por admin) y nueva contrasena permanente.
 */
export interface AccountResetPasswordRequest {
  request_id: string
  verification_code: string
  temporary_password: string
  new_password: string
}

/** Respuesta de POST /tenants/{slug}/account/reset-password (password temporal) */
export interface AccountResetPasswordResult {
  reset: boolean
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

/** Respuesta de PUT /tenants/{slug}/users/{userId}/suspend ⏳ pendiente backend (T-033) */
export interface SuspendUserResult {
  user_id: string
  status: string
  already_suspended: boolean
}

/** Respuesta de PUT /tenants/{slug}/users/{userId}/activate ⏳ pendiente backend (T-033) */
export interface ActivateUserResult {
  user_id: string
  status: string
  already_active: boolean
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
  /** Lista de codigos de rol ('keygo_admin', 'VIEWER', etc.) */
  roles: string[]
}

/** Catalogo V1 de proveedores soportados para conexiones de cuenta (F-042). */
export type AccountConnectionProvider = 'GOOGLE' | 'GITHUB' | 'MICROSOFT' | 'SLACK'

/** Conexion externa vinculada en formato interno frontend (snake_case). */
export interface AccountConnectionData {
  id: string
  provider_name: AccountConnectionProvider | string
  status: string
  connected_at: string
  display_name?: string | null
  avatar_url?: string | null
  scopes?: string[]
  last_used_at?: string | null
}

/** Request de vinculacion para /account/connections/{provider}/link. */
export interface LinkAccountConnectionRequest {
  authorization_code?: string
  state?: string
}

/** Respuesta de POST /account/connections/{provider}/link. */
export interface LinkAccountConnectionResult {
  linked: boolean
  connection: AccountConnectionData
}

/** Respuesta de DELETE /account/connections/{connectionId}. */
export interface UnlinkAccountConnectionResult {
  unlinked: boolean
}

/** Wire: objeto de conexion compatible snake_case/camelCase durante transicion F-042. */
export interface WireAccountConnectionData {
  id: string
  status: string
  provider?: string
  provider_name?: string
  providerName?: string
  provider_user_id?: string
  providerUserId?: string
  linked_at?: string
  linkedAt?: string
  connected_at?: string
  connectedAt?: string
  display_name?: string | null
  displayName?: string | null
  avatar_url?: string | null
  avatarUrl?: string | null
  scopes?: string[]
  last_used_at?: string | null
  lastUsedAt?: string | null
}

/** Wire: respuesta de POST /account/connections/{provider}/link. */
export interface WireLinkAccountConnectionResult {
  linked: boolean
  connection: WireAccountConnectionData
}

// ── Wire types — tipos intermedios de Axios (solo src/api/account.ts) ─────────
// Solo cuando la forma del wire difiere del DTO interno.

/** Wire: GET /account/access — cada elemento de la lista (= UserAccessData en OpenAPI) */
export interface WireUserAccessData {
  client_app_id: string
  client_app_name: string
  membership_id: string
  status: string
  roles: string[]
}

// ── Self-registration  ────────────────────────────────────────────────────────

/** Request de POST /tenants/{slug}/register */
export interface RegisterRequest {
  username: string
  email: string
  password: string
  first_name?: string
  last_name?: string
}

/** Datos devueltos por POST /register */
export interface RegistrationData {
  id: string
  username: string
  email: string
  status: UserStatus
}

/** Request de POST /tenants/{slug}/register/verify-email */
export interface VerifyEmailRequest {
  email: string
  verification_code: string
}

/** Request de POST /tenants/{slug}/register/resend-verification */
export interface ResendVerificationRequest {
  email: string
}
