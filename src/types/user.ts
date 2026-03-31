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

// ── Self-registration  ────────────────────────────────────────────────────────

/** Datos devueltos por POST /register */
export interface RegistrationData {
  id: string
  username: string
  email: string
  status: UserStatus
}
