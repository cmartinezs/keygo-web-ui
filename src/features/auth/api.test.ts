import { beforeEach, describe, expect, it, vi } from 'vitest'

const authClientMock = vi.hoisted(() => ({
  post: vi.fn(),
  get: vi.fn(),
}))

vi.mock('@/shared/api/client', () => ({
  authClient: authClientMock,
  API_V1: '/api/v1',
  PLATFORM_URL: '/api/v1/platform',
  CLIENT_ID: 'keygo-ui',
  REDIRECT_URI: 'http://localhost:5173/callback',
}))

import { platformDirectLogin } from './api'

describe('auth api wrappers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sends platform direct-login credentials using snake_case wire format', async () => {
    authClientMock.post.mockResolvedValueOnce({
      data: {
        date: '2026-04-13T13:00:00Z',
        data: {
          access_token: 'token-ok',
        },
      },
    })

    const result = await platformDirectLogin(
      {
        emailOrUsername: 'admin@keygo.dev',
        password: 'super-secret',
      },
      { timeoutMs: 10_000, idempotencyKey: 'idem-direct-login-1' },
    )

    expect(authClientMock.post).toHaveBeenCalledWith(
      '/api/v1/platform/account/direct-login',
      {
        email_or_username: 'admin@keygo.dev',
        password: 'super-secret',
      },
      {
        signal: undefined,
        timeout: 10_000,
        headers: { 'X-Idempotency-Key': 'idem-direct-login-1' },
      },
    )
    expect(result).toEqual({ access_token: 'token-ok' })
  })
})
