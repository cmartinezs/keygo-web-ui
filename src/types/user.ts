export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING'

/** Datos devueltos por POST /register */
export interface RegistrationData {
  id: string
  username: string
  email: string
  status: UserStatus
}
