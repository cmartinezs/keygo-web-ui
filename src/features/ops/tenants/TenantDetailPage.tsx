import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { getTenant, suspendTenant, activateTenant, TENANT_QUERY_KEYS } from '@/features/ops/tenants/api'
import { toast } from 'sonner'
import { IconChevronLeft, IconArrowRight, IconXCircle, IconCheckCircle, IconAlertTriangle } from '@/shared/ui/icons'
import {
  NETWORK_MAX_RETRIES,
  NETWORK_REQUEST_TIMEOUT_MS,
  NETWORK_RETRY_DELAY_MS,
} from '@/shared/lib/config/network'
import {
  isRequestTimeout,
  notifyMutationTimeout,
  runGetWithRecovery,
} from '@/shared/lib/network/recovery'
import type { TenantStatus } from '@/shared/types/tenant'

// ── Status badge ──────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<TenantStatus, string> = {
  ACTIVE: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  SUSPENDED: 'bg-red-500/10 text-red-600 dark:text-red-400',
  PENDING: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
}
function StatusBadge({ status }: { status: TenantStatus }) {
  const { t } = useTranslation()
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${STATUS_STYLES[status]}`}>
      {t(`adminTenantDetail.status.${status}`)}
    </span>
  )
}

// ── Info row ──────────────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
        {label}
      </span>
      <span className="text-sm font-medium text-slate-800 dark:text-slate-100">{value}</span>
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div className="p-6 max-w-2xl animate-pulse space-y-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-48" />
          <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-24" />
        </div>
        <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-full w-20" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-1">
            <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded w-16" />
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TenantDetailPage() {
  const { t, i18n } = useTranslation()
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  async function fetchTenantWithRecovery(signal: AbortSignal) {
    if (!slug) throw new Error(t('adminTenantDetail.slugRequired'))

    return runGetWithRecovery({
      signal,
      label: 'tenant',
      timeoutMs: NETWORK_REQUEST_TIMEOUT_MS,
      retryDelayMs: NETWORK_RETRY_DELAY_MS,
      maxRetries: NETWORK_MAX_RETRIES,
      query: () =>
        getTenant(slug, {
          signal,
          timeoutMs: NETWORK_REQUEST_TIMEOUT_MS,
        }),
    })
  }

  const { data: tenant, isLoading, isError, error } = useQuery({
    queryKey: TENANT_QUERY_KEYS.detail(slug!),
    queryFn: ({ signal }) => fetchTenantWithRecovery(signal),
    enabled: !!slug,
    retry: false,
  })

  const suspendMutation = useMutation({
    mutationFn: () => suspendTenant(slug!, { timeoutMs: NETWORK_REQUEST_TIMEOUT_MS }),
    onSuccess: () => {
      toast.success(t('adminTenantDetail.suspendSuccess'))
      queryClient.invalidateQueries({ queryKey: TENANT_QUERY_KEYS.all })
      queryClient.invalidateQueries({ queryKey: TENANT_QUERY_KEYS.detail(slug!) })
    },
    onError: (err) => {
      if (isRequestTimeout(err)) {
        notifyMutationTimeout('suspension')
        return
      }
      toast.error(t('adminTenantDetail.suspendError'))
    },
  })

  const activateMutation = useMutation({
    mutationFn: () => activateTenant(slug!, { timeoutMs: NETWORK_REQUEST_TIMEOUT_MS }),
    onSuccess: () => {
      toast.success(t('adminTenantDetail.activateSuccess'))
      queryClient.invalidateQueries({ queryKey: TENANT_QUERY_KEYS.all })
      queryClient.invalidateQueries({ queryKey: TENANT_QUERY_KEYS.detail(slug!) })
    },
    onError: (err) => {
      if (isRequestTimeout(err)) {
        notifyMutationTimeout('activacion')
        return
      }
      toast.error(t('adminTenantDetail.activateError'))
    },
  })

  const handleSuspend = () => {
    if (confirm(t('adminTenantDetail.confirmSuspend', { name: tenant?.name ?? '' }))) {
      suspendMutation.mutate()
    }
  }

  if (isLoading) return <DetailSkeleton />

  if (isError) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[300px] gap-3 text-center">
        <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
          <IconAlertTriangle className="w-6 h-6 text-red-500" aria-hidden="true" />
        </div>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {error instanceof Error ? error.message : t('adminTenantDetail.loadError')}
        </p>
        <button
          onClick={() => navigate('/dashboard/tenants')}
          className="inline-flex items-center justify-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          <IconChevronLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
          {t('adminTenantDetail.backToList')}
        </button>
      </div>
    )
  }

  if (!tenant) return null

  const createdDate = new Date(tenant.created_at).toLocaleDateString(i18n.resolvedLanguage ?? i18n.language, {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  const isBusy = suspendMutation.isPending || activateMutation.isPending

  return (
    <div className="p-6 max-w-2xl space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">{tenant.name}</h2>
          <code className="text-xs text-slate-400 dark:text-slate-500 font-mono mt-0.5 block">
            /{tenant.slug}
          </code>
        </div>
        <StatusBadge status={tenant.status} />
      </div>

      {/* Info card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
        <InfoRow label={t('adminTenantDetail.id')} value={<code className="text-xs text-slate-500 dark:text-slate-400 font-mono break-all">{tenant.id}</code>} />
        <InfoRow label={t('adminTenantDetail.slug')} value={<code className="text-xs font-mono text-indigo-600 dark:text-indigo-400">{tenant.slug}</code>} />
        <InfoRow label={t('adminTenantDetail.ownerEmailLabel')} value={tenant.owner_email ?? '-'} />
        <InfoRow label={t('adminTenantDetail.createdOn')} value={createdDate} />
      </div>

      {/* Actions */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('adminTenantDetail.actions')}</h3>

        <div className="flex flex-wrap gap-3">
          {/* Jump to tenant admin */}
          <button
            onClick={() => navigate(`/tenant-admin?tenant=${tenant.slug}`)}
            className="flex items-center gap-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-sm font-medium px-4 py-2 rounded-lg transition-colors border border-slate-200 dark:border-white/10"
          >
            <IconArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
            {t('adminTenantDetail.viewAsTenantAdmin')}
          </button>

          {/* Suspend — only when ACTIVE */}
          {tenant.status === 'ACTIVE' && (
            <button
              onClick={handleSuspend}
              disabled={isBusy}
              className="flex items-center gap-2 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 text-sm font-medium px-4 py-2 rounded-lg transition-colors border border-red-200 dark:border-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {suspendMutation.isPending ? (
                <span className="w-4 h-4 border-2 border-red-400/30 border-t-red-500 rounded-full animate-spin shrink-0" aria-hidden="true" />
              ) : (
                <IconXCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
              )}
              {suspendMutation.isPending ? t('adminTenantDetail.suspending') : t('adminTenantDetail.suspend')}
            </button>
          )}

          {/* Activate — only when SUSPENDED */}
          {tenant.status === 'SUSPENDED' && (
            <button
              onClick={() => activateMutation.mutate()}
              disabled={isBusy}
              className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm font-medium px-4 py-2 rounded-lg transition-colors border border-emerald-200 dark:border-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {activateMutation.isPending ? (
                <span className="w-4 h-4 border-2 border-emerald-400/30 border-t-emerald-500 rounded-full animate-spin shrink-0" aria-hidden="true" />
              ) : (
                <IconCheckCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
              )}
              {activateMutation.isPending ? t('adminTenantDetail.activating') : t('adminTenantDetail.reactivate')}
            </button>
          )}
        </div>


      </div>
    </div>
  )
}
