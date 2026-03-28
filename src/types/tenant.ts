export type TenantStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING'

export interface TenantData {
  id: string
  slug: string
  name: string
  owner_email?: string
  status: TenantStatus
  created_at: string
}

export interface CreateTenantRequest {
  name: string
  owner_email: string
}

export interface ListTenantsParams {
  status?: TenantStatus
  name_like?: string
  page?: number
  size?: number
}
