import { beforeEach, describe, expect, it } from 'vitest'
import { useTokenStore } from './tokenStore'

function ensureSessionStorage() {
  if (typeof sessionStorage !== 'undefined') return

  const storage = new Map<string, string>()
  Object.defineProperty(globalThis, 'sessionStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value)
      },
      removeItem: (key: string) => {
        storage.delete(key)
      },
      clear: () => {
        storage.clear()
      },
    },
  })
}

describe('tokenStore role context', () => {
  beforeEach(() => {
    ensureSessionStorage()
    useTokenStore.getState().clearTokens()
  })

  it('sets activeRole using role hierarchy when tokens are stored', () => {
    useTokenStore.getState().setTokens({
      accessToken: 'at',
      idToken: 'it',
      refreshToken: 'rt',
      roles: ['keygo_account_admin', 'keygo_user'],
    })

    expect(useTokenStore.getState().activeRole).toBe('keygo_account_admin')
  })

  it('allows switching active role only to owned roles', () => {
    useTokenStore.getState().setTokens({
      accessToken: 'at',
      idToken: 'it',
      refreshToken: 'rt',
      roles: ['keygo_admin', 'keygo_account_admin', 'keygo_user'],
    })

    useTokenStore.getState().setActiveRole('keygo_user')
    expect(useTokenStore.getState().activeRole).toBe('keygo_user')

    useTokenStore.getState().setActiveRole('keygo_admin')
    expect(useTokenStore.getState().activeRole).toBe('keygo_admin')
  })

  it('ignores active role changes to roles the user does not own', () => {
    useTokenStore.getState().setTokens({
      accessToken: 'at',
      idToken: 'it',
      refreshToken: 'rt',
      roles: ['keygo_user'],
    })

    useTokenStore.getState().setActiveRole('keygo_admin')
    expect(useTokenStore.getState().activeRole).toBe('keygo_user')
  })
})
