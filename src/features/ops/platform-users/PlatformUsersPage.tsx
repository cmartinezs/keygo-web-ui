import { useState, useEffect, useRef } from 'react'
import { useNavigate, useOutlet, NavLink } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { listPlatformUsers, PLATFORM_USER_QUERY_KEYS } from '@/features/ops/platform-users/api'
import { IconUsers, IconSearch, IconPlus, IconChevronLeft, IconChevronRight } from '@/shared/ui/icons'
import {
  NETWORK_MAX_RETRIES,
  NETWORK_REQUEST_TIMEOUT_MS,
  NETWORK_RETRY_DELAY_MS,
} from '@/shared/lib/config/network'
import { runGetWithRecovery } from '@/shared/lib/network/recovery'
import type { PlatformUserData, PlatformUserStatus, ListPlatformUsersParams } from '@/shared/types/platform'

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

const STATUS_STYLES: Record<PlatformUserStatus, string> = {
  ACTIVE: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  SUSPENDED: 'bg-red-500/10 text-red-600 dark:text-red-400',
  PENDING: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
}

function StatusBadge({ status }: { status: PlatformUserStatus }) {
  const { t } = useTranslation()
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${STATUS_STYLES[status]}`}
    >
      {t(`platformUsers.status.${status}`)}
    </span>
  )
}

// ── List item ─────────────────────────────────────────────────────────────────

function UserListItem({ user }: { user: PlatformUserData }) {
  return (
    <NavLink
      to={user.id}
      className={({ isActive }) =>
        `block px-4 py-3 border-b border-slate-100 dark:border-white/5 transition-colors ${
          isActive
            ? 'bg-indigo-50 dark:bg-indigo-950/30 border-l-2 border-l-indigo-500'
            : 'hover:bg-slate-50 dark:hover:bg-white/[0.02]'
        }`
      }
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
          {user.first_name} {user.last_name}
        </span>
        <StatusBadge status={user.status} />
      </div>
      <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{user.email}</p>
    </NavLink>
  )
}

// ── List skeleton ─────────────────────────────────────────────────────────────

function ListSkeleton() {
  return (
    <div className="space-y-0" role="status" aria-label="Cargando usuarios">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="px-4 py-3 border-b border-slate-100 dark:border-white/5 animate-pulse">
          <div className="flex items-center justify-between mb-2">
            <div className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded w-32" />
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-full w-14" />
          </div>
          <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded w-40" />
        </div>
      ))}
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  const { t } = useTranslation()
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center max-w-sm space-y-3">
        <IconUsers className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600" aria-hidden="true" />
        <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300">
          {t('platformUsers.emptyTitle')}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {t('platformUsers.emptyBody')}
        </p>
      </div>
    </div>
  )
}

// ── Filter tabs ───────────────────────────────────────────────────────────────

type FilterValue = 'ALL' | PlatformUserStatus
const FILTERS: FilterValue[] = ['ALL', 'ACTIVE', 'SUSPENDED', 'PENDING']

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PlatformUsersPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const outlet = useOutlet()

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterValue>('ALL')
  const [page, setPage] = useState(0)
  const debouncedSearch = useDebounce(search, 350)

  useEffect(() => { setPage(0) }, [debouncedSearch, filter])

  const queryParams: ListPlatformUsersParams = {
    ...(filter !== 'ALL' && { status: filter }),
    ...(debouncedSearch && { email_like: debouncedSearch }),
    page,
    size: PAGE_SIZE,
  }

  const timeoutMs = NETWORK_REQUEST_TIMEOUT_MS

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: PLATFORM_USER_QUERY_KEYS.list(queryParams),
    queryFn: ({ signal }) =>
      runGetWithRecovery({
        signal,
        label: 'usuarios de plataforma',
        timeoutMs,
        retryDelayMs: NETWORK_RETRY_DELAY_MS,
        maxRetries: NETWORK_MAX_RETRIES,
        query: () => listPlatformUsers(queryParams, { signal, timeoutMs }),
      }),
    retry: false,
    placeholderData: (prev) => prev,
  })

  const users = data?.content ?? []
  const totalPages = data?.total_pages ?? 1
  const totalElements = data?.total_elements ?? 0

  return (
    <div className="flex -m-6 h-[calc(100vh-4rem)]">
      {/* ── Left panel: list ─────────────────────────────────────────────── */}
      <aside
        className={`w-80 shrink-0 border-r border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 flex flex-col overflow-hidden ${
          outlet ? 'hidden min-[550px]:flex' : 'flex'
        }`}
      >
        {/* Header */}
        <div className="px-4 pt-5 pb-3 space-y-3 border-b border-slate-100 dark:border-white/5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              {t('platformUsers.title')}
            </h2>
            <button
              onClick={() => navigate('new')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
              aria-label={t('platformUsers.newUser')}
            >
              <IconPlus className="w-3.5 h-3.5" aria-hidden="true" />
              {t('platformUsers.new')}
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('platformUsers.searchPlaceholder')}
              aria-label={t('platformUsers.searchAria')}
              className="w-full pl-8 pr-3 py-1.5 text-sm rounded-md border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1" role="tablist" aria-label={t('platformUsers.title')}>
            {FILTERS.map((f) => (
              <button
                key={f}
                role="tab"
                aria-selected={filter === f}
                onClick={() => setFilter(f)}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors ${
                  filter === f
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
              >
                {t(`platformUsers.filters.${f}`)}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <ListSkeleton />
          ) : isError ? (
            <p className="p-4 text-sm text-red-500">{t('platformUsers.errorLoad')}</p>
          ) : users.length === 0 ? (
            <p className="p-4 text-sm text-slate-400">
              {debouncedSearch ? t('platformUsers.noSearchResults') : t('platformUsers.noCategory')}
            </p>
          ) : (
            users.map((user) => <UserListItem key={user.id} user={user} />)
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs text-slate-500">
            <span>
              {t('platformUsers.pagination', { total: totalElements, page: page + 1, totalPages })}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                aria-label={t('platformUsers.pagePrevious')}
                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-30"
              >
                <IconChevronLeft className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                aria-label={t('platformUsers.pageNext')}
                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-30"
              >
                <IconChevronRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}

        {/* Fetching overlay */}
        {isFetching && !isLoading && (
          <div className="absolute inset-x-0 top-0 h-0.5 bg-indigo-500/30 animate-pulse" role="status" aria-label="Actualizando" />
        )}
      </aside>

      {/* ── Right panel: outlet ──────────────────────────────────────────── */}
      <div className={`flex-1 bg-slate-50 dark:bg-slate-950 overflow-y-auto ${outlet ? '' : 'hidden min-[550px]:flex'}`}>
        {outlet ? (
          <>
            <button
              onClick={() => navigate('/dashboard/platform-users')}
              className="min-[550px]:hidden flex items-center gap-1 px-4 pt-4 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
              aria-label={t('platformUsers.mobileBack')}
            >
              <IconChevronLeft className="w-4 h-4" aria-hidden="true" />
              {t('platformUsers.mobileBack')}
            </button>
            {outlet}
          </>
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  )
}
