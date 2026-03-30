import { useState } from 'react'
import type { AppPlan, AppPlanVersion, AppPlanVersionBillingOption, BillingPeriod } from '@/types/billing'
import { PlanCard } from './PlanCard'
import { PlanCardSelect } from './PlanCardSelect'
import { computePlanInfoForPeriod } from './plans'

type DisplayMode = {
  mode: 'display'
  ctaBase?: string
}

type SelectMode = {
  mode: 'select'
  selectedVersionId: string | null
  onSelect: (plan: AppPlan, version: AppPlanVersion, billingOption: AppPlanVersionBillingOption | null) => void
}

type PlanCatalogGridProps = {
  plans: AppPlan[]
  isLoading?: boolean
  isError?: boolean
} & (DisplayMode | SelectMode)

function hasMultiplePeriods(plans: AppPlan[]): boolean {
  return plans.some((p) => {
    const opts = p.versions?.[0]?.billing_options ?? []
    return opts.some((o) => o.billing_period === 'MONTHLY') && opts.some((o) => o.billing_period === 'YEARLY')
  })
}

export function PlanCatalogGrid(props: PlanCatalogGridProps) {
  const { plans, isLoading = false, isError = false } = props
  const [activePeriod, setActivePeriod] = useState<BillingPeriod>('MONTHLY')
  const showPeriodToggle = hasMultiplePeriods(plans)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-slate-400" role="status" aria-live="polite">
        <svg className="animate-spin w-6 h-6 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        </svg>
        Cargando planes…
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center" role="alert">
        <p className="text-slate-600 font-medium">No se pudo cargar el catálogo de planes.</p>
        <p className="text-sm text-slate-400">Por favor, recarga la página o inténtalo más tarde.</p>
      </div>
    )
  }

  if (plans.length === 0) {
    return <p className="text-center text-slate-500 py-12">No hay planes disponibles en este momento.</p>
  }

  return (
    <div className="flex flex-col gap-6">
      {showPeriodToggle && (
        <div className="flex justify-center">
          <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setActivePeriod('MONTHLY')}
              className={`text-sm font-medium px-5 py-2 rounded-lg transition-colors ${
                activePeriod === 'MONTHLY'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Mensual
            </button>
            <button
              type="button"
              onClick={() => setActivePeriod('YEARLY')}
              className={`text-sm font-medium px-5 py-2 rounded-lg transition-colors ${
                activePeriod === 'YEARLY'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Anual
            </button>
          </div>
        </div>
      )}

      <div
        role={props.mode === 'select' ? 'radiogroup' : undefined}
        aria-label={props.mode === 'select' ? 'Planes disponibles' : undefined}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch"
      >
        {plans.map((plan) => {
          if (props.mode === 'display') {
            return (
              <PlanCard
                key={plan.id}
                plan={computePlanInfoForPeriod(plan, activePeriod)}
                mode="display"
                ctaTo={`${props.ctaBase ?? '/subscribe'}?plan=${plan.code.toLowerCase()}`}
              />
            )
          }
          return (
            <PlanCardSelect
              key={plan.id}
              plan={plan}
              selectedVersionId={props.selectedVersionId}
              activePeriod={activePeriod}
              onSelect={props.onSelect}
            />
          )
        })}
      </div>
    </div>
  )
}
