import { describe, expect, it, vi } from 'vitest'

vi.mock('@/shared/api/client', () => ({
  API_V1: 'http://localhost:8080/keygo-server/api/v1',
}))

import { extractRoles } from './jwksVerify'
import type { KeyGoJwtClaims } from '@/shared/types/auth'

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
        roles: ['keygo_admin', 'keygo_account_admin', 'keygo_user'],
      }),
    )

    expect(roles).toEqual(['keygo_admin', 'keygo_account_admin', 'keygo_user'])
  })

  it('normalizes lowercase roles and removes duplicates', () => {
    const roles = extractRoles(
      claimsWith({
        roles: ['KEYGO_ADMIN', 'keygo_admin', 'KEYGO_USER'],
      }),
    )

    expect(roles).toEqual(['keygo_admin', 'keygo_user'])
  })

  it('returns empty when roles claim is not a list', () => {
    const roles = extractRoles(claimsWith({ roles: 'keygo_account_admin' as unknown as string[] }))

    expect(roles).toEqual([])
  })

  it('filters unknown roles', () => {
    const roles = extractRoles(claimsWith({ roles: ['keygo_admin', 'SUPER_ADMIN'] }))

    expect(roles).toEqual(['keygo_admin'])
  })
})
