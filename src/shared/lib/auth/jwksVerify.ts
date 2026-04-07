import { createRemoteJWKSet, jwtVerify } from 'jose'
import type { KeyGoJwtClaims } from '@/shared/types/auth'
import { PLATFORM_ROLES } from '@/shared/types/roles'
import type { PlatformRole } from '@/shared/types/roles'
import { API_V1, PLATFORM_URL } from '@/shared/api/client'

const jwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>()

function getJwks(tenantSlug: string) {
  if (!jwksCache.has(tenantSlug)) {
    const url = new URL(`${API_V1}/tenants/${tenantSlug}/.well-known/jwks.json`)
    jwksCache.set(tenantSlug, createRemoteJWKSet(url))
  }
  return jwksCache.get(tenantSlug)!
}

const PLATFORM_CACHE_KEY = '__platform__'

function getPlatformJwks() {
  if (!jwksCache.has(PLATFORM_CACHE_KEY)) {
    const url = new URL(`${PLATFORM_URL}/.well-known/jwks.json`)
    jwksCache.set(PLATFORM_CACHE_KEY, createRemoteJWKSet(url))
  }
  return jwksCache.get(PLATFORM_CACHE_KEY)!
}

/** Verify id_token issued by the platform (KeyGo's own login). */
export async function verifyPlatformIdToken(
  idToken: string,
): Promise<KeyGoJwtClaims> {
  const jwks = getPlatformJwks()
  const { payload } = await jwtVerify(idToken, jwks, { algorithms: ['RS256'] })
  return payload as unknown as KeyGoJwtClaims
}

/** Verify id_token issued by a tenant-scoped OAuth2 flow. */
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
