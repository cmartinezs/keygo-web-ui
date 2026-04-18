import { useState, useEffect, useRef } from 'react'
import { useNavigate, useOutlet, NavLink, useLocation } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { listTenants, TENANT_QUERY_KEYS } from '@/features/ops/tenants/api'
import { createAccessIncidentReport } from '@/shared/api/accessIncidents'
import { getAppApiError, getUserMessage, isForbiddenError } from '@/shared/api/errorNormalizer'
import { useCurrentUser } from '@/shared/hooks/useCurrentUser'
import { getTraceId } from '@/shared/lib/traceId'
import { useTokenStore } from '@/shared/lib/auth/tokenStore'
import { IconBuilding, IconSearch, IconPlus, IconChevronLeft, IconChevronRight } from '@/shared/ui/icons'
import { AccessDeniedState } from '@/shared/ui/AccessDeniedState'
import {
  NETWORK_MAX_RETRIES,
  NETWORK_REQUEST_TIMEOUT_MS,
  NETWORK_RETRY_DELAY_MS,
} from '@/shared/lib/config/network'
import { runGetWithRecovery } from '@/shared/lib/network/recovery'
import type { TenantData, TenantStatus, ListTenantsParams } from '@/shared/types/tenant'
import { toast } from 'sonner'

// ── Constants ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20

// ── Debounce hook ─────────────────────────────────────────────────────────────

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    timer.current = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer.current)
  }, [value, delay])

  return debounced
}

// ── Status badge ──────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<TenantStatus, string> = {
  ACTIVE: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  SUSPENDED: 'bg-red-500/10 text-red-600 dark:text-red-400',
  PENDING: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
}
function StatusBadge({ status }: { status: TenantStatus }) {
  const { t } = useTranslation()
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${STATUS_STYLES[status]}`}
    >
      {t(`adminTenants.status.${status}`)}
    </span>
  )
}

// ── Tenant list item ──────────────────────────────────────────────────────────

function TenantListItem({
  tenant,
  onSelect,
}: {
  tenant: TenantData
  onSelect?: (slug: string) => void
}) {
  const { i18n } = useTranslation()
  const date = new Date(tenant.created_at).toLocaleDateString(i18n.resolvedLanguage ?? i18n.language, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

  return (
    <NavLink
      to={tenant.slug}
      onClick={() => onSelect?.(tenant.slug)}
      className={({ isActive }) =>
        `flex flex-col gap-1 px-4 py-3 border-b border-slate-100 dark:border-white/5 transition-colors cursor-pointer ${
          isActive
            ? 'bg-indigo-50 dark:bg-indigo-500/10 border-l-2 border-l-indigo-500'
            : 'hover:bg-slate-50 dark:hover:bg-white/5 border-l-2 border-l-transparent'
        }`
      }
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-slate-800 dark:text-white truncate">
          {tenant.name}
        </span>
        <StatusBadge status={tenant.status} />
      </div>
      <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
        <code className="bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 rounded font-mono text-[10px]">
          {tenant.slug}
        </code>
        <span>·</span>
        <span>{date}</span>
      </div>
    </NavLink>
  )
}

// ── Skeleton loader ───────────────────────────────────────────────────────────

function ListSkeleton() {
  return (
    <div className="space-y-0">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="px-4 py-3 border-b border-slate-100 dark:border-white/5 animate-pulse">
          <div className="flex items-center justify-between mb-2">
            <div className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded w-32" />
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-full w-14" />
          </div>
          <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded w-28" />
        </div>
      ))}
    </div>
  )
}

// ── Empty state (right panel) ─────────────────────────────────────────────────

function TenantsEmptyState({
  canCreate,
  onNew,
}: {
  canCreate: boolean
  onNew?: () => void
}) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-4 p-10 text-center">
      <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
        <IconBuilding className="w-8 h-8 text-indigo-500" aria-hidden="true" />
      </div>
      <div>
        <h2 className="text-base font-semibold text-slate-800 dark:text-white">
          {t('adminTenants.emptyTitle')}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
          {t(canCreate ? 'adminTenants.emptyBody' : 'adminTenants.emptyAssociatedBody')}
        </p>
      </div>
      {canCreate && onNew && (
        <button
          onClick={onNew}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          <IconPlus className="w-4 h-4" aria-hidden="true" />
          {t('adminTenants.newTenant')}
        </button>
      )}
    </div>
  )
}

// ── Filter types ──────────────────────────────────────────────────────────────

type FilterStatus = 'ALL' | TenantStatus

const FILTER_TABS: FilterStatus[] = ['ALL', 'ACTIVE', 'SUSPENDED', 'PENDING']

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TenantsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const outlet = useOutlet()
  const location = useLocation()
  const currentUser = useCurrentUser()
  const activeRole = useTokenStore((s) => s.activeRole)
  const roles = useTokenStore((s) => s.roles)
  const managedTenantSlug = useTokenStore((s) => s.managedTenantSlug)
  const setManagedTenantSlug = useTokenStore((s) => s.setManagedTenantSlug)

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterStatus>('ALL')
  const [page, setPage] = useState(0)
  const [isReportOpen, setIsReportOpen] = useState(false)
  const [reportComment, setReportComment] = useState('')
  const [reportError, setReportError] = useState<string | null>(null)
  const isAccountAdmin = activeRole === 'keygo_account_admin'
  const canCreateTenants = activeRole === 'keygo_admin'

  // Debounce search so we don't fire a request on every keystroke
  const debouncedSearch = useDebounce(search, 350)

  // Reset to page 0 whenever filters change
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setPage(0))
    return () => window.cancelAnimationFrame(frame)
  }, [filter, debouncedSearch])

  const queryParams: ListTenantsParams = {
    ...(filter !== 'ALL' && { status: filter }),
    ...(debouncedSearch && { name_like: debouncedSearch }),
    ...(isAccountAdmin && currentUser?.email && { owner_email: currentUser.email }),
    page,
    size: PAGE_SIZE,
  }

  async function fetchTenantsWithRecovery(signal: AbortSignal) {
    return runGetWithRecovery({
      signal,
      label: isAccountAdmin ? 'tenants asociados' : 'tenants',
      timeoutMs: NETWORK_REQUEST_TIMEOUT_MS,
      retryDelayMs: NETWORK_RETRY_DELAY_MS,
      maxRetries: NETWORK_MAX_RETRIES,
      query: () =>
        listTenants(queryParams, {
          signal,
          timeoutMs: NETWORK_REQUEST_TIMEOUT_MS,
        }),
    })
  }

  const { data, isLoading, isError, isFetching, error } = useQuery({
    queryKey: TENANT_QUERY_KEYS.list(queryParams),
    queryFn: ({ signal }) => fetchTenantsWithRecovery(signal),
    placeholderData: (prev) => prev,
    retry: false,
    enabled: !isAccountAdmin || !!currentUser?.email,
  })

  const tenants = data?.content ?? []
  const totalPages = data?.total_pages ?? 0
  const totalElements = data?.total_elements ?? 0
  const queryError = isError ? getAppApiError(error) : null
  const missingAssociatedTenantContext = isAccountAdmin && !currentUser?.email

  const reportMutation = useMutation({
    mutationFn: async (comment: string) => {
      const fallbackMessage = t('adminTenants.accessContextMissingMessage')
      const appError = queryError
      return createAccessIncidentReport(
        {
          incident_type: 'ACCESS_DENIED',
          feature_key: 'dashboard_tenants',
          route_path: location.pathname,
          current_url: window.location.href,
          resource_path: '/api/v1/tenants',
          resource_label: isAccountAdmin ? 'tenants asociados' : 'tenants',
          user_comment: comment,
          http_status: appError?.httpStatus ?? 403,
          error_code: appError?.code ?? 'ACCESS_CONTEXT_UNAVAILABLE',
          client_message: appError?.clientMessage ?? fallbackMessage,
          error_origin: appError?.origin,
          trace_id: appError?.traceId,
          exception: appError?.exception,
          detail: appError?.detail,
          actor_sub: currentUser?.sub ?? 'unknown',
          actor_email: currentUser?.email,
          actor_username: currentUser?.username,
          active_role: activeRole,
          detected_roles: roles,
          tenant_claim: currentUser?.tenantSlug,
          managed_tenant_slug: managedTenantSlug,
          ui_trace_id: getTraceId(),
          resource_context: {
            search_query: debouncedSearch,
            filter_status: filter,
            page,
            managed_tenant_slug: managedTenantSlug,
          },
        },
        {
          timeoutMs: NETWORK_REQUEST_TIMEOUT_MS,
          idempotencyKey: `kg-access-incident-${getTraceId()}-${activeRole ?? 'unknown'}-${page}`,
        },
      )
    },
    onSuccess: () => {
      toast.success(t('adminTenants.reportSuccess'))
      setReportComment('')
      setReportError(null)
      setIsReportOpen(false)
    },
    onError: (mutationError) => {
      toast.error(getUserMessage(getAppApiError(mutationError)))
    },
  })

  function handleOpenReport() {
    setIsReportOpen((prev) => !prev)
    setReportError(null)
  }

  function handleSubmitReport() {
    const trimmed = reportComment.trim()
    if (trimmed.length === 0) {
      setReportError(t('adminTenants.reportCommentRequired'))
      return
    }

    setReportError(null)
    reportMutation.mutate(trimmed)
  }

  function renderReportForm() {
    return (
      <div className="mt-2 rounded-xl border border-amber-300 bg-white/70 p-4 text-left dark:border-amber-500/30 dark:bg-slate-950/30">
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={handleOpenReport}
            className="inline-flex items-center justify-center self-start rounded-lg border border-amber-400/50 px-3 py-2 text-sm font-medium text-amber-900 transition-colors hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 dark:text-amber-200 dark:hover:bg-amber-500/10"
          >
            {isReportOpen
              ? t('adminTenants.reportCancel')
              : t('adminTenants.reportAction')}
          </button>

          {isReportOpen ? (
            <>
              <div className="space-y-1">
                <label
                  htmlFor="tenant-access-report-comment"
                  className="block text-sm font-medium text-slate-800 dark:text-slate-100"
                >
                  {t('adminTenants.reportCommentLabel')}
                </label>
                <textarea
                  id="tenant-access-report-comment"
                  value={reportComment}
                  onChange={(event) => {
                    setReportComment(event.target.value)
                    if (reportError) setReportError(null)
                  }}
                  rows={4}
                  disabled={reportMutation.isPending}
                  aria-describedby={reportError ? 'tenant-access-report-comment-error' : undefined}
                  aria-invalid={reportError ? 'true' : 'false'}
                  placeholder={t('adminTenants.reportCommentPlaceholder')}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-white/10 dark:bg-slate-900 dark:text-white"
                />
                {reportError ? (
                  <p
                    id="tenant-access-report-comment-error"
                    role="alert"
                    className="text-xs text-red-600 dark:text-red-400"
                  >
                    {reportError}
                  </p>
                ) : null}
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300">
                {t('adminTenants.reportHelpText')}
              </p>

              <button
                type="button"
                onClick={handleSubmitReport}
                disabled={reportMutation.isPending}
                className="inline-flex items-center justify-center self-start rounded-lg bg-amber-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-2 disabled:opacity-60"
              >
                {reportMutation.isPending
                  ? t('adminTenants.reportSubmitting')
                  : t('adminTenants.reportSubmit')}
              </button>
            </>
          ) : null}
        </div>
      </div>
    )
  }

  if (missingAssociatedTenantContext) {
    return (
      <AccessDeniedState
        title={t('adminTenants.accessDeniedTitle')}
        message={t('adminTenants.accessContextMissingMessage')}
        description={t('adminTenants.accessDeniedBody')}
        actionLabel={t('adminTenants.accessDeniedAction')}
        onAction={() => navigate('/dashboard')}
      >
        {renderReportForm()}
      </AccessDeniedState>
    )
  }

  if (queryError && isForbiddenError(queryError)) {
    return (
      <AccessDeniedState
        title={t('adminTenants.accessDeniedTitle')}
        message={queryError.clientMessage}
        description={t('adminTenants.accessDeniedBody')}
        actionLabel={t('adminTenants.accessDeniedAction')}
        onAction={() => navigate('/dashboard')}
      >
        {renderReportForm()}
      </AccessDeniedState>
    )
  }

  return (
    <div className="flex -m-6 h-[calc(100vh-4rem)] overflow-hidden">

      {/* ── Left panel: list ── */}
      <aside className={[
        'flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-white/10 overflow-hidden shrink-0',
        outlet ? 'hidden min-[550px]:flex min-[550px]:w-80' : 'flex w-full min-[550px]:w-80',
      ].join(' ')}>

        {/* Panel header */}
        <div className="px-4 pt-4 pb-3 border-b border-slate-200 dark:border-white/10 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-base font-bold text-slate-900 dark:text-white">{t('adminTenants.title')}</h1>
            {canCreateTenants && (
              <button
                onClick={() => navigate('/dashboard/tenants/new')}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
              >
                <IconPlus />
                {t('adminTenants.new')}
              </button>
            )}
          </div>

          {/* Search — delegates filtering to backend via name_like */}
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2">
            <IconSearch />
            <input
              type="search"
              placeholder={t('adminTenants.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 outline-none min-w-0"
              aria-label={t('adminTenants.searchAria')}
            />
            {isFetching && (
              <svg className="w-3.5 h-3.5 animate-spin text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
          </div>
        </div>

        {/* Filter tabs — passes status to API */}
        <div className="flex border-b border-slate-200 dark:border-white/10 shrink-0 overflow-x-auto">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
                filter === tab
                  ? 'text-indigo-600 dark:text-indigo-400 border-indigo-500'
                  : 'text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              {t(`adminTenants.filters.${tab}`)}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading && <ListSkeleton />}

          {isError && (
            <div className="px-4 py-6 text-center text-sm text-red-500 dark:text-red-400">
              {t('adminTenants.errorLoad')}
            </div>
          )}

          {!isLoading && !isError && tenants.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-slate-400 dark:text-slate-500">
              {debouncedSearch
                ? t('adminTenants.noSearchResults')
                : t('adminTenants.noCategory')}
            </div>
          )}

          {!isLoading && !isError && tenants.map((tenant) => (
            <TenantListItem
              key={tenant.slug}
              tenant={tenant}
              onSelect={(slug) => setManagedTenantSlug(slug)}
            />
          ))}
        </div>

        {/* Pagination footer */}
        {totalPages > 1 && (
          <div className="shrink-0 border-t border-slate-200 dark:border-white/10 px-3 py-2 flex items-center justify-between gap-2">
            <span className="text-[10px] text-slate-400 dark:text-slate-500">
              {t('adminTenants.pagination', {
                total: totalElements,
                page: page + 1,
                totalPages,
              })}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="w-6 h-6 flex items-center justify-center rounded text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label={t('adminTenants.pagePrevious')}
              >
                <IconChevronLeft />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="w-6 h-6 flex items-center justify-center rounded text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label={t('adminTenants.pageNext')}
              >
                <IconChevronRight />
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* ── Right panel: outlet ── */}
      <div className={[
        'overflow-y-auto bg-slate-50 dark:bg-slate-950',
        outlet ? 'flex flex-col flex-1' : 'hidden min-[550px]:block min-[550px]:flex-1',
      ].join(' ')}>
        {/* Mobile back button — only visible when a detail/create is open */}
        {outlet && (
          <div className="min-[550px]:hidden flex items-center gap-2 px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-white/10 shrink-0">
            <button
              onClick={() => navigate('/dashboard/tenants')}
              className="flex items-center gap-1 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
            >
              <IconChevronLeft />
              {t('adminTenants.mobileBack')}
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto">
          {outlet ?? (
            <TenantsEmptyState
              canCreate={canCreateTenants}
              onNew={canCreateTenants ? () => navigate('/dashboard/tenants/new') : undefined}
            />
          )}
        </div>
      </div>
    </div>
  )
}
