export type TenantStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING'

export interface TenantData {
  id: string
  slug: string
  name: string
  owner_email?: string
  status: TenantStatus
  created_at: string
}

/** Respuesta de GET /api/v1/tenants/public — descubrimiento público sin auth */
export interface TenantPublicData {
  id: string
  slug: string
  name: string
  description?: string
}

export interface CreateTenantRequest {
  name: string
  owner_email: string
}

export interface ListTenantsParams {
  status?: TenantStatus
  name_like?: string
  /** ⏳ pendiente — filtro por propietario para scope ADMIN_TENANT (requiere soporte backend) */
  owner_email?: string
  page?: number
  size?: number
  sort?: string
  order?: string
}
