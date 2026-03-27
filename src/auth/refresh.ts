/**
 * Silent session restore and proactive token refresh.
 *
 * Security tradeoff (documented in FRONTEND_DEVELOPER_GUIDE §12):
 *   - access_token / id_token → memory only (Zustand). Never persisted.
 *   - refresh_token → sessionStorage. Tab-scoped; lost when tab closes.
 *     Using sessionStorage allows the session to survive F5 / hard refresh.
 */

import { refreshToken as apiRefreshToken } from '@/api/auth'
import { TENANT } from '@/api/client'
import { verifyIdToken, extractRoles } from './jwksVerify'
import { useTokenStore } from './tokenStore'

const SESSION_KEY = 'kg_rt'

/** Persists the refresh token to sessionStorage. Call after successful login. */
export function persistRefreshToken(rt: string): void {
  sessionStorage.setItem(SESSION_KEY, rt)
}

/** Clears the persisted refresh token. Call on logout or clearTokens. */
export function clearPersistedRefreshToken(): void {
  sessionStorage.removeItem(SESSION_KEY)
}

/**
 * Attempts to restore the session on app boot using a persisted refresh token.
 * Returns true if the session was restored, false otherwise.
 * If restoration fails, clears sessionStorage so the next boot won't retry stale tokens.
 */
export async function restoreSession(): Promise<boolean> {
  const rt = sessionStorage.getItem(SESSION_KEY)
  if (!rt) return false

  try {
    const tokens = await apiRefreshToken({ tenantSlug: TENANT, refreshToken: rt })
    const claims = await verifyIdToken(tokens.id_token, TENANT)
    const roles = extractRoles(claims)

    useTokenStore.getState().setTokens({
      accessToken: tokens.access_token,
      idToken: tokens.id_token,
      refreshToken: tokens.refresh_token,
      roles,
    })

    // Persist the rotated refresh token
    persistRefreshToken(tokens.refresh_token)
    return true
  } catch {
    clearPersistedRefreshToken()
    return false
  }
}
