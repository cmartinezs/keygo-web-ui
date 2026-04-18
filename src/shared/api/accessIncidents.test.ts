import { beforeEach, describe, expect, it, vi } from 'vitest'

const apiClientMock = vi.hoisted(() => ({
  post: vi.fn(),
}))

vi.mock('@/shared/api/client', () => ({
  apiClient: apiClientMock,
  API_V1: '/api/v1',
}))

import { createAccessIncidentReport } from './accessIncidents'

describe('access incident api wrappers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sends the access denied incident payload in snake_case wire format', async () => {
    apiClientMock.post.mockResolvedValueOnce({
      data: {
        date: '2026-04-14T15:40:00Z',
        data: {
          incident_id: 'incident-001',
          received_at: '2026-04-14T15:40:00Z',
          status: 'RECEIVED',
        },
      },
    })

    const payload = {
      incident_type: 'ACCESS_DENIED' as const,
      feature_key: 'dashboard_tenants',
      route_path: '/dashboard/tenants',
      current_url: 'http://localhost:5173/dashboard/tenants',
      resource_path: '/api/v1/tenants',
      resource_label: 'tenants asociados',
      user_comment: 'Deberia poder ver mis tenants asociados.',
      http_status: 403,
      error_code: 'INSUFFICIENT_PERMISSIONS',
      client_message: "You don't have permission to perform this action.",
      error_origin: 'BUSINESS_RULE' as const,
      trace_id: 'trace-denied-001',
      exception: 'AuthorizationDeniedException',
      detail: 'Access Denied',
      actor_sub: 'user-123',
      actor_email: 'account.admin@keygo.dev',
      actor_username: 'account.admin@keygo.dev',
      active_role: 'keygo_account_admin' as const,
      detected_roles: ['keygo_account_admin', 'keygo_user'] as const,
      tenant_claim: 'keygo',
      managed_tenant_slug: null,
      ui_trace_id: 'ui-trace-001',
      resource_context: {
        search_query: '',
        filter_status: 'ALL',
        page: 0,
        managed_tenant_slug: null,
      },
    }

    const result = await createAccessIncidentReport(payload, {
      timeoutMs: 10_000,
      idempotencyKey: 'idem-access-incident-1',
    })

    expect(apiClientMock.post).toHaveBeenCalledWith(
      '/api/v1/platform/support/access-incidents',
      payload,
      {
        signal: undefined,
        timeout: 10_000,
        headers: { 'X-Idempotency-Key': 'idem-access-incident-1' },
      },
    )
    expect(result).toEqual({
      incident_id: 'incident-001',
      received_at: '2026-04-14T15:40:00Z',
      status: 'RECEIVED',
    })
  })
})
