import { describe, expect, it } from 'vitest'
import {
  matchesSensitiveConfirmationPhrase,
  requiresSensitivePlatformRoleConfirmation,
} from './roleAssignmentGuards'

describe('requiresSensitivePlatformRoleConfirmation', () => {
  it('requires confirmation for uppercase KEYGO_ADMIN assigned to another user', () => {
    expect(
      requiresSensitivePlatformRoleConfirmation({
        selectedRoleCode: 'KEYGO_ADMIN',
        actorUserId: 'user-1',
        targetUserId: 'user-2',
      }),
    ).toBe(true)
  })

  it('does not require confirmation when assigning keygo_admin to self', () => {
    expect(
      requiresSensitivePlatformRoleConfirmation({
        selectedRoleCode: 'keygo_admin',
        actorUserId: 'user-1',
        targetUserId: 'user-1',
      }),
    ).toBe(false)
  })

  it('requires confirmation when actor identity is unavailable', () => {
    expect(
      requiresSensitivePlatformRoleConfirmation({
        selectedRoleCode: 'keygo_admin',
        actorUserId: undefined,
        targetUserId: 'user-2',
      }),
    ).toBe(true)
  })
})

describe('matchesSensitiveConfirmationPhrase', () => {
  it('matches the exact phrase after trimming input edges', () => {
    expect(
      matchesSensitiveConfirmationPhrase(
        'quiero asignar el rol KEYGO_ADMIN a cmartinez',
        '  quiero asignar el rol KEYGO_ADMIN a cmartinez  ',
      ),
    ).toBe(true)
  })

  it('rejects different casing or content', () => {
    expect(
      matchesSensitiveConfirmationPhrase(
        'quiero asignar el rol KEYGO_ADMIN a cmartinez',
        'Quiero asignar el rol KEYGO_ADMIN a cmartinez',
      ),
    ).toBe(false)
  })
})
