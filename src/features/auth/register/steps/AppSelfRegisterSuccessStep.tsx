import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, CheckCircle } from 'lucide-react'

interface AppSelfRegisterSuccessStepProps {
  tenantName: string
  appName: string
}

export function AppSelfRegisterSuccessStep({ tenantName, appName }: AppSelfRegisterSuccessStepProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-6 items-center text-center">
      <div className="flex flex-col gap-4 items-center">
        <CheckCircle className="w-16 h-16 text-emerald-500" aria-hidden="true" />
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{t('appSelfRegister.steps.success.title')}</h2>
          <p className="mt-2 text-slate-500 text-base">
            {t('appSelfRegister.steps.success.description', { appName, tenantName })}
          </p>
        </div>
      </div>

      <div className="w-full pt-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-8 py-3 rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
        >
          {t('appSelfRegister.actions.goToLogin')}
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  )
}
