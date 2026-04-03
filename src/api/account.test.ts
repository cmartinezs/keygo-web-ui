import { beforeEach, describe, expect, it, vi } from 'vitest'

const apiClientMock = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}))

vi.mock('./client', () => ({
  apiClient: apiClientMock,
  tenantUrl: (slug: string) => `/api/v1/tenants/${slug}`,
}))

import {
  ACCOUNT_QUERY_KEYS,
  changePassword,
  forgotPassword,
  getAccountAccess,
  getNotificationPreferences,
  getSessions,
  linkAccountConnection,
  recoverPassword,
  revokeSession,
  resetPasswordWithTemporaryPassword,
  unlinkAccountConnection,
  updateNotificationPreferences,
} from './account'

describe('account api wrappers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('exposes stable query keys per account domain', () => {
    expect(ACCOUNT_QUERY_KEYS.profile('acme')).toEqual(['account', 'profile', 'acme'])
    expect(ACCOUNT_QUERY_KEYS.sessions('acme')).toEqual(['account', 'sessions', 'acme'])
    expect(ACCOUNT_QUERY_KEYS.notificationPreferences('acme')).toEqual([
      'account',
      'notification-preferences',
      'acme',
    ])
    expect(ACCOUNT_QUERY_KEYS.access('acme')).toEqual(['account', 'access', 'acme'])
    expect(ACCOUNT_QUERY_KEYS.connections('acme')).toEqual(['account', 'connections', 'acme'])
  })

  it('maps change-password request from snake_case to wire camelCase', async () => {
    apiClientMock.post.mockResolvedValueOnce({
      data: {
        date: '2026-04-02T12:00:00Z',
        data: { changed: true },
      },
    })

    const result = await changePassword(
      'acme',
      { current_password: 'old-pass', new_password: 'new-pass' },
      { timeoutMs: 10_000, idempotencyKey: 'idem-1' },
    )

    expect(apiClientMock.post).toHaveBeenCalledWith(
      '/api/v1/tenants/acme/account/change-password',
      { currentPassword: 'old-pass', newPassword: 'new-pass' },
      {
        signal: undefined,
        timeout: 10_000,
        headers: { 'X-Idempotency-Key': 'idem-1' },
      },
    )
    expect(result).toEqual({ changed: true })
  })

  it('maps sessions wire response to internal snake_case shape', async () => {
    apiClientMock.get.mockResolvedValueOnce({
      data: {
        date: '2026-04-02T12:00:00Z',
        data: [
          {
            sessionId: 'sess-1',
            status: 'ACTIVE',
            browser: 'Chrome',
            os: 'Linux',
            deviceType: 'Desktop',
            ipAddress: '127.0.0.1',
            createdAt: '2026-04-01T10:00:00Z',
            lastAccessedAt: '2026-04-02T11:00:00Z',
            expiresAt: '2026-04-03T11:00:00Z',
            isCurrent: true,
          },
        ],
      },
    })

    const result = await getSessions('acme', { timeoutMs: 10_000 })

    expect(apiClientMock.get).toHaveBeenCalledWith('/api/v1/tenants/acme/account/sessions', {
      signal: undefined,
      timeout: 10_000,
    })
    expect(result).toEqual([
      {
        session_id: 'sess-1',
        status: 'ACTIVE',
        browser: 'Chrome',
        os: 'Linux',
        device_type: 'Desktop',
        ip_address: '127.0.0.1',
        created_at: '2026-04-01T10:00:00Z',
        last_accessed_at: '2026-04-02T11:00:00Z',
        expires_at: '2026-04-03T11:00:00Z',
        is_current: true,
      },
    ])
  })

  it('maps revoke-session response from wire fields to internal fields', async () => {
    apiClientMock.delete.mockResolvedValueOnce({
      data: {
        date: '2026-04-02T12:00:00Z',
        data: {
          sessionId: 'sess-9',
          alreadyClosed: false,
        },
      },
    })

    const result = await revokeSession('acme', 'sess-9', { timeoutMs: 10_000 })

    expect(apiClientMock.delete).toHaveBeenCalledWith('/api/v1/tenants/acme/account/sessions/sess-9', {
      signal: undefined,
      timeout: 10_000,
    })
    expect(result).toEqual({ session_id: 'sess-9', already_closed: false })
  })

  it('maps notification preferences in both directions (wire <-> internal)', async () => {
    apiClientMock.get.mockResolvedValueOnce({
      data: {
        date: '2026-04-02T12:00:00Z',
        data: {
          securityAlertsEmail: true,
          securityAlertsInApp: false,
          billingAlertsEmail: true,
          productUpdatesEmail: false,
          weeklyDigest: true,
        },
      },
    })

    const getResult = await getNotificationPreferences('acme', { timeoutMs: 10_000 })

    expect(getResult).toEqual({
      security_alerts_email: true,
      security_alerts_in_app: false,
      billing_alerts_email: true,
      product_updates_email: false,
      weekly_digest: true,
    })

    apiClientMock.patch.mockResolvedValueOnce({
      data: {
        date: '2026-04-02T12:00:00Z',
        data: {
          securityAlertsEmail: false,
          securityAlertsInApp: true,
          billingAlertsEmail: false,
          productUpdatesEmail: true,
          weeklyDigest: false,
        },
      },
    })

    const patchResult = await updateNotificationPreferences(
      'acme',
      {
        security_alerts_email: false,
        security_alerts_in_app: true,
        billing_alerts_email: false,
        product_updates_email: true,
        weekly_digest: false,
      },
      { timeoutMs: 10_000, idempotencyKey: 'idem-2' },
    )

    expect(apiClientMock.patch).toHaveBeenCalledWith(
      '/api/v1/tenants/acme/account/notification-preferences',
      {
        securityAlertsEmail: false,
        securityAlertsInApp: true,
        billingAlertsEmail: false,
        productUpdatesEmail: true,
        weeklyDigest: false,
      },
      {
        signal: undefined,
        timeout: 10_000,
        headers: { 'X-Idempotency-Key': 'idem-2' },
      },
    )

    expect(patchResult).toEqual({
      security_alerts_email: false,
      security_alerts_in_app: true,
      billing_alerts_email: false,
      product_updates_email: true,
      weekly_digest: false,
    })
  })

  it('maps account access list from wire UserAccessData to internal shape', async () => {
    apiClientMock.get.mockResolvedValueOnce({
      data: {
        date: '2026-04-02T12:00:00Z',
        data: [
          {
            clientAppId: 'app-1',
            clientAppName: 'Console',
            membershipId: 'mem-1',
            status: 'ACTIVE',
            roles: ['ADMIN', 'READER'],
          },
        ],
      },
    })

    const result = await getAccountAccess('acme', { timeoutMs: 10_000 })

    expect(apiClientMock.get).toHaveBeenCalledWith('/api/v1/tenants/acme/account/access', {
      signal: undefined,
      timeout: 10_000,
    })
    expect(result).toEqual([
      {
        app_id: 'app-1',
        app_name: 'Console',
        membership_id: 'mem-1',
        status: 'ACTIVE',
        roles: ['ADMIN', 'READER'],
      },
    ])
  })

  it('calls forgot/recover/reset-password account endpoints with expected payloads', async () => {
    apiClientMock.post.mockResolvedValueOnce({
      data: {
        date: '2026-04-03T12:00:00Z',
        data: { sent: true },
      },
    })

    const forgotResult = await forgotPassword(
      'acme',
      { email: 'person@example.com' },
      { timeoutMs: 10_000 },
    )

    expect(apiClientMock.post).toHaveBeenCalledWith(
      '/api/v1/tenants/acme/account/forgot-password',
      { email: 'person@example.com' },
      {
        signal: undefined,
        timeout: 10_000,
        headers: undefined,
      },
    )
    expect(forgotResult).toEqual({ sent: true })

    apiClientMock.post.mockResolvedValueOnce({
      data: {
        date: '2026-04-03T12:00:00Z',
        data: { recovered: true },
      },
    })

    const recoverResult = await recoverPassword(
      'acme',
      { recovery_token: 'token-123', new_password: 'NewPass123!' },
      { timeoutMs: 10_000, idempotencyKey: 'idem-rec-1' },
    )

    expect(apiClientMock.post).toHaveBeenCalledWith(
      '/api/v1/tenants/acme/account/recover-password',
      { recovery_token: 'token-123', new_password: 'NewPass123!' },
      {
        signal: undefined,
        timeout: 10_000,
        headers: { 'X-Idempotency-Key': 'idem-rec-1' },
      },
    )
    expect(recoverResult).toEqual({ recovered: true })

    apiClientMock.post.mockResolvedValueOnce({
      data: {
        date: '2026-04-03T12:00:00Z',
        data: { reset: true },
      },
    })

    const resetResult = await resetPasswordWithTemporaryPassword(
      'acme',
      {
        email: 'person@example.com',
        temporary_password: 'TempPass123!',
        new_password: 'NewPass123!',
      },
      { timeoutMs: 10_000, idempotencyKey: 'idem-rst-1' },
    )

    expect(apiClientMock.post).toHaveBeenCalledWith(
      '/api/v1/tenants/acme/account/reset-password',
      {
        email: 'person@example.com',
        temporary_password: 'TempPass123!',
        new_password: 'NewPass123!',
      },
      {
        signal: undefined,
        timeout: 10_000,
        headers: { 'X-Idempotency-Key': 'idem-rst-1' },
      },
    )
    expect(resetResult).toEqual({ reset: true })
  })

  it('builds encoded links/unlinks for temporary connections endpoints', async () => {
    apiClientMock.post.mockResolvedValueOnce({
      data: {
        date: '2026-04-02T12:00:00Z',
        data: {
          linked: true,
          connection: {
            id: 'conn-1',
            provider: 'google',
            status: 'ACTIVE',
            linked_at: '2026-04-02T12:00:00Z',
          },
        },
      },
    })

    await linkAccountConnection(
      'acme',
      'google workspace',
      { authorization_code: 'abc', state: 'xyz' },
      { timeoutMs: 10_000, idempotencyKey: 'idem-3' },
    )

    expect(apiClientMock.post).toHaveBeenCalledWith(
      '/api/v1/tenants/acme/account/connections/google%20workspace/link',
      { authorization_code: 'abc', state: 'xyz' },
      {
        signal: undefined,
        timeout: 10_000,
        headers: { 'X-Idempotency-Key': 'idem-3' },
      },
    )

    apiClientMock.delete.mockResolvedValueOnce({
      data: {
        date: '2026-04-02T12:00:00Z',
        data: { unlinked: true },
      },
    })

    const unlinkResult = await unlinkAccountConnection('acme', 'conn/1', { timeoutMs: 10_000 })

    expect(apiClientMock.delete).toHaveBeenCalledWith('/api/v1/tenants/acme/account/connections/conn%2F1', {
      signal: undefined,
      timeout: 10_000,
    })
    expect(unlinkResult).toEqual({ unlinked: true })
  })
})
