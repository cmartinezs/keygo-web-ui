import type { PlanId } from '@/api/contracts'
import { PlanCard } from '@/components/PlanCard'
import { PLANS } from '@/components/plans'

export type { PlanId }

interface PlanStepProps {
  selectedPlan: PlanId | null
  onSelect: (plan: PlanId) => void
  onNext: () => void
}

export function PlanStep({ selectedPlan, onSelect, onNext }: PlanStepProps) {
  return (
    <div className="flex flex-col gap-8">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold text-slate-900">Elige tu plan</h2>
        <p className="mt-2 text-slate-500 text-base">
          Selecciona el plan que mejor se adapta a tu organización.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
        {PLANS.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            mode="select"
            selected={selectedPlan === plan.id}
            onSelect={() => onSelect(plan.id)}
          />
        ))}
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={onNext}
          disabled={!selectedPlan}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-semibold px-8 py-3 rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
        >
          Continuar →
        </button>
      </div>
    </div>
  )
}

