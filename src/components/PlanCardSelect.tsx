import type { AppPlan, AppPlanVersion, AppPlanVersionBillingOption, BillingPeriod } from '@/types/billing'
import { PlanCard } from './PlanCard'
import { appPlanToPlanInfo, formatCurrencyPrice } from './plans'
import type { PlanInfo } from './plans'

export interface PlanSelectHandler {
  (plan: AppPlan, version: AppPlanVersion, billingOption: AppPlanVersionBillingOption | null): void
}

interface PlanCardSelectProps {
  plan: AppPlan
  selectedVersionId: string | null
  activePeriod: BillingPeriod
  onSelect: PlanSelectHandler
}

export function PlanCardSelect({ plan, selectedVersionId, activePeriod, onSelect }: PlanCardSelectProps) {
  const versions = plan.versions ?? []
  const version = versions.find((v) => v.status === 'ACTIVE') ?? versions[0]
  const isFree = !version || version.free
  const billingOptions = version?.billing_options ?? []
  const activeOption =
    billingOptions.find((o) => o.billing_period === activePeriod) ??
    billingOptions.find((o) => o.is_default) ??
    billingOptions[0] ??
    null
  const isSelected = version?.id === selectedVersionId

  if (!version) return null

  const base = appPlanToPlanInfo(plan)

  const isYearly = !isFree && activeOption?.billing_period === 'YEARLY'
  const monthlyOption = billingOptions.find((o) => o.billing_period === 'MONTHLY') ?? null

  // For yearly: show price per month equivalent; savings note shows total yearly vs monthly×12
  const displayPrice = (() => {
    if (isFree || !activeOption || activeOption.base_price === 0) return base.price
    if (isYearly) return formatCurrencyPrice(activeOption.base_price / 12, version.currency)
    return formatCurrencyPrice(activeOption.base_price, version.currency)
  })()

  const displayPriceNote = (() => {
    if (isFree || !activeOption || activeOption.base_price === 0) return base.priceNote
    return 'por mes'
  })()

  const annualSavingsNote = (() => {
    if (!isYearly || !activeOption || activeOption.base_price === 0) return undefined
    const yearlyTotal = formatCurrencyPrice(activeOption.base_price, version.currency)
    if (monthlyOption && monthlyOption.base_price > 0) {
      const saving = formatCurrencyPrice(monthlyOption.base_price * 12 - activeOption.base_price, version.currency)
      return `Pagas ${yearlyTotal}/año · ahorras ${saving} vs mensual`
    }
    return `Facturado ${yearlyTotal} al año`
  })()

  const planInfo: PlanInfo = {
    ...base,
    price: displayPrice,
    priceNote: displayPriceNote,
    annualSavingsNote,
  }

  return (
    <PlanCard
      plan={planInfo}
      mode="select"
      selected={isSelected}
      onSelect={() => onSelect(plan, version, activeOption)}
    />
  )
}
