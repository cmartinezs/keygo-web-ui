import { createRemoteJWKSet, jwtVerify } from 'jose'
import type { KeyGoJwtClaims } from '@/shared/types/auth'
import { PLATFORM_ROLES } from '@/shared/types/roles'
import type { PlatformRole } from '@/shared/types/roles'
import { API_V1 } from '@/shared/api/client'

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

export function extractRoles(claims: KeyGoJwtClaims): PlatformRole[] {
  if (!Array.isArray(claims.roles) || claims.roles.length === 0) return []

  return [...new Set(claims.roles.map((r) => r.toLowerCase()))]
    .map((r) => r as PlatformRole)
    .filter((r): r is PlatformRole => PLATFORM_ROLES.includes(r))
}
