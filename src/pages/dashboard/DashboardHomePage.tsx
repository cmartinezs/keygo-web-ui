import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import AdminDashboardPage from '@/pages/admin/DashboardPage'
import { getAccountAccess, getSessions } from '@/api/account'
import { listClientApps } from '@/api/clientApps'
import { listUsers } from '@/api/users'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import {
  NETWORK_MAX_RETRIES,
  NETWORK_REQUEST_TIMEOUT_MS,
  NETWORK_RETRY_DELAY_MS,
} from '@/config/network'
import { runGetWithRecovery } from '@/lib/network/recovery'
import { IconUsers, IconApps, IconClock, IconBell } from '@/components/icons'
import { resolvePrimaryRole } from '@/types/roles'
import type { AppRole } from '@/types/roles'
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

type NonAdminRole = Exclude<AppRole, 'ADMIN'>

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
  const usersQuery = useQuery({
    queryKey: ['dashboard-home', 'tenant-users', tenantSlug],
    queryFn: ({ signal }) =>
      runGetWithRecovery({
        signal,
        label: 'usuarios del tenant',
        timeoutMs: NETWORK_REQUEST_TIMEOUT_MS,
        retryDelayMs: NETWORK_RETRY_DELAY_MS,
        maxRetries: NETWORK_MAX_RETRIES,
        query: () =>
          listUsers(tenantSlug, {
            signal,
            timeoutMs: NETWORK_REQUEST_TIMEOUT_MS,
          }),
      }),
    retry: false,
  })

  const appsQuery = useQuery({
    queryKey: ['dashboard-home', 'tenant-apps', tenantSlug],
    queryFn: ({ signal }) =>
      runGetWithRecovery({
        signal,
        label: 'aplicaciones del tenant',
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

  const sessionsQuery = useQuery({
    queryKey: ['dashboard-home', 'account-sessions', tenantSlug],
    queryFn: ({ signal }) =>
      runGetWithRecovery({
        signal,
        label: 'sesiones de cuenta',
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

  const users = toArrayPayload<{ status?: string }>(usersQuery.data)
  const apps = toArrayPayload<unknown>(appsQuery.data)
  const sessions = toArrayPayload<{ last_accessed_at?: string }>(sessionsQuery.data)

  const activeUsers = users.filter((user) => user.status === 'ACTIVE').length
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

  const cards: StatCardData[] = [
    {
      title: 'Usuarios activos',
      value: toCardValue(usersQuery.isLoading, usersQuery.isError, String(activeUsers)),
      description: usersQuery.isError
        ? 'No fue posible cargar usuarios del tenant.'
        : 'Cantidad de usuarios activos actualmente en tu tenant.',
      icon: <span className="inline-flex" aria-hidden="true"><IconUsers /></span>,
    },
    {
      title: 'Aplicaciones',
      value: toCardValue(appsQuery.isLoading, appsQuery.isError, String(appsCount)),
      description: appsQuery.isError
        ? 'No fue posible cargar aplicaciones del tenant.'
        : 'Aplicaciones registradas para tu organizacion.',
      icon: <span className="inline-flex" aria-hidden="true"><IconApps /></span>,
    },
    {
      title: 'Accesos del dia',
      value: toCardValue(sessionsQuery.isLoading, sessionsQuery.isError, String(todayAccesses)),
      description: sessionsQuery.isError
        ? 'No fue posible cargar sesiones de cuenta.'
        : 'Inicios de sesion del usuario actual durante hoy.',
      icon: <span className="inline-flex" aria-hidden="true"><IconClock /></span>,
    },
  ]

  return (
    <RoleOverviewLayout
      title="Panel de administracion del tenant"
      subtitle="Gestiona usuarios, aplicaciones y seguridad de tu organizacion."
      cards={cards}
      role="ADMIN_TENANT"
    />
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
      role="USER_TENANT"
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
    role === 'ADMIN_TENANT'
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
  const role = user?.activeRole ?? resolvePrimaryRole(user?.roles ?? []) ?? 'USER_TENANT'
  const tenantSlug = user?.tenantSlug

  if (role === 'ADMIN') {
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

  if (role === 'ADMIN_TENANT') {
    return <AdminTenantOverview tenantSlug={tenantSlug} />
  }

  return <UserTenantOverview tenantSlug={tenantSlug} />
}
