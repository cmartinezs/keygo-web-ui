export type ClientAppType = 'PUBLIC' | 'CONFIDENTIAL'

export type GrantType =
  | 'AUTHORIZATION_CODE'
  | 'CLIENT_CREDENTIALS'
  | 'REFRESH_TOKEN'
  | 'IMPLICIT'

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
