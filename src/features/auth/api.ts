import axios from 'axios'
import type { BaseResponse } from '@/shared/types/base'
import type { AuthorizeData, LoginData, TokenData } from '@/shared/types/auth'
import { authClient, API_V1, PLATFORM_URL, CLIENT_ID, REDIRECT_URI } from '@/shared/api/client'
import { unwrapResponseData } from '@/shared/api/response'
import type { RequestOptions } from '@/shared/api/requestOptions'

// ── Platform auth (KeyGo's own login) ─────────────────────────────────────────
// Uses /platform/ prefix — no tenantSlug needed.

export async function platformAuthorize(params: {
  codeChallenge: string
  state: string
}, options?: RequestOptions): Promise<AuthorizeData> {
  const url = `${PLATFORM_URL}/oauth2/authorize`
  const response = await authClient.get<BaseResponse<AuthorizeData>>(url, {
    signal: options?.signal,
    timeout: options?.timeoutMs,
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
  return unwrapResponseData(response.data, 'Authorization initiation failed')
}

export async function platformLogin(params: {
  emailOrUsername: string
  password: string
}, options?: RequestOptions): Promise<LoginData> {
  const url = `${PLATFORM_URL}/account/login`
  const response = await authClient.post<BaseResponse<LoginData>>(url, {
    email_or_username: params.emailOrUsername,
    password: params.password,
  }, {
    signal: options?.signal,
    timeout: options?.timeoutMs,
    headers: options?.idempotencyKey
      ? { 'X-Idempotency-Key': options.idempotencyKey }
      : undefined,
  })
  return unwrapResponseData(response.data, 'Login failed')
}

export async function platformDirectLogin(params: {
  emailOrUsername: string
  password: string
}, options?: RequestOptions): Promise<unknown> {
  const url = `${PLATFORM_URL}/account/direct-login`
  const response = await authClient.post<BaseResponse<unknown>>(url, {
    email_or_username: params.emailOrUsername,
    password: params.password,
  }, {
    signal: options?.signal,
    timeout: options?.timeoutMs,
    headers: options?.idempotencyKey
      ? { 'X-Idempotency-Key': options.idempotencyKey }
      : undefined,
  })
  return unwrapResponseData(response.data, 'Direct login failed')
}

export type PlatformCheckEmailResult = 'found' | 'not_found'

export async function platformCheckEmail(params: {
  email: string
}, options?: RequestOptions): Promise<PlatformCheckEmailResult> {
  const url = `${PLATFORM_URL}/account/check-email`

  try {
    const response = await authClient.post<BaseResponse<null>>(url, {
      email: params.email,
    }, {
      signal: options?.signal,
      timeout: options?.timeoutMs,
      headers: options?.idempotencyKey
        ? { 'X-Idempotency-Key': options.idempotencyKey }
        : undefined,
    })

    if (response.status === 200) {
      return 'found'
    }

    return 'not_found'
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return 'not_found'
    }

    throw error
  }
}

export async function platformExchangeToken(params: {
  code: string
  codeVerifier: string
}, options?: RequestOptions): Promise<TokenData> {
  const url = `${PLATFORM_URL}/oauth2/token`
  const response = await authClient.post<BaseResponse<TokenData>>(url, {
    grant_type: 'authorization_code',
    client_id: CLIENT_ID,
    code: params.code,
    code_verifier: params.codeVerifier,
    redirect_uri: REDIRECT_URI,
  }, {
    signal: options?.signal,
    timeout: options?.timeoutMs,
    headers: options?.idempotencyKey
      ? { 'X-Idempotency-Key': options.idempotencyKey }
      : undefined,
  })
  return unwrapResponseData(response.data, 'Token exchange failed')
}

export async function platformRefreshToken(params: {
  refreshToken: string
}): Promise<TokenData> {
  const url = `${PLATFORM_URL}/oauth2/token`
  const response = await authClient.post<BaseResponse<TokenData>>(url, {
    grant_type: 'refresh_token',
    client_id: CLIENT_ID,
    refresh_token: params.refreshToken,
  })
  return unwrapResponseData(response.data, 'Token refresh failed')
}

/**
 * Revokes a token (RFC 7009). Fire-and-forget on logout.
 * POST /platform/oauth2/revoke
 * ⏳ pendiente — endpoint no existe aún en api-docs; backend lo agregará pronto.
 */
export async function platformRevokeToken(params: {
  token: string
  tokenTypeHint?: 'refresh_token' | 'access_token'
}): Promise<void> {
  const url = `${PLATFORM_URL}/oauth2/revoke`
  await authClient.post(url, {
    token: params.token,
    token_type_hint: params.tokenTypeHint ?? 'refresh_token',
    client_id: CLIENT_ID,
  })
}

// ── Tenant-scoped auth (for external tenant apps) ─────────────────────────────
// Uses /tenants/{slug}/ prefix — used by tenant login flows.

export async function refreshToken(params: {
  tenantSlug: string
  refreshToken: string
}): Promise<TokenData> {
  const url = `${API_V1}/tenants/${params.tenantSlug}/oauth2/token`
  const response = await authClient.post<BaseResponse<TokenData>>(url, {
    grant_type: 'refresh_token',
    client_id: CLIENT_ID,
    refresh_token: params.refreshToken,
  })
  return unwrapResponseData(response.data, 'Token refresh failed')
}

export async function authorize(params: {
  tenantSlug: string
  codeChallenge: string
  state: string
}, options?: RequestOptions): Promise<AuthorizeData> {
  const url = `${API_V1}/tenants/${params.tenantSlug}/oauth2/authorize`
  const response = await authClient.get<BaseResponse<AuthorizeData>>(url, {
    signal: options?.signal,
    timeout: options?.timeoutMs,
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
  return unwrapResponseData(response.data, 'Authorization initiation failed')
}

export async function login(params: {
  tenantSlug: string
  emailOrUsername: string
  password: string
}, options?: RequestOptions): Promise<LoginData> {
  const url = `${API_V1}/tenants/${params.tenantSlug}/account/login`
  const response = await authClient.post<BaseResponse<LoginData>>(url, {
    email_or_username: params.emailOrUsername,
    password: params.password,
  }, {
    signal: options?.signal,
    timeout: options?.timeoutMs,
    headers: options?.idempotencyKey
      ? { 'X-Idempotency-Key': options.idempotencyKey }
      : undefined,
  })
  return unwrapResponseData(response.data, 'Login failed')
}

export async function exchangeToken(params: {
  tenantSlug: string
  code: string
  codeVerifier: string
}, options?: RequestOptions): Promise<TokenData> {
  const url = `${API_V1}/tenants/${params.tenantSlug}/oauth2/token`
  const response = await authClient.post<BaseResponse<TokenData>>(url, {
    grant_type: 'authorization_code',
    client_id: CLIENT_ID,
    code: params.code,
    code_verifier: params.codeVerifier,
    redirect_uri: REDIRECT_URI,
  }, {
    signal: options?.signal,
    timeout: options?.timeoutMs,
    headers: options?.idempotencyKey
      ? { 'X-Idempotency-Key': options.idempotencyKey }
      : undefined,
  })
  return unwrapResponseData(response.data, 'Token exchange failed')
}

/**
 * Revokes a token (RFC 7009). Fire-and-forget on logout.
 * POST /tenants/{slug}/oauth2/revoke
 */
export async function revokeToken(params: {
  tenantSlug: string
  token: string
  tokenTypeHint?: 'refresh_token' | 'access_token'
}): Promise<void> {
  const url = `${API_V1}/tenants/${params.tenantSlug}/oauth2/revoke`
  await authClient.post(url, {
    token: params.token,
    token_type_hint: params.tokenTypeHint ?? 'refresh_token',
    client_id: CLIENT_ID,
  })
}
