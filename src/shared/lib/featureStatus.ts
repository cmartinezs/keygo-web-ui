/**
 * Mapa centralizado de features incompletas o con backend pendiente.
 * Usado por PendingFeatureBadge para mostrar información consistente.
 *
 * Estructura:
 * - featureCode: Código de tracking (F-042, T-033, etc.)
 * - status: 'GAP_BACKEND' | 'TEMP_MSW' | 'PLACEHOLDER' | 'PARTIAL'
 * - title: Un título descriptivo del issue
 * - description: Explicación detallada de qué falta
 */

export interface FeatureStatus {
  featureCode: string
  status: 'GAP_BACKEND' | 'TEMP_MSW' | 'PLACEHOLDER' | 'PARTIAL'
  title: string
  description: string
}

export const FEATURE_STATUS_MAP: Record<string, FeatureStatus> = {
  // ── Cuenta propia (self-service)
  'connections': {
    featureCode: 'F-042',
    status: 'TEMP_MSW',
    title: 'Conexiones externas — Backend en desarrollo',
    description:
      'Vincular, desvincular y listar conexiones externas (Google, GitHub, Microsoft). Actualmente funciona con datos simulados. Cuando el backend publique el contrato oficial, los datos persistirán realmente.',
  },

  // ── Usuarios administrados por tenant
  'suspend-activate': {
    featureCode: 'T-033',
    status: 'TEMP_MSW',
    title: 'Suspender/Activar usuario — Backend en desarrollo',
    description:
      'Suspender y activar usuarios individuales. Botones para cambiar el estado están en la fila de cada usuario (Suspender/Activar). Actualmente funciona con mocks. Una vez el backend implemente el endpoint, estos cambios serán persistentes.',
  },
  'user-sessions': {
    featureCode: 'T-110',
    status: 'TEMP_MSW',
    title: 'Ver sesiones del usuario — Backend en desarrollo',
    description:
      'Ver todas las sesiones activas de un usuario específico (navegador, SO, IP, último acceso). Botón "Sesiones" en cada fila. Actualmente devuelve datos simulados. Cuando el backend publique el endpoint, mostrará las sesiones reales.',
  },

  // ── Admin cross-tenant modules (PLACEHOLDER)
  'apps': {
    featureCode: 'ADMIN_APPS',
    status: 'PLACEHOLDER',
    title: 'Aplicaciones cross-tenant — Backend no definido',
    description:
      'Gestión de aplicaciones a nivel plataforma. Requiere endpoint backend para listar/crear/editar aplicaciones. Sin especificación funcional aún.',
  },
  'users': {
    featureCode: 'ADMIN_USERS',
    status: 'PLACEHOLDER',
    title: 'Usuarios cross-tenant — Backend no definido',
    description:
      'Auditoría y gestión de usuarios a nivel plataforma (distinto de TenantUsersPage). Requiere endpoint backend de usuarios globales. Sin especificación funcional aún.',
  },
  'access': {
    featureCode: 'ADMIN_ACCESS',
    status: 'PLACEHOLDER',
    title: 'Accesos cross-tenant — Backend no definido',
    description:
      'Auditoría de roles y permisos a nivel plataforma. Requiere endpoint backend para listar accesos globales. Sin especificación funcional aún.',
  },
  'signing-keys': {
    featureCode: 'ADMIN_SIGNING_KEYS',
    status: 'PLACEHOLDER',
    title: 'Claves de firma — Backend no definido',
    description:
      'Gestión de claves para firmado de JWTs y tokens. Requiere endpoint backend para JWKS management. Sin especificación funcional aún.',
  },
  'tokens': {
    featureCode: 'ADMIN_TOKENS',
    status: 'PLACEHOLDER',
    title: 'Tokens — Backend no definido',
    description:
      'Gestión de tokens activos, revocación, y auditoría. Requiere endpoint backend de tokens. Sin especificación funcional aún.',
  },
  'audit': {
    featureCode: 'PLATFORM_AUDIT',
    status: 'GAP_BACKEND',
    title: 'Auditoría global plataforma — Contrato no definido',
    description:
      'Registro de eventos global a nivel plataforma. Requiere definir endpoint backend o tabla `audit_events`. Sin especificación ni OpenAPI aún.',
  },
  'members': {
    featureCode: 'TENANT_MEMBERS',
    status: 'PLACEHOLDER',
    title: 'Miembros del tenant — Backend no definido',
    description:
      'Gestión de membresías y permisos por tenant. Distinto de usuarios (que pueden no ser miembros). Requiere endpoint backend de memberships. Sin especificación funcional aún.',
  },
  'services': {
    featureCode: 'TENANT_SERVICES',
    status: 'PLACEHOLDER',
    title: 'Servicios del tenant — Backend no definido',
    description:
      'Integración con servicios externos por tenant (webhooks, API keys, etc.). Requiere endpoint backend de servicios. Sin especificación funcional aún.',
  },
  'my-access': {
    featureCode: 'USER_MY_ACCESS',
    status: 'PLACEHOLDER',
    title: 'Mi acceso — Wiring incompleto',
    description:
      'Vista de accesos personales del usuario autenticado (qué roles tiene, en qué aplicaciones). Podría usar `GET /account/access` pero requiere UI completa de visualización.',
  },
  'sessions': {
    featureCode: 'ADMIN_SESSIONS',
    status: 'PLACEHOLDER',
    title: 'Sesiones (admin) — Backend no definido',
    description:
      'Gestión y auditoría de sesiones a nivel plataforma. Requiere endpoint backend para listar/cerrar sesiones globales. Sin especificación funcional aún.',
  },
  // ── Dashboards (parcial)
  'dashboard-metrics': {
    featureCode: 'DASHBOARD',
    status: 'PARTIAL',
    title: 'Métricas del dashboard — Parcial',
    description:
      'Dashboard ADMIN_TENANT usa datos reales pero sin filtro de rango de fechas. Dashboard USER_TENANT usa sesiones y accesos; falta histórico detallado. Requiere `GET /stats/*` con parámetros de fecha.',
  },
  'activity': {
    featureCode: 'USER_ACTIVITY',
    status: 'PARTIAL',
    title: 'Mi cuenta > Actividad — Parcial',
    description:
      'Muestra sesiones y resumen de accesos. Falta histórico detallado de actividad del usuario. Requiere endpoint de auditoría personal (T-076) o tabla `audit_events`.',
  },

  // ── Billing & Payment
  'psp-payment': {
    featureCode: 'PAYMENT_PSP',
    status: 'GAP_BACKEND',
    title: 'Pago real PSP (producción) — Decisión de negocio pendiente',
    description:
      'Integración con proveedor de pagos real (Stripe, MercadoPago, etc.). Requiere seleccionar proveedor y configurar credenciales. Actualmente solo mock-approve-payment en DEV.',
  },
}

/**
 * Obtener el status de una feature por ID.
 * Retorna undefined si no existe registro.
 */
export function getFeatureStatus(featureId: string): FeatureStatus | undefined {
  return FEATURE_STATUS_MAP[featureId]
}

/**
 * Retorna true si la feature tiene backend pendiente.
 */
export function isFeatureIncomplete(featureId: string): boolean {
  return Boolean(getFeatureStatus(featureId))
}
