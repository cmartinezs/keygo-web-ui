import { useQuery } from '@tanstack/react-query'
import { PlanCard } from '@/components/PlanCard'
import { appPlanToPlanInfo } from '@/components/plans'
import { getBillingCatalog, BILLING_QUERY_KEYS } from '@/api/billing'
import { TENANT, CLIENT_ID } from '@/api/client'

export function PricingSection() {
  const { data: rawPlans = [], isLoading, isError } = useQuery({
    queryKey: BILLING_QUERY_KEYS.catalog(TENANT, CLIENT_ID),
    queryFn: () => getBillingCatalog(),
    staleTime: 1000 * 60 * 10,
  })

  console.log('[PricingSection] Fetched plans from API:', rawPlans)

  const plans = rawPlans
    .filter((p) => p.is_public && p.status === 'ACTIVE')
    .map(appPlanToPlanInfo)

  return (
    <section id="pricing" className="py-24 bg-slate-50 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-indigo-600 text-sm font-semibold uppercase tracking-widest">
            Planes y precios
          </span>
          <h2 className="mt-3 text-4xl font-extrabold text-slate-900">
            Escoge el plan que mejor se adapta
          </h2>
          <p className="mt-4 text-slate-500 text-lg max-w-2xl mx-auto">
            Cloud gestionado o despliegue en tus propios servidores — KeyGo se adapta
            a las necesidades de cada organización, sin letra pequeña.
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

        {!isLoading && !isError && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                mode="display"
                ctaTo={`/subscribe?plan=${plan.id}`}
              />
            ))}
          </div>
        )}

        <div className="mt-12 text-center">
          <p className="text-slate-500 text-sm">
            ¿Tu organización tiene requisitos específicos de cumplimiento o soberanía de datos?{' '}
            <a href="#pricing" className="text-indigo-600 font-medium hover:underline">
              Habla con nuestro equipo
            </a>{' '}
            y diseñamos juntos la solución ideal.
          </p>
        </div>
      </div>
    </section>
  )
}
