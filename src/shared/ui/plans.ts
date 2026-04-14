import type {
  AppPlan,
  AppPlanEntitlement,
  AppPlanVersion,
  AppPlanVersionBillingOption,
  BillingPeriod,
} from '@/shared/types/billing'
import { i18n } from '@/shared/lib/i18n/config'
import { normalizeLocale } from '@/shared/lib/i18n/localeUtils'

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

function formatPlainNumber(value: number, locale?: string): string {
  const resolvedLocale = normalizeLocale(locale ?? i18n.resolvedLanguage ?? i18n.language)
  return new Intl.NumberFormat(resolvedLocale).format(value)
}

function translateOrFallback(key: string, fallback: string): string {
  const translated = i18n.t(key)
  return translated === key ? fallback : translated
}

function translatePlanField(plan: AppPlan, field: 'name' | 'description'): string {
  const fallback = field === 'name' ? plan.name : plan.description ?? ''
  return translateOrFallback(`subscribe.catalog.plans.${plan.code.toUpperCase()}.${field}`, fallback)
}

export function getPrimaryPlanVersion(plan: AppPlan): AppPlanVersion | null {
  return plan.versions?.find((version) => version.status === 'ACTIVE') ?? plan.versions?.[0] ?? null
}

export function getPlanBillingOptions(plan: AppPlan): AppPlanVersionBillingOption[] {
  return getPrimaryPlanVersion(plan)?.billing_options ?? []
}

export function planDeclaresPeriod(plan: AppPlan, period: BillingPeriod): boolean {
  return getPlanBillingOptions(plan).some((option) => option.billing_period === period)
}

export function planSupportsPeriod(plan: AppPlan, period: BillingPeriod): boolean {
  const billingOptions = getPlanBillingOptions(plan)
  if (billingOptions.length === 0) return true
  return billingOptions.some((option) => option.billing_period === period)
}

// ── Mapper: AppPlan (API) → PlanInfo (UI) ────────────────────────────────────

const METRIC_LABELS: Partial<Record<string, (e: AppPlanEntitlement, locale?: string) => string | null>> = {
  MAX_TENANTS: (e, locale) =>
    e.is_enabled
      ? e.limit_value
        ? i18n.t('subscribe.catalog.entitlements.maxTenants.upTo', {
            count: formatPlainNumber(e.limit_value, locale),
          })
        : i18n.t('subscribe.catalog.entitlements.maxTenants.unlimited')
      : null,
  MAX_TENANT_USERS: (e, locale) =>
    e.is_enabled
      ? e.limit_value
        ? i18n.t('subscribe.catalog.entitlements.maxTenantUsers.upTo', {
            count: formatPlainNumber(e.limit_value, locale),
          })
        : i18n.t('subscribe.catalog.entitlements.maxTenantUsers.unlimited')
      : null,
  MAX_CLIENT_APPS: (e, locale) =>
    e.is_enabled
      ? e.limit_value
        ? i18n.t('subscribe.catalog.entitlements.maxClientApps.upTo', {
            count: formatPlainNumber(e.limit_value, locale),
          })
        : i18n.t('subscribe.catalog.entitlements.maxClientApps.unlimited')
      : null,
  MAX_ADMINS: (e, locale) =>
    e.is_enabled
      ? e.limit_value
        ? i18n.t('subscribe.catalog.entitlements.maxAdmins.upTo', {
            count: formatPlainNumber(e.limit_value, locale),
          })
        : i18n.t('subscribe.catalog.entitlements.maxAdmins.unlimited')
      : null,
  MAX_MONTHLY_TOKENS: (e, locale) =>
    e.is_enabled
      ? e.limit_value
        ? i18n.t('subscribe.catalog.entitlements.maxMonthlyTokens.upTo', {
            count: formatPlainNumber(e.limit_value, locale),
          })
        : i18n.t('subscribe.catalog.entitlements.maxMonthlyTokens.unlimited')
      : null,
  AUDIT_LOG_DAYS: (e, locale) =>
    e.is_enabled
      ? e.limit_value
        ? i18n.t('subscribe.catalog.entitlements.auditLogDays.upTo', {
            count: formatPlainNumber(e.limit_value, locale),
          })
        : i18n.t('subscribe.catalog.entitlements.auditLogDays.unlimited')
      : null,
  SOCIAL_LOGIN: (e) => (e.is_enabled ? i18n.t('subscribe.catalog.entitlements.socialLogin.enabled') : null),
  CUSTOM_DOMAIN: (e) => (e.is_enabled ? i18n.t('subscribe.catalog.entitlements.customDomain.enabled') : null),
  SLA_UPTIME_PCT: (e) =>
    e.is_enabled && e.limit_value != null
      ? i18n.t('subscribe.catalog.entitlements.slaUptimePct.value', {
          value: (e.limit_value / 10).toFixed(1),
        })
      : null,
  PRIORITY_SUPPORT: (e) =>
    e.is_enabled ? i18n.t('subscribe.catalog.entitlements.prioritySupport.enabled') : null,
  CUSTOM_SLA: (e) => (e.is_enabled ? i18n.t('subscribe.catalog.entitlements.customSla.enabled') : null),
  DEDICATED_SUCCESS_MGR: (e) =>
    e.is_enabled ? i18n.t('subscribe.catalog.entitlements.dedicatedSuccessMgr.enabled') : null,
}

const HIGHLIGHTED_CODES = new Set(['BUSINESS', 'TEAM'])
const CUSTOM_CTA_CODES = new Set(['FLEX', 'ENTERPRISE', 'ON_PREMISE'])

function getBillingPeriodSuffix(period: BillingPeriod): string {
  switch (period) {
    case 'YEARLY':
      return i18n.t('subscribe.period.yearlySuffix')
    case 'ONE_TIME':
      return i18n.t('subscribe.period.oneTimeSuffix')
    case 'MONTHLY':
    default:
      return i18n.t('subscribe.period.monthlySuffix')
  }
}

function resolvePlanCta(
  plan: AppPlan,
  version: AppPlanVersion | null,
  billingOption: AppPlanVersionBillingOption | null,
): string {
  if (CUSTOM_CTA_CODES.has(plan.code)) {
    const customCta = i18n.t(`subscribe.catalog.cta.${plan.code.toUpperCase()}`)
    return customCta === `subscribe.catalog.cta.${plan.code.toUpperCase()}`
      ? i18n.t('subscribe.catalog.cta.default')
      : customCta
  }

  if (!version || version.free || !billingOption || billingOption.base_price === 0) {
    return i18n.t('subscribe.catalog.cta.free')
  }

  if (version.trial_days > 0) {
    return i18n.t('subscribe.catalog.cta.trial', {
      days: version.trial_days,
    })
  }

  return i18n.t('subscribe.catalog.cta.startAt', {
    price: `${formatCurrencyPrice(billingOption.base_price, version.currency)}${getBillingPeriodSuffix(billingOption.billing_period)}`,
  })
}

export function computePlanInfoForPeriod(plan: AppPlan, activePeriod: BillingPeriod): PlanInfo {
  const base = appPlanToPlanInfo(plan)
  const version = getPrimaryPlanVersion(plan)
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
    return i18n.t('subscribe.catalog.priceNote.perMonth')
  })()

  const annualSavingsNote = (() => {
    if (!isYearly || !activeOption || activeOption.base_price === 0) return undefined
    const yearlyTotal = formatCurrencyPrice(activeOption.base_price, version.currency)
    if (monthlyOption && monthlyOption.base_price > 0) {
      const saving = formatCurrencyPrice(
        monthlyOption.base_price * 12 - activeOption.base_price,
        version.currency,
      )
      return i18n.t('subscribe.catalog.annualSavings.withSavings', {
        yearlyTotal,
        saving,
      })
    }
    return i18n.t('subscribe.catalog.annualSavings.billedYearly', {
      yearlyTotal,
    })
  })()

  return {
    ...base,
    price,
    priceNote,
    annualSavingsNote,
    cta: resolvePlanCta(plan, version, activeOption),
  }
}

export function appPlanToPlanInfo(plan: AppPlan): PlanInfo {
  const version = getPrimaryPlanVersion(plan)
  const isFree = !version || version.free
  const defaultOption = version?.billing_options.find((o) => o.is_default) ?? version?.billing_options[0]

  const price =
    isFree || !defaultOption || defaultOption.base_price === 0
      ? plan.code === 'ENTERPRISE' || plan.code === 'FLEX'
        ? i18n.t('subscribe.catalog.customPrice')
        : i18n.t('subscribe.free')
      : formatCurrencyPrice(defaultOption.base_price, version!.currency)

  const priceNote =
    isFree || !defaultOption || defaultOption.base_price === 0
      ? plan.code === 'ENTERPRISE' || plan.code === 'FLEX'
        ? i18n.t('subscribe.catalog.priceNote.custom')
        : i18n.t('subscribe.catalog.priceNote.forever')
      : defaultOption.billing_period === 'YEARLY'
        ? i18n.t('subscribe.catalog.priceNote.perYearBilled')
        : i18n.t('subscribe.catalog.priceNote.perMonth')

  const features = plan.entitlements
    .map((e) => METRIC_LABELS[e.metric_code]?.(e, i18n.resolvedLanguage ?? i18n.language) ?? null)
    .filter((f): f is string => f !== null)

  return {
    id: plan.code.toLowerCase() as PlanId,
    name: translatePlanField(plan, 'name'),
    badge: HIGHLIGHTED_CODES.has(plan.code) ? i18n.t('subscribe.catalog.badgePopular') : undefined,
    price,
    priceNote,
    description: translatePlanField(plan, 'description'),
    features,
    cta: resolvePlanCta(plan, version ?? null, defaultOption ?? null),
    highlighted: HIGHLIGHTED_CODES.has(plan.code),
  }
}
