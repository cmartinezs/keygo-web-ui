import type { AppPlan, AppPlanEntitlement } from '@/types/billing'

export type PlanId = 'free' | 'personal' | 'team' | 'business' | 'flex' | 'enterprise' | 'starter' | 'on-premise'

export interface PlanInfo {
  id: PlanId
  name: string
  badge?: string
  price: string
  priceNote: string
  annualSavingsNote?: string
  description: string
  features: string[]
  cta: string
  highlighted: boolean
}

export const PLANS: PlanInfo[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 'Gratis',
    priceNote: 'Para siempre',
    description:
      'Ideal para proyectos personales, prototipos o equipos pequeños que quieren explorar KeyGo sin compromisos.',
    features: [
      'Hasta 500 usuarios activos',
      '1 tenant incluido',
      '2 aplicaciones cliente',
      'Inicio de sesión seguro',
      'Soporte por comunidad',
    ],
    cta: 'Empezar gratis',
    highlighted: false,
  },
  {
    id: 'business',
    name: 'Business',
    badge: 'Más popular',
    price: '49 €',
    priceNote: 'por mes · facturación anual',
    description:
      'Para empresas en crecimiento que necesitan gestionar múltiples organizaciones con control total y soporte dedicado.',
    features: [
      'Usuarios ilimitados',
      'Tenants ilimitados',
      'Aplicaciones cliente ilimitadas',
      'Roles y permisos avanzados',
      'SSO con tus sistemas actuales',
      'Soporte prioritario por email',
      'SLA 99.9 % de disponibilidad',
    ],
    cta: 'Iniciar prueba de 14 días',
    highlighted: true,
  },
  {
    id: 'on-premise',
    name: 'On-Premise',
    price: 'A medida',
    priceNote: 'Licencia perpetua o suscripción',
    description:
      'Despliega KeyGo en tu propia infraestructura. Control total sobre tus datos, sin dependencias externas.',
    features: [
      'Instalación en tus servidores',
      'Datos 100 % bajo tu control',
      'Integración con Active Directory / LDAP',
      'Acceso completo al código fuente',
      'Soporte de implementación incluido',
      'Actualizaciones y parches garantizados',
    ],
    cta: 'Contactar con ventas',
    highlighted: false,
  },
]

export const PLAN_NAMES: Record<PlanId, string> = {
  free: 'Free',
  personal: 'Personal',
  team: 'Team',
  business: 'Business',
  flex: 'Flex',
  enterprise: 'Enterprise',
  starter: 'Starter',
  'on-premise': 'On-Premise',
}

export function formatCurrencyPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// ── Mapper: AppPlan (API) → PlanInfo (UI) ────────────────────────────────────

const METRIC_LABELS: Partial<Record<string, (e: AppPlanEntitlement) => string | null>> = {
  MAX_TENANTS:            (e) => e.is_enabled ? `Hasta un máximo de ${e.limit_value ?? '∞'} tenants` : null,
  MAX_TENANT_USERS:       (e) => e.is_enabled ? `Hasta ${e.limit_value ?? '∞'} identidades` : null,
  MAX_CLIENT_APPS:        (e) => e.is_enabled ? `Hasta ${e.limit_value ?? '∞'} aplicaciones` : null,
  MAX_ADMINS:             (e) => e.is_enabled ? `Hasta ${e.limit_value ?? '∞'} administradores` : null,
  MAX_MONTHLY_TOKENS:     (e) => e.is_enabled ? `${(e.limit_value ?? 0).toLocaleString('es-MX')} tokens/mes` : null,
  AUDIT_LOG_DAYS:         (e) => e.is_enabled ? `Logs de auditoría ${e.limit_value ?? '∞'} días` : null,
  SOCIAL_LOGIN:           (e) => e.is_enabled ? 'Social Login incluido' : null,
  CUSTOM_DOMAIN:          (e) => e.is_enabled ? 'Dominio personalizado' : null,
  SLA_UPTIME_PCT:         (e) => e.is_enabled && e.limit_value != null ? `SLA ${(e.limit_value / 10).toFixed(1)}% uptime` : null,
  PRIORITY_SUPPORT:       (e) => e.is_enabled ? 'Soporte prioritario' : null,
  CUSTOM_SLA:             (e) => e.is_enabled ? 'SLA personalizado' : null,
  DEDICATED_SUCCESS_MGR:  (e) => e.is_enabled ? 'Success Manager dedicado' : null,
}

const HIGHLIGHTED_CODES = new Set(['BUSINESS', 'TEAM'])

const CTA_MAP: Partial<Record<string, string>> = {
  FREE:       'Empezar gratis',
  PERSONAL:   'Empezar por $5/mes',
  TEAM:       'Iniciar prueba de 14 días',
  BUSINESS:   'Iniciar prueba de 14 días',
  FLEX:       'Ver tarifas Flex',
  ENTERPRISE: 'Hablar con ventas',
}

export function appPlanToPlanInfo(plan: AppPlan): PlanInfo {
  const version = plan.versions?.[0]
  const isFree = !version || version.free
  const defaultOption = version?.billing_options.find((o) => o.is_default) ?? version?.billing_options[0]

  const price =
    isFree || !defaultOption || defaultOption.base_price === 0
      ? plan.code === 'ENTERPRISE' || plan.code === 'FLEX'
        ? 'A medida'
        : 'Gratis'
      : formatCurrencyPrice(defaultOption.base_price, version!.currency)

  const priceNote =
    isFree || !defaultOption || defaultOption.base_price === 0
      ? plan.code === 'ENTERPRISE' || plan.code === 'FLEX'
        ? 'Pago por uso · contactar'
        : 'Para siempre'
      : defaultOption.billing_period === 'YEARLY'
        ? 'por año · facturación anual'
        : 'por mes'

  const features = plan.entitlements
    .map((e) => METRIC_LABELS[e.metric_code]?.(e) ?? null)
    .filter((f): f is string => f !== null)

  return {
    id: plan.code.toLowerCase() as PlanId,
    name: plan.name,
    badge: HIGHLIGHTED_CODES.has(plan.code) ? 'Más popular' : undefined,
    price,
    priceNote,
    description: plan.description ?? '',
    features,
    cta: CTA_MAP[plan.code] ?? 'Comenzar',
    highlighted: HIGHLIGHTED_CODES.has(plan.code),
  }
}
