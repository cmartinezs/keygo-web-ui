import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { IconDocument, IconCode, IconSettings } from '@/shared/ui/icons'

interface Resource {
  key: string
  icon: ReactNode
  ctaHref: string
  pending: boolean
}

const resources: Resource[] = [
  {
    key: 'docs',
    icon: <IconDocument className="w-6 h-6" aria-hidden="true" />,
    ctaHref: '/developers',
    pending: false,
  },
  {
    key: 'sdk',
    icon: <IconCode className="w-6 h-6" aria-hidden="true" />,
    ctaHref: '/developers',
    pending: true,
  },
  {
    key: 'api',
    icon: <IconSettings className="w-6 h-6" aria-hidden="true" />,
    ctaHref: '/developers#endpoints',
    pending: false,
  },
]

export function DevelopersSection() {
  const { t } = useTranslation()

  return (
    <section id="developers" className="py-24 bg-slate-900 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-indigo-400 text-sm font-semibold uppercase tracking-widest">
            {t('landing.developers.eyebrow')}
          </span>
          <h2 className="mt-3 text-4xl font-extrabold text-white">
            {t('landing.developers.title')}
          </h2>
          <p className="mt-4 text-slate-400 text-lg max-w-2xl mx-auto">
            {t('landing.developers.description')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {resources.map(({ key, icon, ctaHref, pending }) => (
            <div
              key={key}
              className="rounded-2xl bg-slate-800 border border-slate-700 p-8 flex flex-col"
            >
              <div className="w-12 h-12 bg-indigo-900/60 text-indigo-400 rounded-xl flex items-center justify-center mb-5">
                {icon}
              </div>
              <h3 className="text-white font-bold text-lg mb-3">{t(`landing.developers.resources.${key}.title`)}</h3>
              <p className="text-slate-400 text-sm leading-relaxed flex-1 mb-6">{t(`landing.developers.resources.${key}.description`)}</p>
              {pending ? (
                <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500">
                  <span>{t(`landing.developers.resources.${key}.cta`)}</span>
                  <span className="rounded-full bg-slate-700 px-2 py-0.5 text-xs font-medium text-slate-400">
                    {t('landing.developers.inProgress')}
                  </span>
                </div>
              ) : (
                <Link
                  to={ctaHref}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-400 transition-colors hover:text-indigo-300 focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                >
                  {t(`landing.developers.resources.${key}.cta`)}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
              )}
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-indigo-500/30 bg-indigo-950/40 px-8 py-10 flex flex-col sm:flex-row items-center gap-6 justify-between">
          <div>
            <h3 className="text-white font-bold text-xl mb-2">{t('landing.developers.banner.title')}</h3>
            <p className="text-slate-400 text-sm max-w-xl">
              {t('landing.developers.banner.description')}
            </p>
          </div>
          <Link
            to="/developers"
            className="shrink-0 rounded-xl border border-indigo-400/40 px-6 py-3 text-sm font-semibold text-indigo-300 transition-colors hover:border-indigo-300 hover:bg-indigo-400/10 focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
          >
            {t('landing.developers.banner.cta')}
          </Link>
        </div>
      </div>
    </section>
  )
}
