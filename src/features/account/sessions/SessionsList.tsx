// ── SessionsList ───────────────────────────────────────────────────────────────
// Lista de sesiones activas con revocación remota por sesión individual.
// Patrón: este componente gestiona su propio useQuery/useMutation (bloque autónomo).

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { TENANT } from '@/shared/api/client'
import { ACCOUNT_QUERY_KEYS, getSessions, revokeSession } from '@/features/account/api'
import { useCurrentUser } from '@/shared/hooks/useCurrentUser'
import { NETWORK_MAX_RETRIES, NETWORK_REQUEST_TIMEOUT_MS, NETWORK_RETRY_DELAY_MS } from '@/shared/lib/config/network'
import { getAppApiError, getUserMessage } from '@/shared/api/errorNormalizer'
import { isRequestTimeout, notifyMutationTimeout, runGetWithRecovery } from '@/shared/lib/network/recovery'
import type { AccountSessionData } from '@/shared/types/user'
import {
  DangerActionButton,
  ErrorMessage,
  LoadingMessage,
  PanelCard,
} from '@/features/account/ui/AccountPanelPrimitives'

function formatDateSafe(iso: string | undefined, locale: string): string {
  if (!iso) return '-'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function buildSessionKey(session: AccountSessionData, index: number): string {
  const stableId = session.session_id?.trim()
  if (stableId) return stableId
  // Fallback defensivo para evitar warning/colisión de keys si backend retorna ids vacíos.
  return `session-${index}-${session.created_at ?? 'unknown'}`
}

function SessionCard({
  session,
  locale,
  onRevoke,
  isRevoking,
}: {
  session: AccountSessionData
  locale: string
  onRevoke: (id: string) => void
  isRevoking: boolean
}) {
  const { t } = useTranslation()

  return (
    <li
      aria-label={`${session.browser} — ${session.os}`}
      className={`rounded-xl border p-4 ${
        session.is_current
          ? 'border-indigo-300 bg-indigo-50 dark:border-indigo-500/40 dark:bg-indigo-500/10'
          : 'border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          {session.is_current && (
            <span className="inline-block rounded-full bg-indigo-100 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
              {t('accountSecurity.sessionsCurrent')}
            </span>
          )}
          <dl className="mt-1 grid grid-cols-1 gap-x-4 gap-y-1 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-slate-500 dark:text-slate-400">{t('accountSecurity.sessionBrowser')}</dt>
              <dd className="font-medium text-slate-900 dark:text-white truncate">{session.browser || '-'}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500 dark:text-slate-400">{t('accountSecurity.sessionOS')}</dt>
              <dd className="font-medium text-slate-900 dark:text-white truncate">{session.os || '-'}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500 dark:text-slate-400">{t('accountSecurity.sessionDevice')}</dt>
              <dd className="font-medium text-slate-900 dark:text-white truncate">{session.device_type || '-'}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500 dark:text-slate-400">{t('accountSecurity.sessionIP')}</dt>
              <dd className="font-medium text-slate-900 dark:text-white">{session.ip_address || '-'}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500 dark:text-slate-400">{t('accountSecurity.sessionCreated')}</dt>
              <dd className="font-medium text-slate-900 dark:text-white">{formatDateSafe(session.created_at, locale)}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500 dark:text-slate-400">{t('accountSecurity.sessionLastUsed')}</dt>
              <dd className="font-medium text-slate-900 dark:text-white">{formatDateSafe(session.last_accessed_at, locale)}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500 dark:text-slate-400">{t('accountSecurity.sessionExpires')}</dt>
              <dd className="font-medium text-slate-900 dark:text-white">{formatDateSafe(session.expires_at, locale)}</dd>
            </div>
          </dl>
        </div>

        {!session.is_current && (
          <DangerActionButton
            onClick={() => onRevoke(session.session_id)}
            disabled={isRevoking || !session.session_id}
            pending={isRevoking}
            label={t('accountSecurity.sessionRevoke')}
            pendingLabel={t('accountSecurity.sessionRevoking')}
          />
        )}
      </div>
    </li>
  )
}

export function SessionsList() {
  const { t, i18n } = useTranslation()
  const user = useCurrentUser()
  const tenantSlug = user?.tenantSlug ?? TENANT
  const queryClient = useQueryClient()

  const sessionQuery = useQuery({
    queryKey: ACCOUNT_QUERY_KEYS.sessions(tenantSlug),
    queryFn: ({ signal }) =>
      runGetWithRecovery({
        signal,
        label: 'sesiones activas',
        timeoutMs: NETWORK_REQUEST_TIMEOUT_MS,
        retryDelayMs: NETWORK_RETRY_DELAY_MS,
        maxRetries: NETWORK_MAX_RETRIES,
        query: () => getSessions(tenantSlug, { signal, timeoutMs: NETWORK_REQUEST_TIMEOUT_MS }),
      }),
    retry: false,
  })

  const revokeMutation = useMutation({
    mutationFn: (sessionId: string) =>
      revokeSession(tenantSlug, sessionId, { timeoutMs: NETWORK_REQUEST_TIMEOUT_MS }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ACCOUNT_QUERY_KEYS.sessions(tenantSlug) })
      if (result.already_closed) {
        toast.info(t('accountSecurity.sessionRevokeAlreadyClosed'))
      } else {
        toast.success(t('accountSecurity.sessionRevokeSuccess'))
      }
    },
    onError: (err) => {
      if (isRequestTimeout(err)) {
        notifyMutationTimeout('cierre de sesion remota')
        return
      }
      toast.error(getUserMessage(getAppApiError(err)))
    },
  })

  return (
    <PanelCard
      titleId="sessions-heading"
      title={t('accountSecurity.sessionsTitle')}
      subtitle={t('accountSecurity.sessionsDesc')}
    >

      <div className="mt-5">
        {sessionQuery.isLoading ? <LoadingMessage message={t('accountSecurity.sessionsLoading')} /> : null}

        {sessionQuery.isError ? <ErrorMessage message={t('accountSecurity.sessionsError')} /> : null}

        {!sessionQuery.isLoading && !sessionQuery.isError && sessionQuery.data && (
          <>
            {sessionQuery.data.length === 0 ? (
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {t('accountSecurity.sessionsEmpty')}
              </p>
            ) : (
              <ul
                aria-label={t('accountSecurity.sessionsTitle')}
                className="space-y-3"
              >
                {sessionQuery.data.map((session, index) => (
                  <SessionCard
                    key={buildSessionKey(session, index)}
                    session={session}
                    locale={i18n.language}
                    onRevoke={(id) => revokeMutation.mutate(id)}
                    isRevoking={
                      revokeMutation.isPending &&
                      revokeMutation.variables === session.session_id
                    }
                  />
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </PanelCard>
  )
}
