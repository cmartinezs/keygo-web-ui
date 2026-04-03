import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { SessionsList } from './SessionsList'

export default function AccountSessionsPage() {
  const { t } = useTranslation()

  return (
    <div className="mx-auto max-w-screen-xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('accountSecurity.sessionsTitle')}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">{t('accountSecurity.sessionsDesc')}</p>
      </header>

      <div className="flex flex-wrap gap-3">
        <Link
          to="/dashboard/account/settings?tab=security"
          className="inline-flex items-center rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-white/20 dark:text-slate-200 dark:hover:bg-white/10"
        >
          {t('accountSettings.security')}
        </Link>
      </div>

      <SessionsList />
    </div>
  )
}
