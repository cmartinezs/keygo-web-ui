import { decodeJwt } from 'jose'
import { useTokenStore } from '@/shared/lib/auth/tokenStore'
import type { AppRole } from '@/shared/types/roles'

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

function readTenantSlugFromClaims(claims: Record<string, unknown>): string | undefined {
  if (typeof claims.tenant_slug === 'string' && claims.tenant_slug.trim().length > 0) {
    return claims.tenant_slug
  }
  if (typeof claims.tenantSlug === 'string' && claims.tenantSlug.trim().length > 0) {
    return claims.tenantSlug
  }
  if (typeof claims.tenant_id === 'string' && claims.tenant_id.trim().length > 0) {
    return claims.tenant_id
  }
  if (typeof claims.tenantId === 'string' && claims.tenantId.trim().length > 0) {
    return claims.tenantId
  }
  return undefined
}

function readTenantSlugFromIssuer(claims: Record<string, unknown>): string | undefined {
  const issuer = typeof claims.iss === 'string' ? claims.iss : ''
  const matched = /\/tenants\/([^/]+)(?:\/|$)/i.exec(issuer)
  if (!matched?.[1]) return undefined

  const slug = decodeURIComponent(matched[1]).trim()
  return slug.length > 0 ? slug : undefined
}

/**
 * Returns basic user info decoded from the in-memory idToken.
 * Returns null when the user is not authenticated.
 */
export function useCurrentUser(): CurrentUser | null {
  const { idToken, accessToken, roles, activeRole } = useTokenStore()
  if (!idToken) return null

  try {
    const idClaims = decodeJwt(idToken) as Record<string, unknown>
    const accessClaims = accessToken
      ? (decodeJwt(accessToken) as Record<string, unknown>)
      : undefined

    const email = typeof idClaims.email === 'string' ? idClaims.email : undefined
    const username =
      typeof idClaims.preferred_username === 'string' ? idClaims.preferred_username : undefined
    const firstName =
      typeof idClaims.given_name === 'string'
        ? idClaims.given_name
        : typeof idClaims.first_name === 'string'
          ? idClaims.first_name
          : undefined
    const lastName =
      typeof idClaims.family_name === 'string'
        ? idClaims.family_name
        : typeof idClaims.last_name === 'string'
          ? idClaims.last_name
          : undefined
    const tenantSlug =
      readTenantSlugFromClaims(idClaims)
      ?? (accessClaims ? readTenantSlugFromClaims(accessClaims) : undefined)
      ?? readTenantSlugFromIssuer(idClaims)
      ?? (accessClaims ? readTenantSlugFromIssuer(accessClaims) : undefined)
    const sub = typeof idClaims.sub === 'string' ? idClaims.sub : ''
    const displayName = username ?? email ?? sub

    return { sub, email, username, firstName, lastName, displayName, tenantSlug, roles, activeRole }
  } catch {
    return null
  }
}
