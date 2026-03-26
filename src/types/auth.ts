export interface AuthorizeData {
  client_id: string
  client_name: string
  redirect_uri: string
}

export interface LoginData {
  code: string
  redirect_uri: string
}

export interface TokenData {
  access_token: string
  id_token: string
  refresh_token: string
  token_type: string
  expires_in: number
  scope: string
  authorization_code_id?: string
}

export interface KeyGoJwtClaims {
  sub: string
  email?: string
  preferred_username?: string
  roles?: string[]
  tenant_slug?: string
  exp: number
  iat: number
  iss?: string
}
