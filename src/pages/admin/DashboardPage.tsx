import { useQuery } from '@tanstack/react-query'
import { getServiceInfo, getPlatformStats, PLATFORM_QUERY_KEYS } from '@/api/serviceInfo'

// ── Sub-components ────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string
  value: string | number | undefined
}

function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-5 flex flex-col gap-2 hover:border-indigo-400 dark:hover:border-indigo-500/40 transition-colors">
      <span className="text-[10px] font-semibold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest">{label}</span>
      <span className="text-xl font-bold text-slate-900 dark:text-white">
        {value ?? <span className="text-slate-400 dark:text-slate-600 text-sm font-normal italic">—</span>}
      </span>
    </div>
  )
}

function CardSkeleton() {
  return <div className="bg-slate-200 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-5 animate-pulse h-24" />
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const { data: info, isLoading: infoLoading, isError: infoError } = useQuery({
    queryKey: PLATFORM_QUERY_KEYS.serviceInfo,
    queryFn: getServiceInfo,
  })

  const { data: stats, isLoading: statsLoading, isError: statsError } = useQuery({
    queryKey: PLATFORM_QUERY_KEYS.stats,
    queryFn: getPlatformStats,
  })

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Panel de Control</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Información global de la plataforma KeyGo.</p>
      </div>

      {/* ── Service info cards ── */}
      {infoLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => <CardSkeleton key={i} />)}
        </div>
      )}

      {infoError && (
        <div
          role="alert"
          className="bg-red-950/50 border border-red-500/30 text-red-300 text-sm rounded-xl px-5 py-4"
        >
          No se pudo cargar la información del servicio. Intenta recargar la página.
        </div>
      )}

      {info && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Versión" value={info.version} />
          <StatCard label="Entorno" value={info.environment} />
          <StatCard label="Estado" value={info.status} />
        </div>
      )}

      {/* ── Platform stats ── */}
      <div>
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Estadísticas de la plataforma</h2>

        {statsLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((i) => <CardSkeleton key={i} />)}
          </div>
        )}

        {statsError && (
          <div
            role="alert"
            className="bg-red-950/50 border border-red-500/30 text-red-300 text-sm rounded-xl px-5 py-4"
          >
            No se pudieron cargar las estadísticas de la plataforma.
          </div>
        )}

        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard label="Tenants activos" value={stats.tenants?.active} />
            <StatCard label="Usuarios totales" value={stats.users?.total} />
            <StatCard label="Apps registradas" value={stats.apps?.total} />
            <StatCard label="Claves de firma" value={stats.signingKeys?.active} />
          </div>
        )}

        {stats && (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
            <StatCard label="Tenants suspendidos" value={stats.tenants?.suspended} />
            <StatCard label="Tenants pendientes" value={stats.tenants?.pending} />
            <StatCard label="Usuarios pendientes" value={stats.users?.pending} />
          </div>
        )}
      </div>

      {/* ── Service details ── */}
      {info && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Detalles del servicio</h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
            <div className="flex flex-col gap-1">
              <dt className="text-[10px] font-semibold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest">Título</dt>
              <dd className="text-slate-800 dark:text-slate-200 font-medium">{info.title ?? '—'}</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-[10px] font-semibold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest">Nombre interno</dt>
              <dd className="text-slate-800 dark:text-slate-200 font-medium">{info.name ?? '—'}</dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  )
}
