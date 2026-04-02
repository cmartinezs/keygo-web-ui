import { decodeJwt } from 'jose'
import { useQuery } from '@tanstack/react-query'
import { listMembershipsByUser, MEMBERSHIP_QUERY_KEYS } from '@/api/memberships'
import { listClientApps, CLIENT_APP_QUERY_KEYS } from '@/api/clientApps'
import { TENANT } from '@/api/client'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useTokenStore } from '@/auth/tokenStore'
import {
  NETWORK_MAX_RETRIES,
  NETWORK_REQUEST_TIMEOUT_MS,
  NETWORK_RETRY_DELAY_MS,
} from '@/config/network'
import { runGetWithRecovery } from '@/lib/network/recovery'

export default function UserActivityPage() {
  const currentUser = useCurrentUser()
  const { idToken } = useTokenStore()
  const tenantSlug = currentUser?.tenantSlug ?? TENANT
  const userId = currentUser?.sub ?? ''

  const membershipsQuery = useQuery({
    queryKey: MEMBERSHIP_QUERY_KEYS.byUser(tenantSlug, userId),
    queryFn: ({ signal }) =>
      runGetWithRecovery({
        signal,
        label: 'actividad de memberships',
        timeoutMs: NETWORK_REQUEST_TIMEOUT_MS,
        retryDelayMs: NETWORK_RETRY_DELAY_MS,
        maxRetries: NETWORK_MAX_RETRIES,
        query: () =>
        listMembershipsByUser(tenantSlug, userId, {
          signal,
          timeoutMs: NETWORK_REQUEST_TIMEOUT_MS,
        }),
      }),
    enabled: userId.length > 0,
    retry: false,
  })

  const appsQuery = useQuery({
    queryKey: CLIENT_APP_QUERY_KEYS.all(tenantSlug),
    queryFn: ({ signal }) =>
      runGetWithRecovery({
        signal,
        label: 'catalogo de aplicaciones',
        timeoutMs: NETWORK_REQUEST_TIMEOUT_MS,
        retryDelayMs: NETWORK_RETRY_DELAY_MS,
        maxRetries: NETWORK_MAX_RETRIES,
        query: () =>
        listClientApps(tenantSlug, {
          signal,
          timeoutMs: NETWORK_REQUEST_TIMEOUT_MS,
        }),
      }),
    retry: false,
  })

  const appNameById = new Map((appsQuery.data ?? []).map((app) => [app.id, app.name]))

  let lastLoginText = 'No disponible'
  if (idToken) {
    try {
      const claims = decodeJwt(idToken)
      const iat = typeof claims.iat === 'number' ? claims.iat : null
      lastLoginText = iat ? new Date(iat * 1000).toLocaleString('es-CL') : 'No disponible'
    } catch {
      lastLoginText = 'No disponible'
    }
  }

  const timeline = [...(membershipsQuery.data ?? [])]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .map((item) => ({
      id: item.id,
      title: `Acceso asignado a ${appNameById.get(item.client_app_id) ?? item.client_app_id}`,
      date: new Date(item.created_at).toLocaleString('es-CL'),
      detail: item.role_ids.length > 0 ? `Roles: ${item.role_ids.join(', ')}` : 'Sin roles asignados',
    }))

  return (
    <div className="mx-auto max-w-screen-xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Actividad</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Historial reciente de eventos de acceso vinculados a tu cuenta.
        </p>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900">
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Ultimo inicio de sesion</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{lastLoginText}</p>
      </section>

      {membershipsQuery.isLoading || appsQuery.isLoading ? (
        <div
          role="status"
          aria-live="polite"
          className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500 dark:border-white/10 dark:bg-slate-900 dark:text-slate-400"
        >
          Cargando actividad...
        </div>
      ) : null}

      {membershipsQuery.isError || appsQuery.isError ? (
        <div
          role="alert"
          className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
        >
          {membershipsQuery.error instanceof Error
            ? membershipsQuery.error.message
            : appsQuery.error instanceof Error
              ? appsQuery.error.message
              : 'No fue posible cargar tu actividad.'}
        </div>
      ) : null}

      {!membershipsQuery.isLoading && !membershipsQuery.isError ? (
        <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Linea de tiempo</h2>
          <ul className="mt-3 space-y-3" aria-label="Eventos recientes">
            {timeline.map((entry) => (
              <li key={entry.id} className="rounded-lg border border-slate-200 px-4 py-3 dark:border-white/10">
                <p className="text-sm font-medium text-slate-900 dark:text-white">{entry.title}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{entry.date}</p>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{entry.detail}</p>
              </li>
            ))}
          </ul>

          {timeline.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Aun no hay eventos para mostrar.</p>
          ) : null}
        </section>
      ) : null}
    </div>
  )
}
