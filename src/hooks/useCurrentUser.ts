import { decodeJwt } from 'jose'
import { useTokenStore } from '@/auth/tokenStore'

export interface CurrentUser {
  sub: string
  email?: string
  username?: string
  displayName?: string
  roles: string[]
}

/**
 * Returns basic user info decoded from the in-memory idToken.
 * Returns null when the user is not authenticated.
 */
export function useCurrentUser(): CurrentUser | null {
  const { idToken, roles } = useTokenStore()
  if (!idToken) return null

  try {
    const claims = decodeJwt(idToken) as Record<string, unknown>
    const email = typeof claims.email === 'string' ? claims.email : undefined
    const username =
      typeof claims.preferred_username === 'string' ? claims.preferred_username : undefined
    const sub = typeof claims.sub === 'string' ? claims.sub : ''
    const displayName = username ?? email ?? sub

    return { sub, email, username, displayName, roles }
  } catch {
    return null
  }
}
