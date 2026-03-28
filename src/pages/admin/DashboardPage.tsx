import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getPlatformDashboard, DASHBOARD_QUERY_KEYS } from '@/api/dashboard'
import { CardSkeleton, ErrorAlert, SectionTitle } from './dashboard/DashboardPrimitives'
import { ServiceStatusRow } from './dashboard/ServiceStatusRow'
import { IamCoreRow } from './dashboard/IamCoreRow'
import { SecurityRow } from './dashboard/SecurityRow'
import { PendingAndActivityRow } from './dashboard/PendingAndActivityRow'
import { RankingsRow } from './dashboard/RankingsRow'
import { OnboardingHealthRow } from './dashboard/OnboardingHealthRow'

// ── Range selector ────────────────────────────────────────────────────────────

type DateRange = 'today' | '7d' | '30d'

const RANGE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: 'today', label: 'Hoy' },
  { value: '7d', label: '7 días' },
  { value: '30d', label: '30 días' },
]

// ── Skeleton grid ─────────────────────────────────────────────────────────────

function SkeletonGrid({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => <CardSkeleton key={i} />)}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const [range, setRange] = useState<DateRange>('7d')

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.platformDashboard,
    queryFn: getPlatformDashboard,
  })

  function handleRefresh() {
    void refetch().then(() => {
      toast.success('Panel actualizado')
    })
  }

  return (
    <div className="max-w-screen-xl mx-auto space-y-8">

      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Panel de control</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Vista global de la plataforma KeyGo · datos en tiempo real
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Date range */}
          <div className="flex rounded-lg border border-slate-200 dark:border-white/10 overflow-hidden">
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setRange(opt.value)}
                aria-pressed={range === opt.value}
                className={`px-3 py-1.5 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none ${
                  range === opt.value
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Refresh */}
          <button
            onClick={handleRefresh}
            disabled={isFetching}
            aria-label="Actualizar dashboard"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none"
          >
            <svg
              className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Actualizar
          </button>

          {/* Quick actions */}
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Acciones rápidas
          </button>
        </div>
      </div>

      {/* ── Error global ── */}
      {isError && (
        <ErrorAlert message="No se pudo cargar el panel de control. Verifica tu conexión e intenta de nuevo." />
      )}

      {/* ── Fila 1: Estado operativo ── */}
      <section aria-labelledby="section-service">
        <SectionTitle><span id="section-service">Estado operativo</span></SectionTitle>
        {isLoading ? <SkeletonGrid count={4} /> : <ServiceStatusRow service={data?.service} activeSigningKey={data?.security.active_signing_key} />}
      </section>

      {/* ── Fila 2: Núcleo IAM ── */}
      <section aria-labelledby="section-iam">
        <SectionTitle><span id="section-iam">Núcleo IAM</span></SectionTitle>
        {isLoading ? <SkeletonGrid count={4} /> : <IamCoreRow tenants={data?.tenants} users={data?.users} apps={data?.apps} memberships={data?.memberships} />}
      </section>

      {/* ── Fila 3: Seguridad ── */}
      <section aria-labelledby="section-security">
        <SectionTitle><span id="section-security">Seguridad</span></SectionTitle>
        {isLoading ? <SkeletonGrid count={4} /> : <SecurityRow security={data?.security} />}
      </section>

      {/* ── Fila 4: Pendientes + Actividad ── */}
      <section aria-labelledby="section-lists">
        <SectionTitle><span id="section-lists">Gestión y actividad</span></SectionTitle>
        {isLoading
          ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <CardSkeleton />
              <CardSkeleton />
            </div>
          )
          : (
            <PendingAndActivityRow
              pendingActions={data?.pending_actions}
              recentActivity={data?.recent_activity}
            />
          )}
      </section>

      {/* ── Fila 5: Rankings ── */}
      <section aria-labelledby="section-rankings">
        <SectionTitle><span id="section-rankings">Rankings</span></SectionTitle>
        {isLoading
          ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <CardSkeleton />
              <CardSkeleton />
            </div>
          )
          : (
            <RankingsRow rankings={data?.rankings} />
          )}
      </section>

      {/* ── Fila 6: Salud de onboarding ── */}
      <section aria-labelledby="section-onboarding">
        <SectionTitle><span id="section-onboarding">Salud de onboarding</span></SectionTitle>
        {isLoading ? <SkeletonGrid count={4} /> : <OnboardingHealthRow registration={data?.registration} />}
      </section>
    </div>
  )
}
