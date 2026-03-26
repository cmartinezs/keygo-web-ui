import type { BaseResponse } from '@/types/base'
import type { AuthorizeData, LoginData, TokenData } from '@/types/auth'
import { authClient, API_V1, CLIENT_ID, REDIRECT_URI } from './client'

export async function authorize(params: {
  tenantSlug: string
  codeChallenge: string
  state: string
}): Promise<AuthorizeData> {
  const url = `${API_V1}/tenants/${params.tenantSlug}/oauth2/authorize`
  const response = await authClient.get<BaseResponse<AuthorizeData>>(url, {
    params: {
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      scope: 'openid profile',
      response_type: 'code',
      code_challenge: params.codeChallenge,
      code_challenge_method: 'S256',
      state: params.state,
    },
  })
  const body = response.data
  if (!body.data) throw new Error(body.failure?.message ?? 'Authorization initiation failed')
  return body.data
}

export async function login(params: {
  tenantSlug: string
  emailOrUsername: string
  password: string
}): Promise<LoginData> {
  const url = `${API_V1}/tenants/${params.tenantSlug}/account/login`
  const response = await authClient.post<BaseResponse<LoginData>>(url, {
    emailOrUsername: params.emailOrUsername,
    password: params.password,
  })
  const body = response.data
  if (!body.data) throw new Error(body.failure?.message ?? 'Login failed')
  return body.data
}

export async function exchangeToken(params: {
  tenantSlug: string
  code: string
  codeVerifier: string
}): Promise<TokenData> {
  const url = `${API_V1}/tenants/${params.tenantSlug}/oauth2/token`
  const response = await authClient.post<BaseResponse<TokenData>>(url, {
    grant_type: 'authorization_code',
    client_id: CLIENT_ID,
    code: params.code,
    code_verifier: params.codeVerifier,
    redirect_uri: REDIRECT_URI,
  })
  const body = response.data
  if (!body.data) throw new Error(body.failure?.message ?? 'Token exchange failed')
  return body.data
}
