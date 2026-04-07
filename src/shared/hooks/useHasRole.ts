import { useTokenStore } from '@/shared/lib/auth/tokenStore'
import type { PlatformRole } from '@/shared/types/roles'

/**
 * Returns `true` if the current user has the given platform role.
 * Checks against the roles stored in the token store (from JWT claims).
 */
export function useHasRole(role: PlatformRole): boolean {
  return useTokenStore((s) => s.roles.includes(role))
}

/**
 * Returns `true` if the current user has ANY of the given platform roles.
 */
export function useHasAnyRole(roles: PlatformRole[]): boolean {
  return useTokenStore((s) => roles.some((r) => s.roles.includes(r)))
}
