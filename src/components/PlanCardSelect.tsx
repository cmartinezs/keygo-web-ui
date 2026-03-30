import type { AppPlan, AppPlanVersion, AppPlanVersionBillingOption, BillingPeriod } from '@/types/billing'
import { PlanCard } from './PlanCard'
import { computePlanInfoForPeriod } from './plans'

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
  const billingOptions = version?.billing_options ?? []
  const activeOption =
    billingOptions.find((o) => o.billing_period === activePeriod) ??
    billingOptions.find((o) => o.is_default) ??
    billingOptions[0] ??
    null
  const isSelected = version?.id === selectedVersionId

  if (!version) return null

  const planInfo = computePlanInfoForPeriod(plan, activePeriod)

  return (
    <PlanCard
      plan={planInfo}
      mode="select"
      selected={isSelected}
      onSelect={() => onSelect(plan, version, activeOption)}
    />
  )
}
