import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AppFooter } from '@/components/AppFooter'

export function CTASection() {
  const { t } = useTranslation()

  return (
    <footer className="bg-slate-900">
      {/* CTA principal */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div
            className="relative rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-700 px-8 py-16 overflow-hidden"
          >
            {/* Decoración */}
            <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" aria-hidden="true" />
            <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" aria-hidden="true" />

            <div className="relative">
              <h2 className="text-4xl font-extrabold text-white mb-4">
                {t('landing.cta.title')}
              </h2>
              <p className="text-indigo-100 text-lg mb-8 max-w-xl mx-auto">
                {t('landing.cta.description')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/login"
                  className="inline-block bg-white text-indigo-700 font-bold px-10 py-4 rounded-xl hover:bg-indigo-50 transition-colors text-lg focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-600"
                >
                  {t('landing.cta.login')}
                </Link>
                <Link
                  to="/subscribe"
                  className="inline-block border-2 border-white/60 hover:border-white text-white font-semibold px-8 py-4 rounded-xl transition-colors text-lg focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-600"
                >
                  {t('landing.cta.subscribe')}
                </Link>
                <Link
                  to="/register"
                  className="inline-block border-2 border-white/60 hover:border-white text-white font-semibold px-8 py-4 rounded-xl transition-colors text-lg focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-600"
                >
                  {t('landing.cta.joinTeam')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <AppFooter variant="dark" />
    </footer>
  )
}
