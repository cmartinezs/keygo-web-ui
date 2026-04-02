import { useQuery } from '@tanstack/react-query'
import { listMembershipsByUser, MEMBERSHIP_QUERY_KEYS } from '@/api/memberships'
import { listClientApps, CLIENT_APP_QUERY_KEYS } from '@/api/clientApps'
import { TENANT } from '@/api/client'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import {
  NETWORK_MAX_RETRIES,
  NETWORK_REQUEST_TIMEOUT_MS,
  NETWORK_RETRY_DELAY_MS,
} from '@/config/network'
import { runGetWithRecovery } from '@/lib/network/recovery'

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Activo',
  SUSPENDED: 'Suspendido',
  PENDING: 'Pendiente',
}

export default function UserMyAccessPage() {
  const currentUser = useCurrentUser()
  const tenantSlug = currentUser?.tenantSlug ?? TENANT
  const userId = currentUser?.sub ?? ''

  const membershipsQuery = useQuery({
    queryKey: MEMBERSHIP_QUERY_KEYS.byUser(tenantSlug, userId),
    queryFn: ({ signal }) =>
      runGetWithRecovery({
        signal,
        label: 'tus accesos',
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
        label: 'aplicaciones',
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
  const activeCount = (membershipsQuery.data ?? []).filter((item) => item.status === 'ACTIVE').length

  return (
    <div className="mx-auto max-w-screen-xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Mi acceso</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Aplicaciones y roles asignados a tu cuenta en el tenant {tenantSlug}.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <article className="rounded-xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Asignaciones</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{membershipsQuery.data?.length ?? 0}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Accesos activos</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{activeCount}</p>
        </article>
      </section>

      {membershipsQuery.isLoading || appsQuery.isLoading ? (
        <div
          role="status"
          aria-live="polite"
          className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500 dark:border-white/10 dark:bg-slate-900 dark:text-slate-400"
        >
          Cargando tus accesos...
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
              : 'No fue posible cargar tus accesos.'}
        </div>
      ) : null}

      {!membershipsQuery.isLoading && !membershipsQuery.isError ? (
        <section className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900">
          <table className="w-full min-w-[760px] text-sm">
            <caption className="sr-only">Listado de accesos por aplicacion</caption>
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500 dark:border-white/10 dark:text-slate-400">
                <th className="px-4 py-3 font-semibold">Aplicacion</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 font-semibold">Roles</th>
                <th className="px-4 py-3 font-semibold">Asignada</th>
              </tr>
            </thead>
            <tbody>
              {(membershipsQuery.data ?? []).map((membership) => (
                <tr key={membership.id} className="border-b border-slate-100 dark:border-white/5">
                  <td className="px-4 py-3 text-slate-800 dark:text-slate-100">
                    {appNameById.get(membership.client_app_id) ?? membership.client_app_id}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {STATUS_LABEL[membership.status] ?? membership.status}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {membership.role_ids.length > 0 ? membership.role_ids.join(', ') : '-'}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {new Date(membership.created_at).toLocaleString('es-CL')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {(membershipsQuery.data?.length ?? 0) === 0 ? (
            <p className="px-4 py-6 text-sm text-slate-500 dark:text-slate-400">
              No tienes accesos asignados en este tenant.
            </p>
          ) : null}
        </section>
      ) : null}
    </div>
  )
}
