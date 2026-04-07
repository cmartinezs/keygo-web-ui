/**
 * Silent session restore and proactive token refresh.
 *
 * Security tradeoff (documented in FRONTEND_DEVELOPER_GUIDE §12):
 *   - access_token / id_token → memory only (Zustand). Never persisted.
 *   - refresh_token → sessionStorage. Tab-scoped; lost when tab closes.
 *     Using sessionStorage allows the session to survive F5 / hard refresh.
 */

import { refreshToken as apiRefreshToken } from '@/features/auth/api'
import { TENANT } from '@/shared/api/client'
import { verifyIdToken, extractRoles } from './jwksVerify'
import { useTokenStore } from './tokenStore'

const SESSION_KEY = 'kg_rt'

// ── Proactive refresh ────────────────────────────────────────────────────────

const REFRESH_AT_FRACTION = 0.8
const MIN_TTL_SECONDS = 30

let refreshTimerId: ReturnType<typeof setTimeout> | null = null

/**
 * Schedules a proactive token refresh at 80% of the access token TTL.
 * If the remaining TTL is below MIN_TTL_SECONDS, refreshes immediately.
 */
export function scheduleProactiveRefresh(expiresIn: number): void {
  cancelRefreshTimer()
  const delayMs =
    expiresIn <= MIN_TTL_SECONDS ? 0 : expiresIn * REFRESH_AT_FRACTION * 1000
  refreshTimerId = setTimeout(() => {
    void silentRefresh()
  }, delayMs)
}

/** Cancels the proactive refresh timer if it is running. */
export function cancelRefreshTimer(): void {
  if (refreshTimerId !== null) {
    clearTimeout(refreshTimerId)
    refreshTimerId = null
  }
}

/**
 * Performs a silent token refresh using the persisted refresh token.
 * On success, persists the rotated refresh token and reschedules the timer.
 * On failure, clears the session — the user must re-login.
 */
async function silentRefresh(): Promise<void> {
  const rt = sessionStorage.getItem(SESSION_KEY)
  if (!rt) return

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

    persistRefreshToken(tokens.refresh_token)
    scheduleProactiveRefresh(tokens.expires_in)
  } catch {
    clearPersistedRefreshToken()
    useTokenStore.getState().clearTokens()
  }
}

// Auto-cancel the refresh timer when tokens are cleared (e.g. logout).
useTokenStore.subscribe((state) => {
  if (!state.accessToken) cancelRefreshTimer()
})

// ── Persistence helpers ──────────────────────────────────────────────────────

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

    // Persist the rotated refresh token and schedule proactive refresh
    persistRefreshToken(tokens.refresh_token)
    scheduleProactiveRefresh(tokens.expires_in)
    return true
  } catch {
    clearPersistedRefreshToken()
    return false
  }
}
