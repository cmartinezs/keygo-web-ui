import { useQuery } from '@tanstack/react-query'
import { getServiceInfo } from '@/api/serviceInfo'

// ── Query keys ────────────────────────────────────────────────────────────────

export const SERVICE_INFO_QUERY_KEY = ['service-info'] as const

// ── Sub-components ────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string
  value: string | undefined
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

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: SERVICE_INFO_QUERY_KEY,
    queryFn: getServiceInfo,
  })

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Panel de Control</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Información global de la plataforma KeyGo.</p>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="bg-slate-200 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-5 animate-pulse h-24" />
          ))}
        </div>
      )}

      {isError && (
        <div
          role="alert"
          className="bg-red-950/50 border border-red-500/30 text-red-300 text-sm rounded-xl px-5 py-4"
        >
          No se pudo cargar la información del servicio. Intenta recargar la página.
        </div>
      )}

      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Versión" value={data.version} />
          <StatCard label="Entorno" value={data.environment} />
          <StatCard label="Estado" value={data.status} />
        </div>
      )}

      {data && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Detalles del servicio</h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
            <div className="flex flex-col gap-1">
              <dt className="text-[10px] font-semibold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest">Título</dt>
              <dd className="text-slate-800 dark:text-slate-200 font-medium">{data.title ?? '—'}</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-[10px] font-semibold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest">Nombre interno</dt>
              <dd className="text-slate-200 font-medium">{data.name ?? '—'}</dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  )
}
