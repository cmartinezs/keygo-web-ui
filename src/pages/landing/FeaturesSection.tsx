import type { ReactNode } from 'react'
import { IconShield, IconUsers, IconBuilding, IconClock, IconApps, IconCode } from '@/components/icons'

interface Feature {
  title: string
  description: string
  icon: ReactNode
}

const features: Feature[] = [
  {
    title: 'Autenticación estándar',
    description:
      'Implementa OAuth2 Authorization Code Flow con PKCE de forma nativa. Sin secretos en el browser, sin riesgos de intercepción.',
    icon: <IconShield className="w-6 h-6" aria-hidden="true" />,
  },
  {
    title: 'Control de acceso por roles',
    description:
      'Define permisos precisos para administradores globales, administradores de tenant y usuarios finales. Cada rol ve exactamente lo que necesita.',
    icon: <IconUsers className="w-6 h-6" aria-hidden="true" />,
  },
  {
    title: 'Multi-tenant nativo',
    description:
      'Gestiona múltiples organizaciones desde una sola instancia. Cada tenant con sus propios usuarios, aplicaciones y configuraciones aisladas.',
    icon: <IconBuilding className="w-6 h-6" aria-hidden="true" />,
  },
  {
    title: 'Tokens JWT seguros',
    description:
      'Emite tokens firmados con RS256 y los valida vía JWKS. El refresh silencioso se ejecuta automáticamente antes de que expire la sesión.',
    icon: <IconClock className="w-6 h-6" aria-hidden="true" />,
  },
  {
    title: 'Gestión de aplicaciones cliente',
    description:
      'Registra y administra las aplicaciones que se integran con KeyGo. Controla redirect URIs, scopes y ciclo de vida de cada client app.',
    icon: <IconApps className="w-6 h-6" aria-hidden="true" />,
  },
  {
    title: 'API REST documentada',
    description:
      'Documentación OpenAPI v3 completa. Integra KeyGo en tu stack en minutos con contratos claros y respuestas consistentes.',
    icon: <IconCode className="w-6 h-6" aria-hidden="true" />,
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-white px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-indigo-600 text-sm font-semibold uppercase tracking-widest">
            Características
          </span>
          <h2 className="mt-3 text-4xl font-extrabold text-slate-900">
            Todo lo que necesitas para gestionar identidades
          </h2>
          <p className="mt-4 text-slate-500 text-lg max-w-2xl mx-auto">
            KeyGo integra las mejores prácticas de seguridad en una plataforma cohesionada,
            eliminando la complejidad sin sacrificar control.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map(({ title, description, icon }) => (
            <article
              key={title}
              className="rounded-2xl border border-slate-100 bg-slate-50 p-6 hover:border-indigo-200 hover:shadow-md transition-all"
            >
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-4">
                {icon}
              </div>
              <h3 className="text-slate-900 font-semibold text-lg mb-2">{title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
