import { useQuery } from '@tanstack/react-query'
import { PlanCatalogGrid } from '@/components/PlanCatalogGrid'
import { getBillingCatalog, BILLING_QUERY_KEYS } from '@/api/billing'
import { TENANT, CLIENT_ID } from '@/api/client'

export function PricingSection() {
  const { data: rawPlans = [], isLoading, isError } = useQuery({
    queryKey: BILLING_QUERY_KEYS.catalog(TENANT, CLIENT_ID),
    queryFn: () => getBillingCatalog(),
    staleTime: 1000 * 60 * 10,
  })

  const plans = rawPlans.filter((p) => p.is_public && p.status === 'ACTIVE')

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

        {!isLoading && !isError && (
          <PlanCatalogGrid
            mode="display"
            plans={plans}
            isLoading={isLoading}
            isError={isError}
            ctaBase="/subscribe"
          />
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
