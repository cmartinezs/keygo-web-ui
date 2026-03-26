import { createRemoteJWKSet, jwtVerify } from 'jose'
import type { KeyGoJwtClaims } from '@/types/auth'
import { APP_ROLES } from '@/types/roles'
import type { AppRole } from '@/types/roles'
import { API_V1 } from '@/api/client'

const jwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>()

function getJwks(tenantSlug: string) {
  if (!jwksCache.has(tenantSlug)) {
    const url = new URL(`${API_V1}/tenants/${tenantSlug}/.well-known/jwks.json`)
    jwksCache.set(tenantSlug, createRemoteJWKSet(url))
  }
  return jwksCache.get(tenantSlug)!
}

export async function verifyIdToken(
  idToken: string,
  tenantSlug: string,
): Promise<KeyGoJwtClaims> {
  const jwks = getJwks(tenantSlug)
  const { payload } = await jwtVerify(idToken, jwks, { algorithms: ['RS256'] })
  return payload as unknown as KeyGoJwtClaims
}

export function extractRoles(claims: KeyGoJwtClaims): AppRole[] {
  if (!claims.roles) return []
  return claims.roles.filter((r): r is AppRole =>
    APP_ROLES.includes(r as AppRole),
  )
}
