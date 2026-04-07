import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { getPlatformDashboard, DASHBOARD_QUERY_KEYS } from '@/features/console/dashboard/api'
import {
  NETWORK_MAX_RETRIES,
  NETWORK_REQUEST_TIMEOUT_MS,
  NETWORK_RETRY_DELAY_MS,
} from '@/shared/lib/config/network'
import { runGetWithRecovery } from '@/shared/lib/network/recovery'
import { IconRefresh, IconDashboard } from '@/shared/ui/icons'
import { CardSkeleton, ErrorAlert, SectionTitle } from './components/DashboardPrimitives'
import { ServiceStatusRow } from './components/ServiceStatusRow'
import { IamCoreRow } from './components/IamCoreRow'
import { SecurityRow } from './components/SecurityRow'
import { PendingAndActivityRow } from './components/PendingAndActivityRow'
import { RankingsRow } from './components/RankingsRow'
import { OnboardingHealthRow } from './components/OnboardingHealthRow'

// ── Range selector ────────────────────────────────────────────────────────────

type DateRange = 'today' | '7d' | '30d'

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
  const { t } = useTranslation()
  const [range, setRange] = useState<DateRange>('7d')
  const rangeOptions: { value: DateRange; label: string }[] = [
    { value: 'today', label: t('adminDashboard.range.today') },
    { value: '7d', label: t('adminDashboard.range.sevenDays') },
    { value: '30d', label: t('adminDashboard.range.thirtyDays') },
  ]

  async function fetchDashboardWithRecovery(signal: AbortSignal) {
    return runGetWithRecovery({
      signal,
      label: 'dashboard',
      timeoutMs: NETWORK_REQUEST_TIMEOUT_MS,
      retryDelayMs: NETWORK_RETRY_DELAY_MS,
      maxRetries: NETWORK_MAX_RETRIES,
      query: () =>
        getPlatformDashboard({
          signal,
          timeoutMs: NETWORK_REQUEST_TIMEOUT_MS,
        }),
    })
  }

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.platformDashboard,
    queryFn: ({ signal }) => fetchDashboardWithRecovery(signal),
    retry: false,
  })

  function handleRefresh() {
    void refetch().then(() => {
      toast.success(t('adminDashboard.refreshedToast'))
    })
  }

  return (
    <div className="max-w-screen-xl mx-auto space-y-8">

      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('adminDashboard.title')}</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {t('adminDashboard.subtitle')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Date range */}
          <div className="flex rounded-lg border border-slate-200 dark:border-white/10 overflow-hidden">
            {rangeOptions.map((opt) => (
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
            aria-label={t('adminDashboard.refreshAria')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none"
          >
            <IconRefresh className={`h-4 w-4 shrink-0 ${isFetching ? 'animate-spin' : ''}`} aria-hidden="true" />
            {t('adminDashboard.refresh')}
          </button>

          {/* Quick actions */}
          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none"
          >
            <IconDashboard className="h-4 w-4 shrink-0" aria-hidden="true" />
            {t('adminDashboard.quickActions')}
          </button>
        </div>
      </div>

      {/* ── Error global ── */}
      {isError && (
        <ErrorAlert message={t('adminDashboard.loadError')} />
      )}

      {/* ── Fila 1: Estado operativo ── */}
      <section aria-labelledby="section-service">
        <SectionTitle><span id="section-service">{t('adminDashboard.sections.serviceStatus')}</span></SectionTitle>
        {isLoading ? <SkeletonGrid count={4} /> : <ServiceStatusRow service={data?.service} activeSigningKey={data?.security.active_signing_key} />}
      </section>

      {/* ── Fila 2: Núcleo IAM ── */}
      <section aria-labelledby="section-iam">
        <SectionTitle><span id="section-iam">{t('adminDashboard.sections.iamCore')}</span></SectionTitle>
        {isLoading ? <SkeletonGrid count={4} /> : <IamCoreRow tenants={data?.tenants} users={data?.users} apps={data?.apps} memberships={data?.memberships} />}
      </section>

      {/* ── Fila 3: Seguridad ── */}
      <section aria-labelledby="section-security">
        <SectionTitle><span id="section-security">{t('adminDashboard.sections.security')}</span></SectionTitle>
        {isLoading ? <SkeletonGrid count={4} /> : <SecurityRow security={data?.security} />}
      </section>

      {/* ── Fila 4: Pendientes + Actividad ── */}
      <section aria-labelledby="section-lists">
        <SectionTitle><span id="section-lists">{t('adminDashboard.sections.managementAndActivity')}</span></SectionTitle>
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
        <SectionTitle><span id="section-rankings">{t('adminDashboard.sections.rankings')}</span></SectionTitle>
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
        <SectionTitle><span id="section-onboarding">{t('adminDashboard.sections.onboardingHealth')}</span></SectionTitle>
        {isLoading ? <SkeletonGrid count={4} /> : <OnboardingHealthRow registration={data?.registration} />}
      </section>
    </div>
  )
}
