import type { AppPlan, AppPlanVersion, AppPlanVersionBillingOption, BillingPeriod } from '@/types/billing'
import { useTranslation } from 'react-i18next'
import { PlanCatalogGrid } from '@/components/PlanCatalogGrid'

interface PlanStepProps {
  plans: AppPlan[]
  isLoading: boolean
  isError: boolean
  onRetry?: () => void
  selectedPlanId: string | null
  selectedVersionId: string | null
  activePeriod: BillingPeriod
  onPeriodChange: (period: BillingPeriod) => void
  onSelect: (plan: AppPlan, version: AppPlanVersion, billingOption: AppPlanVersionBillingOption | null) => void
  onNext: () => void
}

export function PlanStep({
  plans,
  isLoading,
  isError,
  onRetry,
  selectedPlanId,
  selectedVersionId,
  activePeriod,
  onPeriodChange,
  onSelect,
  onNext,
}: PlanStepProps) {
  const { t } = useTranslation()
  const canContinue = !!selectedPlanId && !!selectedVersionId

  return (
    <div className="flex flex-col gap-4">
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{t('subscribe.steps.plan.title')}</h2>
        <p className="mt-2 text-slate-500 text-base">
          {t('subscribe.steps.plan.description')}
        </p>
      </div>

      <PlanCatalogGrid
        mode="select"
        plans={plans}
        isLoading={isLoading}
        isError={isError}
        onRetry={onRetry}
        selectedVersionId={selectedVersionId}
        activePeriod={activePeriod}
        onPeriodChange={onPeriodChange}
        onSelect={onSelect}
      />

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onNext}
          disabled={!canContinue}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-semibold px-8 py-3 rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
        >
          {t('subscribe.actions.continue')}
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
        </button>
      </div>
    </div>
  )
}

