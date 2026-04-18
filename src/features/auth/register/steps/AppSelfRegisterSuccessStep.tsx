import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, CheckCircle } from 'lucide-react'

interface AppSelfRegisterSuccessStepProps {
  tenantName: string
  appName: string
  email: string
}

export function AppSelfRegisterSuccessStep({ tenantName, appName, email }: AppSelfRegisterSuccessStepProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 items-center text-center">
        <CheckCircle className="w-16 h-16 text-emerald-500" aria-hidden="true" />
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{t('appSelfRegister.steps.success.title')}</h2>
          <p className="mt-2 text-slate-500 text-base">
            {t('appSelfRegister.steps.success.description', { appName, tenantName })}
          </p>
        </div>
      </div>

      <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 space-y-4">
        <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
          {t('appSelfRegister.layout.summaryTitle')}
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
            <span className="text-sm font-medium text-slate-600">
              {t('appSelfRegister.layout.summaryTenant')}
            </span>
            <span className="text-sm text-slate-900 font-semibold">{tenantName}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
            <span className="text-sm font-medium text-slate-600">
              {t('appSelfRegister.layout.summaryApp')}
            </span>
            <span className="text-sm text-slate-900 font-semibold">{appName}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
            <span className="text-sm font-medium text-slate-600">
              {t('appSelfRegister.layout.summaryEmail')}
            </span>
            <span className="text-sm text-slate-900 font-semibold">{email}</span>
          </div>
        </div>
      </div>

      <div className="flex justify-center pt-4">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-8 py-3 rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
        >
          {t('appSelfRegister.actions.goToLogin')}
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  )
}
