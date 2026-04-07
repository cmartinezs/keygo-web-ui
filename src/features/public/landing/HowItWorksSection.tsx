import { useTranslation } from 'react-i18next'

const steps = [
  {
    number: '01',
    key: 'step1',
  },
  {
    number: '02',
    key: 'step2',
  },
  {
    number: '03',
    key: 'step3',
  },
]

export function HowItWorksSection() {
  const { t } = useTranslation()

  return (
    <section id="how-it-works" className="py-24 bg-slate-50 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-indigo-600 text-sm font-semibold uppercase tracking-widest">
            {t('landing.howItWorks.eyebrow')}
          </span>
          <h2 className="mt-3 text-4xl font-extrabold text-slate-900">
            {t('landing.howItWorks.title')}
          </h2>
          <p className="mt-4 text-slate-500 text-lg max-w-2xl mx-auto">
            {t('landing.howItWorks.description')}
          </p>
        </div>

        <div className="relative">
          {/* Línea conectora — solo desktop */}
          <div
            className="hidden lg:block absolute top-12 left-1/2 -translate-x-1/2 w-2/3 h-0.5 bg-gradient-to-r from-indigo-200 via-indigo-400 to-indigo-200"
            aria-hidden="true"
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 relative">
            {steps.map(({ number, key }) => (
              <div key={number} className="flex flex-col items-center text-center">
                {/* Número */}
                <div className="w-24 h-24 rounded-full bg-indigo-600 flex items-center justify-center mb-6 shadow-lg shadow-indigo-600/30 relative z-10">
                  <span className="text-white font-extrabold text-2xl">{number}</span>
                </div>

                <h3 className="text-slate-900 font-bold text-xl mb-3">{t(`landing.howItWorks.steps.${key}.title`)}</h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-4">{t(`landing.howItWorks.steps.${key}.description`)}</p>

                <div className="bg-indigo-50 border border-indigo-100 rounded-lg px-4 py-2">
                  <p className="text-indigo-700 text-xs font-medium">{t(`landing.howItWorks.steps.${key}.detail`)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
