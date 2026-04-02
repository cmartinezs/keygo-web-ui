import { describe, expect, it } from 'vitest'
import { extractRoles } from './jwksVerify'
import type { KeyGoJwtClaims } from '@/types/auth'

function claimsWith(partial: Partial<KeyGoJwtClaims>): KeyGoJwtClaims {
  return {
    sub: 'user-1',
    exp: 1,
    iat: 1,
    ...partial,
  }
}

describe('extractRoles', () => {
  it('accepts hierarchical roles as an array', () => {
    const roles = extractRoles(
      claimsWith({
        roles: ['ADMIN', 'ADMIN_TENANT', 'USER_TENANT'],
      }),
    )

    expect(roles).toEqual(['ADMIN', 'ADMIN_TENANT', 'USER_TENANT'])
  })

  it('normalizes lowercase roles and removes duplicates', () => {
    const roles = extractRoles(
      claimsWith({
        roles: ['admin', 'ADMIN', 'user_tenant'],
      }),
    )

    expect(roles).toEqual(['ADMIN', 'USER_TENANT'])
  })

  it('returns empty when roles claim is not a list', () => {
    const roles = extractRoles(claimsWith({ roles: 'ADMIN_TENANT' as unknown as string[] }))

    expect(roles).toEqual([])
  })

  it('filters unknown roles', () => {
    const roles = extractRoles(claimsWith({ roles: ['ADMIN', 'SUPER_ADMIN'] }))

    expect(roles).toEqual(['ADMIN'])
  })
})
