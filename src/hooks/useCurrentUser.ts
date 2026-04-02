import { decodeJwt } from 'jose'
import { useTokenStore } from '@/auth/tokenStore'

export interface CurrentUser {
  sub: string
  email?: string
  username?: string
  displayName?: string
  tenantSlug?: string
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
    const tenantSlug =
      typeof claims.tenant_slug === 'string' ? claims.tenant_slug : undefined
    const sub = typeof claims.sub === 'string' ? claims.sub : ''
    const displayName = username ?? email ?? sub

    return { sub, email, username, displayName, tenantSlug, roles }
  } catch {
    return null
  }
}
