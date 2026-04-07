import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { IconArrowRight } from '@/shared/ui/icons/definitions'

interface SuccessStepProps {
  email: string
  planName: string
}

export function SuccessStep({ email, planName }: SuccessStepProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col items-center gap-6 py-8 text-center">
      {/* Icon */}
      <div className="relative">
        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center" aria-hidden="true">
          <svg className="w-10 h-10 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>

      <div>
        <h2 className="text-3xl font-extrabold text-slate-900">{t('subscribe.steps.success.title')}</h2>
        <p className="mt-2 text-slate-500 max-w-sm mx-auto">
          {t('subscribe.steps.success.descriptionPrefix')}{' '}
          <span className="font-semibold text-indigo-700">{planName}</span>{' '}
          {t('subscribe.steps.success.descriptionSuffix')}
        </p>
      </div>

      <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-5 max-w-sm w-full text-left space-y-2.5">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-0.5">{t('subscribe.steps.success.accessEmailLabel')}</p>
          <p className="font-semibold text-slate-800">{email}</p>
        </div>
        <p className="text-sm text-slate-600 pt-1">
          {t('subscribe.steps.success.helpText')}
        </p>
      </div>

      <Link
        to="/login"
        className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-8 py-3 rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
      >
        <IconArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
        {t('subscribe.steps.success.goToLogin')}
      </Link>

      <Link
        to="/"
        className="text-sm text-slate-400 hover:text-indigo-600 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
      >
        {t('subscribe.steps.success.backToHome')}
      </Link>
    </div>
  )
}
