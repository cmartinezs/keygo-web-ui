import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { getPlatformStats, PLATFORM_QUERY_KEYS } from '@/features/ops/serviceInfoApi'
import { IconApps, IconBuilding, IconKeySmall, IconUsers } from '@/shared/ui/icons'
import {
  NETWORK_MAX_RETRIES,
  NETWORK_REQUEST_TIMEOUT_MS,
  NETWORK_RETRY_DELAY_MS,
} from '@/shared/lib/config/network'
import { runGetWithRecovery } from '@/shared/lib/network/recovery'

interface StatItemProps {
  label: string
  value: string
  description: string
  icon: React.ReactNode
}

function StatItem({ label, value, description, icon }: StatItemProps) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900">
      <div className="mb-2 inline-flex text-slate-500 dark:text-slate-400" aria-hidden="true">{icon}</div>
      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{description}</p>
    </article>
  )
}

export default function PlatformStatsPage() {
  const { t } = useTranslation()

  const statsQuery = useQuery({
    queryKey: PLATFORM_QUERY_KEYS.stats,
    queryFn: ({ signal }) =>
      runGetWithRecovery({
        signal,
        label: t('platformStats.recoveryLabel'),
        timeoutMs: NETWORK_REQUEST_TIMEOUT_MS,
        retryDelayMs: NETWORK_RETRY_DELAY_MS,
        maxRetries: NETWORK_MAX_RETRIES,
        query: () =>
          getPlatformStats({
            signal,
            timeoutMs: NETWORK_REQUEST_TIMEOUT_MS,
          }),
      }),
    retry: false,
  })

  const tenantsTotal = statsQuery.data?.tenants?.total ?? 0
  const tenantsActive = statsQuery.data?.tenants?.active ?? 0
  const usersTotal = statsQuery.data?.users?.total ?? 0
  const usersActive = statsQuery.data?.users?.active ?? 0
  const appsTotal = statsQuery.data?.apps?.total ?? 0
  const signingKeysActive = statsQuery.data?.signingKeys?.active ?? 0

  const cards: StatItemProps[] = [
    {
      label: t('platformStats.cards.tenants.label'),
      value: statsQuery.data ? String(tenantsTotal) : '--',
      description: statsQuery.data
        ? t('platformStats.cards.tenants.description', { active: tenantsActive })
        : t('platformStats.cards.loadingDescription'),
      icon: <IconBuilding />,
    },
    {
      label: t('platformStats.cards.users.label'),
      value: statsQuery.data ? String(usersTotal) : '--',
      description: statsQuery.data
        ? t('platformStats.cards.users.description', { active: usersActive })
        : t('platformStats.cards.loadingDescription'),
      icon: <IconUsers />,
    },
    {
      label: t('platformStats.cards.apps.label'),
      value: statsQuery.data ? String(appsTotal) : '--',
      description: t('platformStats.cards.apps.description'),
      icon: <IconApps />,
    },
    {
      label: t('platformStats.cards.keys.label'),
      value: statsQuery.data ? String(signingKeysActive) : '--',
      description: t('platformStats.cards.keys.description'),
      icon: <IconKeySmall />,
    },
  ]

  return (
    <div className="mx-auto max-w-screen-xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('platformStats.title')}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">{t('platformStats.subtitle')}</p>
      </header>

      {statsQuery.isError ? (
        <section
          role="alert"
          aria-live="assertive"
          className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-500/40 dark:bg-red-950/20"
        >
          <p className="text-sm text-red-700 dark:text-red-300">{t('platformStats.loadError')}</p>
        </section>
      ) : null}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label={t('platformStats.sectionAria')}>
        {cards.map((card) => (
          <StatItem
            key={card.label}
            label={card.label}
            value={statsQuery.isLoading ? '...' : card.value}
            description={statsQuery.isLoading ? t('platformStats.loading') : card.description}
            icon={card.icon}
          />
        ))}
      </section>
    </div>
  )
}
