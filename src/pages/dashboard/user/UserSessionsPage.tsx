import { decodeJwt } from 'jose'
import { useTranslation } from 'react-i18next'
import { useTokenStore } from '@/auth/tokenStore'
import { useCurrentUser } from '@/hooks/useCurrentUser'

interface SessionTokenInfo {
  issuedAt: string
  expiresAt: string
  ttlMinutes: number
}

function getTokenInfo(token: string | null, locale: string): SessionTokenInfo | null {
  if (!token) return null

  try {
    const claims = decodeJwt(token)
    const iat = typeof claims.iat === 'number' ? claims.iat : null
    const exp = typeof claims.exp === 'number' ? claims.exp : null
    if (!iat || !exp) return null

    const issuedAt = new Date(iat * 1000)
    const expiresAt = new Date(exp * 1000)
    const ttlMinutes = Math.max(0, Math.round((exp * 1000 - Date.now()) / 60000))

    return {
      issuedAt: issuedAt.toLocaleString(locale),
      expiresAt: expiresAt.toLocaleString(locale),
      ttlMinutes,
    }
  } catch {
    return null
  }
}

export default function UserSessionsPage() {
  const { t, i18n } = useTranslation()
  const currentUser = useCurrentUser()
  const { accessToken, idToken, refreshToken } = useTokenStore()
  const locale = i18n.resolvedLanguage ?? i18n.language

  const accessInfo = getTokenInfo(accessToken, locale)
  const idInfo = getTokenInfo(idToken, locale)

  return (
    <div className="mx-auto max-w-screen-xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('userDashboardSessions.title')}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {t('userDashboardSessions.subtitle', { userName: currentUser?.displayName ?? t('userDashboardSessions.defaultUser') })}
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <article className="rounded-xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{t('userDashboardSessions.accessToken')}</h2>
          {accessInfo ? (
            <dl className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <div>
                <dt className="font-medium text-slate-700 dark:text-slate-200">{t('userDashboardSessions.issuedAt')}</dt>
                <dd>{accessInfo.issuedAt}</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-700 dark:text-slate-200">{t('userDashboardSessions.expiresAt')}</dt>
                <dd>{accessInfo.expiresAt}</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-700 dark:text-slate-200">{t('userDashboardSessions.ttl')}</dt>
                <dd>{t('userDashboardSessions.ttlValue', { minutes: accessInfo.ttlMinutes })}</dd>
              </div>
            </dl>
          ) : (
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{t('userDashboardSessions.notAvailable')}</p>
          )}
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{t('userDashboardSessions.idToken')}</h2>
          {idInfo ? (
            <dl className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <div>
                <dt className="font-medium text-slate-700 dark:text-slate-200">{t('userDashboardSessions.issuedAt')}</dt>
                <dd>{idInfo.issuedAt}</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-700 dark:text-slate-200">{t('userDashboardSessions.expiresAt')}</dt>
                <dd>{idInfo.expiresAt}</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-700 dark:text-slate-200">{t('userDashboardSessions.ttl')}</dt>
                <dd>{t('userDashboardSessions.ttlValue', { minutes: idInfo.ttlMinutes })}</dd>
              </div>
            </dl>
          ) : (
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{t('userDashboardSessions.notAvailable')}</p>
          )}
        </article>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900">
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{t('userDashboardSessions.persistenceTitle')}</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          {t('userDashboardSessions.persistenceBody', {
            availability: refreshToken
              ? t('userDashboardSessions.available')
              : t('userDashboardSessions.notAvailable'),
          })}
        </p>
      </section>
    </div>
  )
}
