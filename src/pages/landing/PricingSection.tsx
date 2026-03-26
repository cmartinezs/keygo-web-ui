import { PlanCard } from '@/components/PlanCard'
import { PLANS } from '@/components/plans'

export function PricingSection() {
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {PLANS.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              mode="display"
              ctaTo={`/subscribe?plan=${plan.id}`}
            />
          ))}
        </div>

        {/* Nota on-premise */}
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
