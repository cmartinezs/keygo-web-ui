import type { AppPlan, AppPlanVersion, AppPlanVersionBillingOption } from '@/types/billing'
import { PlanCatalogGrid } from '@/components/PlanCatalogGrid'

interface PlanStepProps {
  plans: AppPlan[]
  isLoading: boolean
  isError: boolean
  selectedPlanId: string | null
  selectedVersionId: string | null
  onSelect: (plan: AppPlan, version: AppPlanVersion, billingOption: AppPlanVersionBillingOption | null) => void
  onNext: () => void
}

export function PlanStep({
  plans,
  isLoading,
  isError,
  selectedPlanId,
  selectedVersionId,
  onSelect,
  onNext,
}: PlanStepProps) {
  const canContinue = !!selectedPlanId && !!selectedVersionId

  return (
    <div className="flex flex-col gap-8">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold text-slate-900">Elige tu plan</h2>
        <p className="mt-2 text-slate-500 text-base">
          Selecciona el plan que mejor se adapta a tus necesidades.
        </p>
      </div>

      <PlanCatalogGrid
        mode="select"
        plans={plans}
        isLoading={isLoading}
        isError={isError}
        selectedVersionId={selectedVersionId}
        onSelect={onSelect}
      />

      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={onNext}
          disabled={!canContinue}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-semibold px-8 py-3 rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
        >
          Continuar →
        </button>
      </div>
    </div>
  )
}

