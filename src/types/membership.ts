export type MembershipStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING'

export interface MembershipData {
  id: string
  user_id: string
  client_app_id: string
  status: MembershipStatus
  role_ids: string[]
  created_at: string
}

export interface CreateMembershipRequest {
  user_id: string
  client_app_id: string
  role_codes: string[]
}
