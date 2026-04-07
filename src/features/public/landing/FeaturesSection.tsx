import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { IconShield, IconUsers, IconBuilding, IconClock, IconApps, IconCode } from '@/shared/ui/icons'

interface Feature {
  key: string
  icon: ReactNode
}

const features: Feature[] = [
  {
    key: 'authentication',
    icon: <IconShield className="w-6 h-6" aria-hidden="true" />,
  },
  {
    key: 'roleAccess',
    icon: <IconUsers className="w-6 h-6" aria-hidden="true" />,
  },
  {
    key: 'multiTenant',
    icon: <IconBuilding className="w-6 h-6" aria-hidden="true" />,
  },
  {
    key: 'jwt',
    icon: <IconClock className="w-6 h-6" aria-hidden="true" />,
  },
  {
    key: 'clientApps',
    icon: <IconApps className="w-6 h-6" aria-hidden="true" />,
  },
  {
    key: 'api',
    icon: <IconCode className="w-6 h-6" aria-hidden="true" />,
  },
]

export function FeaturesSection() {
  const { t } = useTranslation()

  return (
    <section id="features" className="py-24 bg-white px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-indigo-600 text-sm font-semibold uppercase tracking-widest">
            {t('landing.features.eyebrow')}
          </span>
          <h2 className="mt-3 text-4xl font-extrabold text-slate-900">
            {t('landing.features.title')}
          </h2>
          <p className="mt-4 text-slate-500 text-lg max-w-2xl mx-auto">
            {t('landing.features.description')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map(({ key, icon }) => (
            <article
              key={key}
              className="rounded-2xl border border-slate-100 bg-slate-50 p-6 hover:border-indigo-200 hover:shadow-md transition-all"
            >
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-4">
                {icon}
              </div>
              <h3 className="text-slate-900 font-semibold text-lg mb-2">{t(`landing.features.items.${key}.title`)}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{t(`landing.features.items.${key}.description`)}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
