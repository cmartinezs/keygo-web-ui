// ── MSW Handlers ───────────────────────────────────────────────────────────────
// Endpoints temporales que aún no tienen contrato oficial en el backend.
// Todos los handlers marcados con ⏳ deben eliminarse cuando el backend publique
// el contrato real y se migre la UI al endpoint definitivo.

import { http, HttpResponse } from 'msw'

// Base URL pattern: /api/v1/tenants/{tenantSlug}/account/connections*
// Usa glob "*" al final para capturar sub-rutas (link / unlink).
const CONNECTIONS_BASE = '/api/v1/tenants/:tenantSlug/account/connections'

// ── Datos semilla (mock state en memoria para la sesión del worker) ────────────

type ConnectionStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING'

interface MockConnection {
  id: string
  provider: string
  provider_user_id: string
  status: ConnectionStatus
  linked_at: string
  last_used_at: string | null
}

/** Mapa userId → status para simular suspend/activate (T-033) */
const mockUserStatuses: Record<string, string> = {}

let mockConnections: MockConnection[] = [
  {
    id: 'conn-001',
    provider: 'google',
    provider_user_id: 'google-uid-abc123',
    status: 'ACTIVE',
    linked_at: '2025-12-01T10:00:00Z',
    last_used_at: '2026-03-28T08:15:00Z',
  },
  {
    id: 'conn-002',
    provider: 'github',
    provider_user_id: 'github-uid-xyz789',
    status: 'ACTIVE',
    linked_at: '2026-01-15T14:30:00Z',
    last_used_at: null,
  },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function successResponse<T>(data: T, code = 'ACCOUNT_CONNECTIONS_RETRIEVED') {
  return HttpResponse.json({
    date: new Date().toISOString(),
    success: { code, message: 'OK' },
    data,
  })
}

function errorResponse(code: string, message: string, status: number) {
  return HttpResponse.json(
    {
      date: new Date().toISOString(),
      failure: { code, message },
    },
    { status },
  )
}

// ── Handlers ⏳ pendiente backend (F-042) ─────────────────────────────────────

export const handlers = [
  // ── Handlers ⏳ pendiente backend (T-033) — suspend / activate usuario ─────

  /**
   * PUT /api/v1/tenants/:tenantSlug/users/:userId/suspend
   * ⏳ pendiente backend (T-033) — temporal MSW
   * Idempotente: devuelve already_suspended=true si ya estaba suspendido.
   */
  http.put('/api/v1/tenants/:tenantSlug/users/:userId/suspend', ({ params }) => {
    const userId = params.userId as string
    const alreadySuspended = (mockUserStatuses[userId] ?? 'ACTIVE') === 'SUSPENDED'
    mockUserStatuses[userId] = 'SUSPENDED'
    return successResponse(
      { user_id: userId, status: 'SUSPENDED', already_suspended: alreadySuspended },
      'USER_SUSPENDED',
    )
  }),

  /**
   * PUT /api/v1/tenants/:tenantSlug/users/:userId/activate
   * ⏳ pendiente backend (T-033) — temporal MSW
   * Idempotente: devuelve already_active=true si ya estaba activo.
   */
  http.put('/api/v1/tenants/:tenantSlug/users/:userId/activate', ({ params }) => {
    const userId = params.userId as string
    const alreadyActive = (mockUserStatuses[userId] ?? 'ACTIVE') === 'ACTIVE'
    mockUserStatuses[userId] = 'ACTIVE'
    return successResponse(
      { user_id: userId, status: 'ACTIVE', already_active: alreadyActive },
      'USER_ACTIVATED',
    )
  }),

  // ── Handler ⏳ pendiente backend (T-110) — sesiones de usuario (admin) ─────

  /**
   * GET /api/v1/tenants/:tenantSlug/users/:userId/sessions
   * ⏳ pendiente backend (T-110) — temporal MSW
   * Devuelve sesiones activas del usuario. isCurrent siempre false en contexto admin.
   */
  http.get('/api/v1/tenants/:tenantSlug/users/:userId/sessions', ({ params }) => {
    const userId = params.userId as string
    const now = Date.now()
    const mockSessions = [
      {
        session_id: `sess-${userId}-001`,
        status: 'ACTIVE',
        browser: 'Chrome 124',
        os: 'Windows 11',
        device_type: 'DESKTOP',
        ip_address: '203.0.113.1',
        created_at: new Date(now - 3_600_000 * 2).toISOString(),
        last_accessed_at: new Date(now - 60_000 * 5).toISOString(),
        expires_at: new Date(now + 3_600_000 * 6).toISOString(),
        is_current: false,
      },
      {
        session_id: `sess-${userId}-002`,
        status: 'ACTIVE',
        browser: 'Firefox 125',
        os: 'macOS Sonoma',
        device_type: 'DESKTOP',
        ip_address: '198.51.100.42',
        created_at: new Date(now - 3_600_000 * 24).toISOString(),
        last_accessed_at: new Date(now - 3_600_000).toISOString(),
        expires_at: new Date(now + 3_600_000 * 4).toISOString(),
        is_current: false,
      },
    ]
    return successResponse(mockSessions, 'USER_SESSIONS_RETRIEVED')
  }),

  // ── Handlers ⏳ pendiente backend (F-042) — conexiones de cuenta ──────────

  /**
   * GET /api/v1/tenants/:tenantSlug/account/connections
   * ⏳ pendiente backend (F-042) — temporal MSW
   * Devuelve la lista de conexiones externas del usuario autenticado.
   */
  http.get(CONNECTIONS_BASE, () => {
    return successResponse(mockConnections, 'ACCOUNT_CONNECTIONS_RETRIEVED')
  }),

  /**
   * POST /api/v1/tenants/:tenantSlug/account/connections/:provider/link
   * ⏳ pendiente backend (F-042) — temporal MSW
   * Vincula una nueva conexión externa al usuario autenticado.
   */
  http.post(`${CONNECTIONS_BASE}/:provider/link`, ({ params }) => {
    const provider = params.provider as string

    if (mockConnections.some((c) => c.provider === provider)) {
      return errorResponse(
        'BUSINESS_RULE_VIOLATION',
        `El proveedor '${provider}' ya está vinculado a esta cuenta.`,
        409,
      )
    }

    const newConnection: MockConnection = {
      id: `conn-${Date.now()}`,
      provider,
      provider_user_id: `${provider}-uid-${Math.random().toString(36).slice(2, 9)}`,
      status: 'ACTIVE',
      linked_at: new Date().toISOString(),
      last_used_at: null,
    }
    mockConnections.push(newConnection)

    return successResponse(
      { linked: true, connection: newConnection },
      'ACCOUNT_CONNECTION_LINKED',
    )
  }),

  /**
   * DELETE /api/v1/tenants/:tenantSlug/account/connections/:connectionId
   * ⏳ pendiente backend (F-042) — temporal MSW
   * Desvincula una conexión externa del usuario autenticado.
   */
  http.delete(`${CONNECTIONS_BASE}/:connectionId`, ({ params }) => {
    const connectionId = params.connectionId as string
    const exists = mockConnections.some((c) => c.id === connectionId)

    if (!exists) {
      return errorResponse('RESOURCE_NOT_FOUND', 'Conexión no encontrada.', 404)
    }

    mockConnections = mockConnections.filter((c) => c.id !== connectionId)

    return successResponse({ unlinked: true }, 'ACCOUNT_CONNECTION_UNLINKED')
  }),
]
