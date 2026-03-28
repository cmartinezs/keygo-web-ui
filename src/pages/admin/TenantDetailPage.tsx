import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getTenant, suspendTenant, activateTenant, TENANT_QUERY_KEYS } from '@/api/tenants'
import { toast } from 'sonner'
import type { TenantStatus } from '@/types/tenant'

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
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${STATUS_STYLES[status]}`}>
      {STATUS_LABELS[status]}
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
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: tenant, isLoading, isError, error } = useQuery({
    queryKey: TENANT_QUERY_KEYS.detail(slug!),
    queryFn: () => getTenant(slug!),
    enabled: !!slug,
  })

  const suspendMutation = useMutation({
    mutationFn: () => suspendTenant(slug!),
    onSuccess: () => {
      toast.success('Tenant suspendido correctamente.')
      queryClient.invalidateQueries({ queryKey: TENANT_QUERY_KEYS.all })
      queryClient.invalidateQueries({ queryKey: TENANT_QUERY_KEYS.detail(slug!) })
    },
    onError: () => toast.error('No se pudo suspender el tenant. Intenta de nuevo.'),
  })

  const activateMutation = useMutation({
    mutationFn: () => activateTenant(slug!),
    onSuccess: () => {
      toast.success('Tenant activado correctamente.')
      queryClient.invalidateQueries({ queryKey: TENANT_QUERY_KEYS.all })
      queryClient.invalidateQueries({ queryKey: TENANT_QUERY_KEYS.detail(slug!) })
    },
    onError: () => toast.error('No se pudo activar el tenant.'),
  })

  const handleSuspend = () => {
    if (confirm(`¿Suspender el tenant "${tenant?.name}"? Los usuarios no podrán autenticarse.`)) {
      suspendMutation.mutate()
    }
  }

  if (isLoading) return <DetailSkeleton />

  if (isError) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[300px] gap-3 text-center">
        <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
          <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {error instanceof Error ? error.message : 'No se pudo cargar el tenant.'}
        </p>
        <button
          onClick={() => navigate('/admin/tenants')}
          className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          Volver a la lista
        </button>
      </div>
    )
  }

  if (!tenant) return null

  const createdDate = new Date(tenant.created_at).toLocaleDateString('es-CL', {
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
        <InfoRow label="ID" value={<code className="text-xs text-slate-500 dark:text-slate-400 font-mono break-all">{tenant.id}</code>} />
        <InfoRow label="Slug" value={<code className="text-xs font-mono text-indigo-600 dark:text-indigo-400">{tenant.slug}</code>} />
        <InfoRow label="Email del propietario" value={tenant.owner_email ?? '—'} />
        <InfoRow label="Creado el" value={createdDate} />
      </div>

      {/* Actions */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Acciones</h3>

        <div className="flex flex-wrap gap-3">
          {/* Jump to tenant admin */}
          <button
            onClick={() => navigate(`/tenant-admin?tenant=${tenant.slug}`)}
            className="flex items-center gap-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-sm font-medium px-4 py-2 rounded-lg transition-colors border border-slate-200 dark:border-white/10"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
            Ver como admin de tenant
          </button>

          {/* Suspend — only when ACTIVE */}
          {tenant.status === 'ACTIVE' && (
            <button
              onClick={handleSuspend}
              disabled={isBusy}
              className="flex items-center gap-2 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 text-sm font-medium px-4 py-2 rounded-lg transition-colors border border-red-200 dark:border-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
              {suspendMutation.isPending ? 'Suspendiendo…' : 'Suspender tenant'}
            </button>
          )}

          {/* Activate — only when SUSPENDED */}
          {tenant.status === 'SUSPENDED' && (
            <button
              onClick={() => activateMutation.mutate()}
              disabled={isBusy}
              className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm font-medium px-4 py-2 rounded-lg transition-colors border border-emerald-200 dark:border-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {activateMutation.isPending ? 'Activando…' : 'Reactivar tenant'}
            </button>
          )}
        </div>


      </div>
    </div>
  )
}
