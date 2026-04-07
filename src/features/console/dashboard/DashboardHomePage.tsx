import { useMemo, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import AdminDashboardPage from '@/features/ops/dashboard/DashboardPage'
import { getAccountAccess, getSessions } from '@/features/account/api'
import { listClientApps } from '@/features/console/apps/api'
import { listTenants, TENANT_QUERY_KEYS } from '@/features/ops/tenants/api'
import { listUsers } from '@/features/console/users/api'
import { useCurrentUser } from '@/shared/hooks/useCurrentUser'
import { useTokenStore } from '@/shared/lib/auth/tokenStore'
import {
  NETWORK_MAX_RETRIES,
  NETWORK_REQUEST_TIMEOUT_MS,
  NETWORK_RETRY_DELAY_MS,
} from '@/shared/lib/config/network'
import { runGetWithRecovery } from '@/shared/lib/network/recovery'
import { IconUsers, IconApps, IconClock, IconBell } from '@/shared/ui/icons'
import { resolvePrimaryRole } from '@/shared/types/roles'
import type { PlatformRole } from '@/shared/types/roles'
import type { ReactNode } from 'react'

interface StatCardProps {
  title: string
  value: string
  description: string
  icon?: ReactNode
}

interface StatCardData {
  title: string
  value: string
  description: string
  icon: ReactNode
}

type NonAdminRole = Exclude<PlatformRole, 'keygo_admin'>

function toArrayPayload<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value
  if (!value || typeof value !== 'object') return []

  const candidate = value as Record<string, unknown>
  if (Array.isArray(candidate.items)) return candidate.items as T[]
  if (Array.isArray(candidate.content)) return candidate.content as T[]
  if (Array.isArray(candidate.rows)) return candidate.rows as T[]
  if (Array.isArray(candidate.data)) return candidate.data as T[]

  return []
}

function StatCard({ title, value, description, icon }: StatCardProps) {
  return (
    <article className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-5 space-y-1.5">
      {icon && <div className="w-5 h-5 text-slate-400 dark:text-slate-500">{icon}</div>}
      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{title}</p>
      <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
    </article>
  )
}

function toCardValue(isLoading: boolean, isError: boolean, value: string): string {
  if (isLoading) return '...'
  if (isError) return 'N/D'
  return value
}

function toLocalDateTime(input: string): string {
  const date = new Date(input)
  if (Number.isNaN(date.getTime())) {
    return '--'
  }

  return date.toLocaleString('es-CL')
}

function AdminTenantOverview({ tenantSlug }: { tenantSlug: string }) {
  const currentUser = useCurrentUser()
  const managedTenantSlug = useTokenStore((s) => s.managedTenantSlug)
  const setManagedTenantSlug = useTokenStore((s) => s.setManagedTenantSlug)

  const tenantsQuery = useQuery({
    queryKey: TENANT_QUERY_KEYS.list({ owner_email: currentUser?.email, size: 100 }),
    queryFn: ({ signal }) =>
      runGetWithRecovery({
        signal,
        label: 'tenants administrados',
        timeoutMs: NETWORK_REQUEST_TIMEOUT_MS,
        retryDelayMs: NETWORK_RETRY_DELAY_MS,
        maxRetries: NETWORK_MAX_RETRIES,
        query: () =>
          listTenants(
            { owner_email: currentUser?.email, size: 100 },
            { signal, timeoutMs: NETWORK_REQUEST_TIMEOUT_MS },
          ),
      }),
    enabled: !!currentUser?.email,
    retry: false,
  })

  const ownedTenants = useMemo(
    () => tenantsQuery.data?.content ?? [],
    [tenantsQuery.data],
  )

  const effectiveTenantSlug = useMemo(() => {
    if (managedTenantSlug && ownedTenants.some((t) => t.slug === managedTenantSlug)) {
      return managedTenantSlug
    }
    const firstActive = ownedTenants.find((t) => t.status === 'ACTIVE')
    return firstActive?.slug ?? tenantSlug
  }, [managedTenantSlug, ownedTenants, tenantSlug])

  useEffect(() => {
    if (tenantsQuery.isSuccess && ownedTenants.length > 0 && !managedTenantSlug) {
      const firstActive = ownedTenants.find((t) => t.status === 'ACTIVE')
      if (firstActive) {
        setManagedTenantSlug(firstActive.slug)
      }
    }
  }, [tenantsQuery.isSuccess, ownedTenants, managedTenantSlug, setManagedTenantSlug])

  const shouldRunTenantQueries = !tenantsQuery.isLoading

  const usersQuery = useQuery({
    queryKey: ['dashboard-home', 'tenant-users', effectiveTenantSlug],
    queryFn: ({ signal }) =>
      runGetWithRecovery({
        signal,
        label: 'usuarios del tenant',
        timeoutMs: NETWORK_REQUEST_TIMEOUT_MS,
        retryDelayMs: NETWORK_RETRY_DELAY_MS,
        maxRetries: NETWORK_MAX_RETRIES,
        query: () =>
          listUsers(effectiveTenantSlug, {
            signal,
            timeoutMs: NETWORK_REQUEST_TIMEOUT_MS,
          }),
      }),
    retry: false,
    enabled: shouldRunTenantQueries,
  })

  const appsQuery = useQuery({
    queryKey: ['dashboard-home', 'tenant-apps', effectiveTenantSlug],
    queryFn: ({ signal }) =>
      runGetWithRecovery({
        signal,
        label: 'aplicaciones del tenant',
        timeoutMs: NETWORK_REQUEST_TIMEOUT_MS,
        retryDelayMs: NETWORK_RETRY_DELAY_MS,
        maxRetries: NETWORK_MAX_RETRIES,
        query: () =>
          listClientApps(effectiveTenantSlug, {
            signal,
            timeoutMs: NETWORK_REQUEST_TIMEOUT_MS,
          }),
      }),
    retry: false,
    enabled: shouldRunTenantQueries,
  })

  const sessionsQuery = useQuery({
    queryKey: ['dashboard-home', 'account-sessions', effectiveTenantSlug],
    queryFn: ({ signal }) =>
      runGetWithRecovery({
        signal,
        label: 'sesiones de cuenta',
        timeoutMs: NETWORK_REQUEST_TIMEOUT_MS,
        retryDelayMs: NETWORK_RETRY_DELAY_MS,
        maxRetries: NETWORK_MAX_RETRIES,
        query: () =>
          getSessions(effectiveTenantSlug, {
            signal,
            timeoutMs: NETWORK_REQUEST_TIMEOUT_MS,
          }),
      }),
    retry: false,
    enabled: shouldRunTenantQueries,
  })

  const users = toArrayPayload<{ status?: string }>(usersQuery.data)
  const apps = toArrayPayload<unknown>(appsQuery.data)
  const sessions = toArrayPayload<{ last_accessed_at?: string }>(sessionsQuery.data)

  const activeUsers = users.filter((u) => u.status === 'ACTIVE').length
  const appsCount = apps.length
  const todayAccesses =
    sessions.filter((session) => {
      const lastAccess = new Date(session.last_accessed_at ?? '')
      if (Number.isNaN(lastAccess.getTime())) {
        return false
      }
      const now = new Date()
      return (
        lastAccess.getFullYear() === now.getFullYear()
        && lastAccess.getMonth() === now.getMonth()
        && lastAccess.getDate() === now.getDate()
      )
    }).length

  const isLoadingTenantUsers = tenantsQuery.isLoading || usersQuery.isLoading
  const isLoadingTenantApps = tenantsQuery.isLoading || appsQuery.isLoading
  const isLoadingTenantSessions = tenantsQuery.isLoading || sessionsQuery.isLoading
  const isErrorTenantUsers = tenantsQuery.isError || usersQuery.isError
  const isErrorTenantApps = tenantsQuery.isError || appsQuery.isError
  const isErrorTenantSessions = tenantsQuery.isError || sessionsQuery.isError

  const cards: StatCardData[] = [
    {
      title: 'Usuarios activos',
      value: toCardValue(isLoadingTenantUsers, isErrorTenantUsers, String(activeUsers)),
      description: isErrorTenantUsers
        ? 'No fue posible cargar usuarios del tenant administrado.'
        : 'Cantidad de usuarios activos actualmente en tu tenant.',
      icon: <span className="inline-flex" aria-hidden="true"><IconUsers /></span>,
    },
    {
      title: 'Aplicaciones',
      value: toCardValue(isLoadingTenantApps, isErrorTenantApps, String(appsCount)),
      description: isErrorTenantApps
        ? 'No fue posible cargar aplicaciones del tenant administrado.'
        : 'Aplicaciones registradas para tu organizacion.',
      icon: <span className="inline-flex" aria-hidden="true"><IconApps /></span>,
    },
    {
      title: 'Accesos del dia',
      value: toCardValue(isLoadingTenantSessions, isErrorTenantSessions, String(todayAccesses)),
      description: isErrorTenantSessions
        ? 'No fue posible cargar sesiones del tenant administrado.'
        : 'Inicios de sesion del usuario actual durante hoy.',
      icon: <span className="inline-flex" aria-hidden="true"><IconClock /></span>,
    },
  ]

  let tenantSelectorNode: ReactNode
  if (tenantsQuery.isLoading) {
    tenantSelectorNode = (
      <div
        className="h-7 w-48 rounded animate-pulse bg-slate-200 dark:bg-slate-700"
        aria-busy="true"
        aria-label="Cargando tenants administrados"
      />
    )
  } else if (tenantsQuery.isError) {
    tenantSelectorNode = (
      <p className="text-sm text-amber-600 dark:text-amber-400" role="alert">
        No fue posible cargar los tenants administrados.
      </p>
    )
  } else if (ownedTenants.length <= 1) {
    tenantSelectorNode = (
      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
        {ownedTenants[0]?.name ?? effectiveTenantSlug}
      </span>
    )
  } else {
    tenantSelectorNode = (
      <select
        id="managed-tenant-selector"
        value={effectiveTenantSlug}
        onChange={(e) => setManagedTenantSlug(e.target.value)}
        className="text-sm rounded border border-slate-300 dark:border-white/20 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
        aria-label="Seleccionar tenant administrado"
      >
        {ownedTenants.map((t) => (
          <option key={t.slug} value={t.slug}>
            {t.name}
          </option>
        ))}
      </select>
    )
  }

  return (
    <div className="max-w-screen-xl mx-auto space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Panel de administracion del tenant
        </h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500 dark:text-slate-400">Organizacion activa:</span>
          {tenantSelectorNode}
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Gestiona usuarios, aplicaciones y seguridad de tu organizacion.
        </p>
      </header>

      <section
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"
        aria-label="Resumen del dashboard"
      >
        {cards.map((card) => (
          <StatCard
            key={card.title}
            title={card.title}
            value={card.value}
            description={card.description}
            icon={card.icon}
          />
        ))}
      </section>

      <section className="rounded-xl border border-dashed border-slate-300 dark:border-white/20 bg-white/80 dark:bg-slate-900/80 p-6">
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Siguientes modulos</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Este dashboard ya consume datos reales del tenant y seguira ampliandose con nuevos indicadores de administracion.
        </p>
      </section>
    </div>
  )
}

function UserTenantOverview({ tenantSlug }: { tenantSlug: string }) {
  const sessionsQuery = useQuery({
    queryKey: ['dashboard-home', 'user-sessions', tenantSlug],
    queryFn: ({ signal }) =>
      runGetWithRecovery({
        signal,
        label: 'sesiones activas',
        timeoutMs: NETWORK_REQUEST_TIMEOUT_MS,
        retryDelayMs: NETWORK_RETRY_DELAY_MS,
        maxRetries: NETWORK_MAX_RETRIES,
        query: () =>
          getSessions(tenantSlug, {
            signal,
            timeoutMs: NETWORK_REQUEST_TIMEOUT_MS,
          }),
      }),
    retry: false,
  })

  const accessQuery = useQuery({
    queryKey: ['dashboard-home', 'user-access', tenantSlug],
    queryFn: ({ signal }) =>
      runGetWithRecovery({
        signal,
        label: 'accesos por aplicacion',
        timeoutMs: NETWORK_REQUEST_TIMEOUT_MS,
        retryDelayMs: NETWORK_RETRY_DELAY_MS,
        maxRetries: NETWORK_MAX_RETRIES,
        query: () =>
          getAccountAccess(tenantSlug, {
            signal,
            timeoutMs: NETWORK_REQUEST_TIMEOUT_MS,
          }),
      }),
    retry: false,
  })

  const sessions = toArrayPayload<{ last_accessed_at?: string }>(sessionsQuery.data)
  const accesses = toArrayPayload<unknown>(accessQuery.data)

  const lastAccess = useMemo(() => {
    if (sessions.length === 0) {
      return '--'
    }

    const sortedSessions = [...sessions].sort((a, b) => {
      const left = new Date(a.last_accessed_at ?? '').getTime()
      const right = new Date(b.last_accessed_at ?? '').getTime()
      return right - left
    })

    return toLocalDateTime(sortedSessions[0]?.last_accessed_at ?? '')
  }, [sessions])

  const cards: StatCardData[] = [
    {
      title: 'Sesiones activas',
      value: toCardValue(
        sessionsQuery.isLoading,
        sessionsQuery.isError,
        String(sessions.length),
      ),
      description: sessionsQuery.isError
        ? 'No fue posible cargar tus sesiones activas.'
        : 'Dispositivos con sesion iniciada actualmente.',
      icon: <span className="inline-flex" aria-hidden="true"><IconUsers /></span>,
    },
    {
      title: 'Ultimo acceso',
      value: toCardValue(sessionsQuery.isLoading, sessionsQuery.isError, lastAccess),
      description: sessionsQuery.isError
        ? 'No fue posible obtener el ultimo acceso.'
        : 'Fecha y hora de tu sesion mas reciente.',
      icon: <span className="inline-flex" aria-hidden="true"><IconClock /></span>,
    },
    {
      title: 'Aplicaciones con acceso',
      value: toCardValue(
        accessQuery.isLoading,
        accessQuery.isError,
        String(accesses.length),
      ),
      description: accessQuery.isError
        ? 'No fue posible cargar tus permisos por aplicacion.'
        : 'Aplicaciones donde tienes una membresia activa.',
      icon: <span className="inline-flex" aria-hidden="true"><IconBell /></span>,
    },
  ]

  return (
    <RoleOverviewLayout
      title="Panel personal"
      subtitle="Accede a tus recursos, historial de accesos y configuraciones personales."
      cards={cards}
      role="keygo_user"
    />
  )
}

function RoleOverviewLayout({
  title,
  subtitle,
  cards,
  role,
}: {
  title: string
  subtitle: string
  cards: StatCardData[]
  role: NonAdminRole
}) {
  const nextModuleMessage =
    role === 'keygo_tenant_admin'
      ? 'Este dashboard ya consume datos reales del tenant y seguira ampliandose con nuevos indicadores de administracion.'
      : 'Este dashboard ya consume datos reales de tu cuenta y seguira ampliandose con indicadores de actividad y seguridad.'

  return (
    <div className="max-w-screen-xl mx-auto space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4" aria-label="Resumen del dashboard">
        {cards.map((card) => (
          <StatCard key={card.title} title={card.title} value={card.value} description={card.description} icon={card.icon} />
        ))}
      </section>

      <section className="rounded-xl border border-dashed border-slate-300 dark:border-white/20 bg-white/80 dark:bg-slate-900/80 p-6">
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Siguientes modulos</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          {nextModuleMessage}
        </p>
      </section>
    </div>
  )
}

export default function DashboardHomePage() {
  const { t } = useTranslation()
  const user = useCurrentUser()
  const role = user?.activeRole ?? resolvePrimaryRole(user?.roles ?? []) ?? 'keygo_user'
  const tenantSlug = user?.tenantSlug

  if (role === 'keygo_admin') {
    return <AdminDashboardPage />
  }

  if (!tenantSlug) {
    return (
      <div className="max-w-screen-xl mx-auto">
        <section className="rounded-xl border border-red-200 dark:border-red-500/40 bg-red-50 dark:bg-red-950/20 p-4" role="alert" aria-live="assertive">
          <p className="text-sm text-red-800 dark:text-red-300">
            {t('dashboard.tenantResolutionError')}
          </p>
        </section>
      </div>
    )
  }

  if (role === 'keygo_tenant_admin') {
    return <AdminTenantOverview tenantSlug={tenantSlug} />
  }

  return <UserTenantOverview tenantSlug={tenantSlug} />
}
