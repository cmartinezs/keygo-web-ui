import { decodeJwt } from 'jose'
import { useTokenStore } from '@/auth/tokenStore'
import type { AppRole } from '@/types/roles'

export interface CurrentUser {
  sub: string
  email?: string
  username?: string
  firstName?: string
  lastName?: string
  displayName?: string
  tenantSlug?: string
  roles: AppRole[]
  activeRole: AppRole | null
}

/**
 * Returns basic user info decoded from the in-memory idToken.
 * Returns null when the user is not authenticated.
 */
export function useCurrentUser(): CurrentUser | null {
  const { idToken, roles, activeRole } = useTokenStore()
  if (!idToken) return null

  try {
    const claims = decodeJwt(idToken) as Record<string, unknown>
    const email = typeof claims.email === 'string' ? claims.email : undefined
    const username =
      typeof claims.preferred_username === 'string' ? claims.preferred_username : undefined
    const firstName =
      typeof claims.given_name === 'string'
        ? claims.given_name
        : typeof claims.first_name === 'string'
          ? claims.first_name
          : undefined
    const lastName =
      typeof claims.family_name === 'string'
        ? claims.family_name
        : typeof claims.last_name === 'string'
          ? claims.last_name
          : undefined
    const tenantSlug =
      typeof claims.tenant_slug === 'string' ? claims.tenant_slug : undefined
    const sub = typeof claims.sub === 'string' ? claims.sub : ''
    const displayName = username ?? email ?? sub

    return { sub, email, username, firstName, lastName, displayName, tenantSlug, roles, activeRole }
  } catch {
    return null
  }
}
