import type { AppPlan, AppPlanVersion, BillingPeriod } from '@/types/billing'

const PERIOD_LABELS: Record<BillingPeriod, string> = {
  MONTHLY: 'mes',
  ANNUAL: 'año',
  ONE_TIME: 'único',
}

function formatPrice(price: number, currency: string, period: BillingPeriod): string {
  const formatted = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price)
  return price === 0 ? 'Gratis' : `${formatted} / ${PERIOD_LABELS[period]}`
}

interface PlanCardSelectProps {
  plan: AppPlan
  selectedVersionId: string | null
  onSelect: (plan: AppPlan, version: AppPlanVersion) => void
}

function PlanCardSelect({ plan, selectedVersionId, onSelect }: PlanCardSelectProps) {
  const activeVersions = plan.versions.filter((v) => v.status === 'ACTIVE')
  const currentVersion = activeVersions[0]
  const isSelected = activeVersions.some((v) => v.id === selectedVersionId)

  if (!currentVersion) return null

  const monthlyV = activeVersions.find((v) => v.billingPeriod === 'MONTHLY')
  const annualV = activeVersions.find((v) => v.billingPeriod === 'ANNUAL')
  const selectedV = activeVersions.find((v) => v.id === selectedVersionId) ?? currentVersion

  return (
    <div
      role="radio"
      aria-checked={isSelected}
      tabIndex={0}
      onClick={() => onSelect(plan, selectedV)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onSelect(plan, selectedV)
      }}
      className={`relative flex flex-col gap-4 rounded-2xl border-2 p-6 cursor-pointer transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
        isSelected
          ? 'border-indigo-500 bg-indigo-50 shadow-md shadow-indigo-100'
          : 'border-slate-200 bg-white hover:border-indigo-300 hover:shadow-sm'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-lg font-bold text-slate-900">{plan.name}</p>
          {plan.description && (
            <p className="text-sm text-slate-500 mt-0.5 leading-snug">{plan.description}</p>
          )}
        </div>
        {plan.subscriberType === 'TENANT' ? (
          <span className="shrink-0 text-xs font-medium bg-sky-100 text-sky-700 rounded-full px-2.5 py-0.5">
            Empresa
          </span>
        ) : (
          <span className="shrink-0 text-xs font-medium bg-violet-100 text-violet-700 rounded-full px-2.5 py-0.5">
            Personal
          </span>
        )}
      </div>

      {/* Billing period toggle (only if both MONTHLY and ANNUAL exist) */}
      {monthlyV && annualV && (
        <div className="flex gap-1 rounded-lg bg-slate-100 p-1 w-fit" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => onSelect(plan, monthlyV)}
            className={`text-xs font-medium px-3 py-1 rounded-md transition-colors ${
              selectedVersionId === monthlyV.id
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Mensual
          </button>
          <button
            type="button"
            onClick={() => onSelect(plan, annualV)}
            className={`text-xs font-medium px-3 py-1 rounded-md transition-colors ${
              selectedVersionId === annualV.id
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Anual
          </button>
        </div>
      )}

      {/* Price */}
      <p className="text-2xl font-extrabold text-slate-900">
        {formatPrice(selectedV.basePrice, selectedV.currency, selectedV.billingPeriod)}
      </p>

      {/* Trial */}
      {selectedV.trialDays > 0 && (
        <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5">
          {selectedV.trialDays} días de prueba gratuita
        </p>
      )}

      {/* Entitlements */}
      {plan.entitlements.filter((e) => e.isEnabled).length > 0 && (
        <ul className="flex flex-col gap-2 mt-1">
          {plan.entitlements
            .filter((e) => e.isEnabled)
            .slice(0, 5)
            .map((ent) => (
              <li key={ent.id} className="flex items-center gap-2 text-sm text-slate-600">
                <svg className="w-4 h-4 text-emerald-500 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>
                  {ent.metricType === 'QUOTA' && ent.limitValue !== null
                    ? `Hasta ${ent.limitValue} ${ent.metricCode.toLowerCase().replace(/_/g, ' ')}`
                    : ent.metricCode.toLowerCase().replace(/_/g, ' ')}
                </span>
              </li>
            ))}
        </ul>
      )}

      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute top-4 right-4 w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center" aria-hidden="true">
          <svg className="w-3 h-3 text-white" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}
    </div>
  )
}

interface PlanStepProps {
  plans: AppPlan[]
  isLoading: boolean
  isError: boolean
  selectedPlanId: string | null
  selectedVersionId: string | null
  onSelect: (plan: AppPlan, version: AppPlanVersion) => void
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

      {isLoading && (
        <div className="flex items-center justify-center py-16 text-slate-400" role="status" aria-live="polite">
          <svg className="animate-spin w-6 h-6 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
          Cargando planes…
        </div>
      )}

      {isError && (
        <div className="flex flex-col items-center gap-3 py-12 text-center" role="alert">
          <p className="text-slate-600 font-medium">No se pudo cargar el catálogo de planes.</p>
          <p className="text-sm text-slate-400">Por favor, recarga la página o inténtalo más tarde.</p>
        </div>
      )}

      {!isLoading && !isError && plans.length === 0 && (
        <p className="text-center text-slate-500 py-12">No hay planes disponibles en este momento.</p>
      )}

      {!isLoading && !isError && plans.length > 0 && (
        <div
          role="radiogroup"
          aria-label="Planes disponibles"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch"
        >
          {plans.map((plan) => (
            <PlanCardSelect
              key={plan.id}
              plan={plan}
              selectedVersionId={selectedVersionId}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}

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

