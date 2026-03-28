import type { RankEntry, RankingSummary } from '@/types/dashboard'

// ── Top Tenants ───────────────────────────────────────────────────────────────

interface RankRowProps {
  rank: number
  entry: RankEntry
  countLabel: string
}

function RankRow({ rank, entry, countLabel }: RankRowProps) {
  return (
    <li className="flex items-center gap-3 py-2.5 border-b border-slate-100 dark:border-white/5 last:border-0">
      <span className="w-6 h-6 flex items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold shrink-0">
        {rank}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{entry.name}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate">
          {entry.tenant_slug ?? entry.slug}
        </p>
      </div>
      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 shrink-0">
        {entry.count.toLocaleString()}
        <span className="text-xs text-slate-400 dark:text-slate-500 font-normal ml-1">{countLabel}</span>
      </span>
    </li>
  )
}

// ── Combined Row ──────────────────────────────────────────────────────────────

interface RankingsRowProps {
  rankings: RankingSummary | undefined
}

function EmptyRanking() {
  return (
    <p className="text-sm text-slate-400 dark:text-slate-500 py-6 text-center italic">Sin datos</p>
  )
}

export function RankingsRow({ rankings }: RankingsRowProps) {
  const tenants = rankings?.top_tenants_by_users
  const apps = rankings?.top_apps_by_memberships

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-3">Top tenants por usuarios</h3>
        {!tenants || tenants.length === 0
          ? <EmptyRanking />
          : (
            <ul>
              {tenants.map((e, i) => (
                <RankRow key={e.slug} rank={i + 1} entry={e} countLabel="users" />
              ))}
            </ul>
          )}
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-3">Top apps por memberships</h3>
        {!apps || apps.length === 0
          ? <EmptyRanking />
          : (
            <ul>
              {apps.map((e, i) => (
                <RankRow key={`${e.tenant_slug}-${e.slug}`} rank={i + 1} entry={e} countLabel="members" />
              ))}
            </ul>
          )}
      </div>
    </div>
  )
}
