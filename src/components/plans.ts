import type { AppPlan, AppPlanEntitlement, BillingPeriod } from '@/types/billing'
import { i18n } from '@/i18n/config'
import { normalizeLocale } from '@/i18n/localeUtils'

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

export function formatCurrencyPrice(amount: number, currency: string, locale?: string): string {
  const resolvedLocale = normalizeLocale(locale ?? i18n.resolvedLanguage ?? i18n.language)
  return new Intl.NumberFormat(resolvedLocale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// ── Mapper: AppPlan (API) → PlanInfo (UI) ────────────────────────────────────

const METRIC_LABELS: Partial<Record<string, (e: AppPlanEntitlement) => string | null>> = {
  MAX_TENANTS:            (e) => e.is_enabled ? (e.limit_value ? `Hasta ${e.limit_value} tenants` : 'Tenants ilimitados') : null,
  MAX_TENANT_USERS:       (e) => e.is_enabled ? (e.limit_value ? `Hasta ${e.limit_value} identidades` : 'Identidades ilimitadas') : null,
  MAX_CLIENT_APPS:        (e) => e.is_enabled ? (e.limit_value ? `Hasta ${e.limit_value} aplicaciones` : 'Aplicaciones ilimitadas') : null,
  MAX_ADMINS:             (e) => e.is_enabled ? (e.limit_value ? `Hasta ${e.limit_value} administradores` : 'Administradores ilimitados') : null,
  MAX_MONTHLY_TOKENS:     (e) => e.is_enabled ? (e.limit_value ? `${e.limit_value.toLocaleString('es-MX')} tokens/mes` : 'Tokens ilimitados') : null,
  AUDIT_LOG_DAYS:         (e) => e.is_enabled ? (e.limit_value ? `Logs de auditoría ${e.limit_value} días` : 'Logs de auditoría sin límite') : null,
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

export function computePlanInfoForPeriod(plan: AppPlan, activePeriod: BillingPeriod): PlanInfo {
  const base = appPlanToPlanInfo(plan)
  const version = plan.versions?.find((v) => v.status === 'ACTIVE') ?? plan.versions?.[0]
  if (!version) return base

  const isFree = version.free
  const billingOptions = version.billing_options ?? []
  const activeOption =
    billingOptions.find((o) => o.billing_period === activePeriod) ??
    billingOptions.find((o) => o.is_default) ??
    billingOptions[0] ??
    null
  const isYearly = !isFree && activeOption?.billing_period === 'YEARLY'
  const monthlyOption = billingOptions.find((o) => o.billing_period === 'MONTHLY') ?? null

  const price = (() => {
    if (isFree || !activeOption || activeOption.base_price === 0) return base.price
    if (isYearly) return formatCurrencyPrice(activeOption.base_price / 12, version.currency)
    return formatCurrencyPrice(activeOption.base_price, version.currency)
  })()

  const priceNote = (() => {
    if (isFree || !activeOption || activeOption.base_price === 0) return base.priceNote
    return 'por mes'
  })()

  const annualSavingsNote = (() => {
    if (!isYearly || !activeOption || activeOption.base_price === 0) return undefined
    const yearlyTotal = formatCurrencyPrice(activeOption.base_price, version.currency)
    if (monthlyOption && monthlyOption.base_price > 0) {
      const saving = formatCurrencyPrice(
        monthlyOption.base_price * 12 - activeOption.base_price,
        version.currency,
      )
      return `Pagas ${yearlyTotal}/año · ahorras ${saving} vs mensual`
    }
    return `Facturado ${yearlyTotal} al año`
  })()

  return { ...base, price, priceNote, annualSavingsNote }
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
