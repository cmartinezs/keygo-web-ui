import { useState, useEffect, useRef } from 'react'
import { useNavigate, useOutlet, NavLink } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { listTenants, TENANT_QUERY_KEYS } from '@/api/tenants'
import type { TenantData, TenantStatus, ListTenantsParams } from '@/types/tenant'

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
const STATUS_LABELS: Record<TenantStatus, string> = {
  ACTIVE: 'Activo',
  SUSPENDED: 'Suspendido',
  PENDING: 'Pendiente',
}

function StatusBadge({ status }: { status: TenantStatus }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  )
}

// ── Tenant list item ──────────────────────────────────────────────────────────

function TenantListItem({ tenant }: { tenant: TenantData }) {
  const date = new Date(tenant.created_at).toLocaleDateString('es-CL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

  return (
    <NavLink
      to={tenant.slug}
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

function TenantsEmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-4 p-10 text-center">
      <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
        <svg
          className="w-8 h-8 text-indigo-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"
          />
        </svg>
      </div>
      <div>
        <h2 className="text-base font-semibold text-slate-800 dark:text-white">
          Selecciona un tenant
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
          Elige un tenant de la lista para ver su detalle, o crea uno nuevo para comenzar.
        </p>
      </div>
      <button
        onClick={onNew}
        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Nuevo tenant
      </button>
    </div>
  )
}

// ── Filter types ──────────────────────────────────────────────────────────────

type FilterStatus = 'ALL' | TenantStatus

const FILTER_TABS: { value: FilterStatus; label: string }[] = [
  { value: 'ALL', label: 'Todos' },
  { value: 'ACTIVE', label: 'Activos' },
  { value: 'SUSPENDED', label: 'Suspendidos' },
  { value: 'PENDING', label: 'Pendientes' },
]

// ── Icons ─────────────────────────────────────────────────────────────────────

function IconSearch() {
  return (
    <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
    </svg>
  )
}

function IconPlus() {
  return (
    <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  )
}

function IconChevronLeft() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
  )
}

function IconChevronRight() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TenantsPage() {
  const navigate = useNavigate()
  const outlet = useOutlet()

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterStatus>('ALL')
  const [page, setPage] = useState(0)

  // Debounce search so we don't fire a request on every keystroke
  const debouncedSearch = useDebounce(search, 350)

  // Reset to page 0 whenever filters change
  useEffect(() => {
    setPage(0)
  }, [filter, debouncedSearch])

  const queryParams: ListTenantsParams = {
    ...(filter !== 'ALL' && { status: filter }),
    ...(debouncedSearch && { name_like: debouncedSearch }),
    page,
    size: PAGE_SIZE,
  }

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: TENANT_QUERY_KEYS.list(queryParams),
    queryFn: () => listTenants(queryParams),
    placeholderData: (prev) => prev,
  })

  const tenants = data?.content ?? []
  const totalPages = data?.total_pages ?? 0
  const totalElements = data?.total_elements ?? 0

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
            <h1 className="text-base font-bold text-slate-900 dark:text-white">Tenants</h1>
            <button
              onClick={() => navigate('new')}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            >
              <IconPlus />
              Nuevo
            </button>
          </div>

          {/* Search — delegates filtering to backend via name_like */}
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2">
            <IconSearch />
            <input
              type="search"
              placeholder="Buscar por nombre…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 outline-none min-w-0"
              aria-label="Buscar tenant por nombre"
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
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
                filter === tab.value
                  ? 'text-indigo-600 dark:text-indigo-400 border-indigo-500'
                  : 'text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading && <ListSkeleton />}

          {isError && (
            <div className="px-4 py-6 text-center text-sm text-red-500 dark:text-red-400">
              Error al cargar tenants.
            </div>
          )}

          {!isLoading && !isError && tenants.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-slate-400 dark:text-slate-500">
              {debouncedSearch
                ? 'Sin resultados para la búsqueda.'
                : 'No hay tenants en esta categoría.'}
            </div>
          )}

          {!isLoading && !isError && tenants.map((tenant) => (
            <TenantListItem key={tenant.slug} tenant={tenant} />
          ))}
        </div>

        {/* Pagination footer */}
        {totalPages > 1 && (
          <div className="shrink-0 border-t border-slate-200 dark:border-white/10 px-3 py-2 flex items-center justify-between gap-2">
            <span className="text-[10px] text-slate-400 dark:text-slate-500">
              {totalElements} tenants · p.&nbsp;{page + 1}/{totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="w-6 h-6 flex items-center justify-center rounded text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Página anterior"
              >
                <IconChevronLeft />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="w-6 h-6 flex items-center justify-center rounded text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Página siguiente"
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
              onClick={() => navigate('/admin/tenants')}
              className="flex items-center gap-1 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
            >
              <IconChevronLeft />
              Tenants
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto">
          {outlet ?? <TenantsEmptyState onNew={() => navigate('new')} />}
        </div>
      </div>
    </div>
  )
}
