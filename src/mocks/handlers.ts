// ── MSW Handlers ───────────────────────────────────────────────────────────────
// Endpoints temporales que aún no tienen contrato oficial en el backend.
// Todos los handlers marcados con ⏳ deben eliminarse cuando el backend publique
// el contrato real y se migre la UI al endpoint definitivo.

import { http, HttpResponse } from 'msw'

const API_V1_GLOB = '*/api/v1'

// Base URL pattern: /api/v1/tenants/{tenantSlug}/account/connections*
// Usa glob "*" al final para capturar sub-rutas (link / unlink).
const CONNECTIONS_BASE = `${API_V1_GLOB}/tenants/:tenantSlug/account/connections`

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

interface MockPendingFeatureSnapshot {
  feature_id: string
  title: string
  summary: string
  columns: string[]
  rows: Record<string, string>[]
  kpis: Array<{ key: string; label: string; value: string }>
  actions?: Array<{ id: string; label: string; tone?: 'default' | 'danger' }>
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

const mockPendingFeatures: Record<string, MockPendingFeatureSnapshot> = {
  apps: {
    feature_id: 'apps',
    title: 'Aplicaciones',
    summary: 'Catalogo de aplicaciones y estado de despliegue por tenant.',
    columns: ['id', 'nombre', 'owner', 'estado'],
    rows: [
      { id: 'app-001', nombre: 'Portal Clientes', owner: 'plataforma', estado: 'ACTIVE' },
      { id: 'app-002', nombre: 'Backoffice Ventas', owner: 'tenant-acme', estado: 'PENDING' },
      { id: 'app-003', nombre: 'Soporte Operaciones', owner: 'tenant-orion', estado: 'ACTIVE' },
    ],
    kpis: [
      { key: 'apps_total', label: 'Total apps', value: '3' },
      { key: 'apps_active', label: 'Activas', value: '2' },
      { key: 'apps_pending', label: 'Pendientes', value: '1' },
    ],
    actions: [{ id: 'sync-catalog', label: 'Sincronizar catalogo' }],
  },
  users: {
    feature_id: 'users',
    title: 'Usuarios cross-tenant',
    summary: 'Vista global de usuarios registrados en la plataforma.',
    columns: ['id', 'usuario', 'tenant', 'estado'],
    rows: [
      { id: 'usr-100', usuario: 'ana.mora', tenant: 'acme', estado: 'ACTIVE' },
      { id: 'usr-101', usuario: 'diego.paz', tenant: 'orion', estado: 'SUSPENDED' },
      { id: 'usr-102', usuario: 'pamela.rojas', tenant: 'acme', estado: 'ACTIVE' },
    ],
    kpis: [
      { key: 'users_total', label: 'Total usuarios', value: '3' },
      { key: 'users_active', label: 'Activos', value: '2' },
      { key: 'users_suspended', label: 'Suspendidos', value: '1' },
    ],
    actions: [{ id: 'refresh-directory', label: 'Actualizar directorio' }],
  },
  access: {
    feature_id: 'access',
    title: 'Accesos',
    summary: 'Matriz de permisos y roles por aplicacion.',
    columns: ['id', 'rol', 'aplicacion', 'estado'],
    rows: [
      { id: 'acc-200', rol: 'ADMIN', aplicacion: 'Portal Clientes', estado: 'ACTIVE' },
      { id: 'acc-201', rol: 'VIEWER', aplicacion: 'Backoffice Ventas', estado: 'ACTIVE' },
      { id: 'acc-202', rol: 'EDITOR', aplicacion: 'Soporte Operaciones', estado: 'PENDING' },
    ],
    kpis: [
      { key: 'roles_total', label: 'Roles asignados', value: '3' },
      { key: 'roles_active', label: 'Activos', value: '2' },
      { key: 'roles_pending', label: 'Pendientes', value: '1' },
    ],
    actions: [{ id: 'recalculate-permissions', label: 'Recalcular permisos' }],
  },
  audit: {
    feature_id: 'audit',
    title: 'Registro global',
    summary: 'Eventos recientes de seguridad y operacion de la plataforma.',
    columns: ['id', 'evento', 'actor', 'fecha'],
    rows: [
      { id: 'evt-301', evento: 'LOGIN_SUCCESS', actor: 'ana.mora', fecha: '2026-04-03 10:22' },
      { id: 'evt-302', evento: 'TENANT_SUSPENDED', actor: 'admin.platform', fecha: '2026-04-03 09:14' },
      { id: 'evt-303', evento: 'ROLE_UPDATED', actor: 'diego.paz', fecha: '2026-04-02 18:50' },
    ],
    kpis: [
      { key: 'events_today', label: 'Eventos hoy', value: '37' },
      { key: 'events_security', label: 'Seguridad', value: '9' },
      { key: 'events_critical', label: 'Criticos', value: '1' },
    ],
    actions: [{ id: 'export-audit', label: 'Exportar eventos' }],
  },
  'signing-keys': {
    feature_id: 'signing-keys',
    title: 'Claves de firma',
    summary: 'Llaves publicas y estado de rotacion.',
    columns: ['kid', 'algoritmo', 'estado', 'rotacion'],
    rows: [
      { kid: 'key-01', algoritmo: 'RS256', estado: 'ACTIVE', rotacion: '2026-06-15' },
      { kid: 'key-00', algoritmo: 'RS256', estado: 'DEPRECATED', rotacion: '2026-03-15' },
    ],
    kpis: [
      { key: 'keys_total', label: 'Total keys', value: '2' },
      { key: 'keys_active', label: 'Activas', value: '1' },
      { key: 'keys_deprecated', label: 'Obsoletas', value: '1' },
    ],
    actions: [{ id: 'rotate-key', label: 'Rotar clave' }],
  },
  sessions: {
    feature_id: 'sessions',
    title: 'Sesiones admin',
    summary: 'Sesiones activas por tenant y por usuario.',
    columns: ['id', 'usuario', 'tenant', 'ultimo_acceso'],
    rows: [
      { id: 'ses-401', usuario: 'ana.mora', tenant: 'acme', ultimo_acceso: 'hace 3 min' },
      { id: 'ses-402', usuario: 'diego.paz', tenant: 'orion', ultimo_acceso: 'hace 11 min' },
      { id: 'ses-403', usuario: 'pamela.rojas', tenant: 'acme', ultimo_acceso: 'hace 22 min' },
    ],
    kpis: [
      { key: 'sessions_active', label: 'Activas', value: '3' },
      { key: 'sessions_risk', label: 'Riesgo alto', value: '0' },
      { key: 'sessions_remote', label: 'Remotas', value: '2' },
    ],
    actions: [{ id: 'close-stale-sessions', label: 'Cerrar sesiones inactivas', tone: 'danger' }],
  },
  tokens: {
    feature_id: 'tokens',
    title: 'Tokens',
    summary: 'Inventario de tokens y estado de revocacion.',
    columns: ['id', 'tipo', 'owner', 'estado'],
    rows: [
      { id: 'tok-501', tipo: 'ACCESS', owner: 'ana.mora', estado: 'ACTIVE' },
      { id: 'tok-502', tipo: 'REFRESH', owner: 'diego.paz', estado: 'ACTIVE' },
      { id: 'tok-503', tipo: 'ACCESS', owner: 'svc-billing', estado: 'REVOKED' },
    ],
    kpis: [
      { key: 'tokens_total', label: 'Total tokens', value: '3' },
      { key: 'tokens_active', label: 'Activos', value: '2' },
      { key: 'tokens_revoked', label: 'Revocados', value: '1' },
    ],
    actions: [{ id: 'revoke-risky-tokens', label: 'Revocar tokens riesgosos', tone: 'danger' }],
  },
  members: {
    feature_id: 'members',
    title: 'Miembros del tenant',
    summary: 'Miembros internos y roles de colaboracion.',
    columns: ['id', 'nombre', 'rol', 'estado'],
    rows: [
      { id: 'mem-601', nombre: 'Ana Mora', rol: 'OWNER', estado: 'ACTIVE' },
      { id: 'mem-602', nombre: 'Pablo Rios', rol: 'EDITOR', estado: 'ACTIVE' },
      { id: 'mem-603', nombre: 'Carla Soto', rol: 'VIEWER', estado: 'INVITED' },
    ],
    kpis: [
      { key: 'members_total', label: 'Miembros', value: '3' },
      { key: 'members_active', label: 'Activos', value: '2' },
      { key: 'members_invited', label: 'Invitados', value: '1' },
    ],
    actions: [{ id: 'resend-invitations', label: 'Reenviar invitaciones' }],
  },
  services: {
    feature_id: 'services',
    title: 'Servicios del tenant',
    summary: 'Servicios externos conectados por tenant.',
    columns: ['id', 'servicio', 'tipo', 'estado'],
    rows: [
      { id: 'svc-701', servicio: 'Webhook Facturacion', tipo: 'WEBHOOK', estado: 'ACTIVE' },
      { id: 'svc-702', servicio: 'Sync CRM', tipo: 'INTEGRATION', estado: 'PENDING' },
      { id: 'svc-703', servicio: 'API Partner', tipo: 'API_KEY', estado: 'ACTIVE' },
    ],
    kpis: [
      { key: 'services_total', label: 'Servicios', value: '3' },
      { key: 'services_active', label: 'Activos', value: '2' },
      { key: 'services_pending', label: 'Pendientes', value: '1' },
    ],
    actions: [{ id: 'test-connections', label: 'Probar conexiones' }],
  },
  'my-access': {
    feature_id: 'my-access',
    title: 'Mi acceso',
    summary: 'Roles y membresias del usuario autenticado por aplicacion.',
    columns: ['id', 'aplicacion', 'rol', 'estado'],
    rows: [
      { id: 'my-801', aplicacion: 'Portal Clientes', rol: 'ADMIN', estado: 'ACTIVE' },
      { id: 'my-802', aplicacion: 'Backoffice Ventas', rol: 'VIEWER', estado: 'ACTIVE' },
    ],
    kpis: [
      { key: 'my_roles', label: 'Roles activos', value: '2' },
      { key: 'my_apps', label: 'Apps con acceso', value: '2' },
      { key: 'my_pending', label: 'Pendientes', value: '0' },
    ],
    actions: [{ id: 'request-role-review', label: 'Solicitar revision de rol' }],
  },
  activity: {
    feature_id: 'activity',
    title: 'Actividad',
    summary: 'Actividad reciente de la cuenta.',
    columns: ['id', 'evento', 'origen', 'fecha'],
    rows: [
      { id: 'act-901', evento: 'Inicio de sesion', origen: 'Chrome / CL', fecha: '2026-04-03 10:22' },
      { id: 'act-902', evento: 'Cambio de password', origen: 'Firefox / CL', fecha: '2026-04-02 19:01' },
      { id: 'act-903', evento: 'Actualizacion de perfil', origen: 'Chrome / CL', fecha: '2026-04-01 11:45' },
    ],
    kpis: [
      { key: 'activity_week', label: 'Eventos semana', value: '14' },
      { key: 'activity_security', label: 'Eventos seguridad', value: '3' },
      { key: 'activity_alerts', label: 'Alertas', value: '0' },
    ],
    actions: [{ id: 'download-activity', label: 'Descargar actividad' }],
  },
}

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
  /**
   * GET /api/v1/platform/pending-features/:featureId
   * ⏳ pendiente backend — temporal MSW para modulos placeholder del dashboard.
   */
  http.get(`${API_V1_GLOB}/platform/pending-features/:featureId`, ({ params }) => {
    const featureId = params.featureId as string
    const snapshot = mockPendingFeatures[featureId]

    if (!snapshot) {
      return errorResponse('RESOURCE_NOT_FOUND', 'Modulo no encontrado', 404)
    }

    return successResponse(snapshot, 'PENDING_FEATURE_SNAPSHOT_RETRIEVED')
  }),

  /**
   * POST /api/v1/platform/pending-features/:featureId/actions
   * ⏳ pendiente backend — temporal MSW para acciones simuladas de modulos placeholder.
   */
  http.post(`${API_V1_GLOB}/platform/pending-features/:featureId/actions`, async ({ params, request }) => {
    const featureId = params.featureId as string
    const snapshot = mockPendingFeatures[featureId]

    if (!snapshot) {
      return errorResponse('RESOURCE_NOT_FOUND', 'Modulo no encontrado', 404)
    }

    const body = (await request.json()) as {
      action?: string
      item_id?: string
    }
    const action = body.action ?? 'unknown'

    return successResponse(
      {
        action,
        item_id: body.item_id,
        ok: true,
        message: `Accion '${action}' ejecutada en modo mock para ${featureId}.`,
      },
      'PENDING_FEATURE_ACTION_EXECUTED',
    )
  }),

  // ── Handlers ⏳ pendiente backend (T-033) — suspend / activate usuario ─────

  /**
   * PUT /api/v1/tenants/:tenantSlug/users/:userId/suspend
   * ⏳ pendiente backend (T-033) — temporal MSW
   * Idempotente: devuelve already_suspended=true si ya estaba suspendido.
   */
  http.put(`${API_V1_GLOB}/tenants/:tenantSlug/users/:userId/suspend`, ({ params }) => {
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
  http.put(`${API_V1_GLOB}/tenants/:tenantSlug/users/:userId/activate`, ({ params }) => {
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
  http.get(`${API_V1_GLOB}/tenants/:tenantSlug/users/:userId/sessions`, ({ params }) => {
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
