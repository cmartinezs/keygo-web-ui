import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  getPendingFeatureSnapshot,
  PENDING_FEATURE_QUERY_KEYS,
  runPendingFeatureAction,
} from '@/shared/api/pendingFeatures'
import { PendingFeatureBadge } from '@/shared/ui/PendingFeatureBadge'
import { IconAlertTriangle, IconInfo } from '@/shared/ui/icons'
import { getAppApiError, getUserMessage } from '@/shared/api/errorNormalizer'
import {
  NETWORK_REQUEST_TIMEOUT_MS,
  NETWORK_RETRY_DELAY_MS,
  NETWORK_MAX_RETRIES,
} from '@/shared/lib/config/network'
import { runGetWithRecovery } from '@/shared/lib/network/recovery'
import { getFeatureStatus } from '@/shared/lib/featureStatus'

const TITLE_BY_FEATURE: Record<string, string> = {
  apps: 'Aplicaciones',
  users: 'Usuarios',
  access: 'Accesos',
  audit: 'Registro',
  'signing-keys': 'Claves de firma',
  sessions: 'Sesiones',
  tokens: 'Tokens',
  api: 'API',
  settings: 'Configuracion',
  profile: 'Mi cuenta',
  members: 'Miembros del tenant',
  services: 'Servicios del tenant',
  'my-access': 'Mi acceso',
  activity: 'Actividad',
}

export default function FeaturePlaceholderPage() {
  const queryClient = useQueryClient()
  const { featureId } = useParams<{ featureId: string }>()
  const title = featureId ? TITLE_BY_FEATURE[featureId] ?? 'Modulo' : 'Modulo'
  const featureStatus = featureId ? getFeatureStatus(featureId) : undefined

  const { data, isLoading, isError, error } = useQuery({
    queryKey: PENDING_FEATURE_QUERY_KEYS.detail(featureId ?? 'unknown'),
    queryFn: ({ signal }) =>
      runGetWithRecovery({
        signal,
        label: 'modulo pendiente',
        timeoutMs: NETWORK_REQUEST_TIMEOUT_MS,
        retryDelayMs: NETWORK_RETRY_DELAY_MS,
        maxRetries: NETWORK_MAX_RETRIES,
        query: () =>
          getPendingFeatureSnapshot(featureId ?? 'unknown', {
            signal,
            timeoutMs: NETWORK_REQUEST_TIMEOUT_MS,
          }),
      }),
    enabled: Boolean(featureId),
    retry: false,
  })

  const actionMutation = useMutation({
    mutationFn: (action: { id: string; itemId?: string }) =>
      runPendingFeatureAction(featureId ?? 'unknown', action.id, action.itemId, {
        timeoutMs: NETWORK_REQUEST_TIMEOUT_MS,
        idempotencyKey: `kg-pending-feature-${featureId}-${action.id}`,
      }),
    onSuccess: (result) => {
      toast.success(result.message)
      queryClient.invalidateQueries({
        queryKey: PENDING_FEATURE_QUERY_KEYS.detail(featureId ?? 'unknown'),
      })
    },
    onError: (mutationError) => {
      toast.error(getUserMessage(getAppApiError(mutationError)))
    },
  })

  const columns = useMemo(() => data?.columns ?? [], [data])
  const rows = useMemo(() => data?.rows ?? [], [data])

  return (
    <div className="max-w-screen-xl mx-auto space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h1>
        {featureStatus ? <PendingFeatureBadge featureStatus={featureStatus} /> : null}
      </div>

      {isLoading ? (
        <div
          role="status"
          aria-live="polite"
          className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500 dark:border-white/10 dark:bg-slate-900 dark:text-slate-400"
        >
          Cargando modulo...
        </div>
      ) : null}

      {isError ? (
        <div
          role="alert"
          className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
        >
          <div className="flex items-start gap-2">
            <IconAlertTriangle />
            <span>
              {error instanceof Error
                ? error.message
                : 'No se pudo cargar el modulo. Reintenta en unos segundos.'}
            </span>
          </div>
        </div>
      ) : null}

      {!isLoading && !isError && data ? (
        <section className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900">
            <div className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
              <span className="mt-0.5 text-slate-500 dark:text-slate-400" aria-hidden="true">
                <IconInfo />
              </span>
              <p>{data.summary}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {data.kpis.map((kpi) => (
              <article
                key={kpi.key}
                className="rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900"
              >
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {kpi.label}
                </p>
                <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{kpi.value}</p>
              </article>
            ))}
          </div>

          {data.actions && data.actions.length > 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900">
              <p className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-100">Acciones</p>
              <div className="flex flex-wrap gap-2">
                {data.actions.map((action) => (
                  <button
                    key={action.id}
                    type="button"
                    disabled={actionMutation.isPending}
                    onClick={() => actionMutation.mutate({ id: action.id })}
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 ${
                      action.tone === 'danger'
                        ? 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500 disabled:bg-red-400'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700 focus-visible:ring-indigo-500 disabled:bg-indigo-400'
                    }`}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900">
            <table className="w-full min-w-[760px] text-sm">
              <caption className="sr-only">Datos mock del modulo {data.title}</caption>
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500 dark:border-white/10 dark:text-slate-400">
                  {columns.map((column) => (
                    <th key={column} className="px-4 py-3 font-semibold uppercase">
                      {column.replaceAll('_', ' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rowIndex) => (
                  <tr key={`row-${rowIndex}`} className="border-b border-slate-100 dark:border-white/5">
                    {columns.map((column) => (
                      <td key={`${column}-${rowIndex}`} className="px-4 py-3 text-slate-700 dark:text-slate-300">
                        {row[column] ?? '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  )
}
