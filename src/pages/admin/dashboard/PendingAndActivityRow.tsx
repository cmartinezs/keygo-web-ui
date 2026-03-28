import type { PendingActionItem, ActivityItem } from '@/types/dashboard'

// ── Pending Actions ───────────────────────────────────────────────────────────

interface PendingActionsListProps {
  items: PendingActionItem[] | undefined
}

function PendingActionRow({ item }: { item: PendingActionItem }) {
  return (
    <li className="flex items-center gap-3 py-2.5 border-b border-slate-100 dark:border-white/5 last:border-0">
      <span className="mt-0.5 w-2 h-2 rounded-full bg-amber-400 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{item.type}</p>
      </div>
      <span className="text-sm font-bold text-amber-600 dark:text-amber-400 shrink-0">{item.count}</span>
    </li>
  )
}

function PendingActionsList({ items }: PendingActionsListProps) {
  if (!items || items.length === 0) {
    return (
      <p className="text-sm text-slate-400 dark:text-slate-500 py-6 text-center italic">
        Sin pendientes
      </p>
    )
  }
  return (
    <ul>
      {items.map((item) => (
        <PendingActionRow key={item.type} item={item} />
      ))}
    </ul>
  )
}

// ── Recent Activity ───────────────────────────────────────────────────────────

interface RecentActivityListProps {
  items: ActivityItem[] | undefined
}

function ActivityRow({ item }: { item: ActivityItem }) {
  return (
    <li className="flex items-start gap-3 py-2.5 border-b border-slate-100 dark:border-white/5 last:border-0">
      <span className="mt-0.5 w-2 h-2 rounded-full bg-indigo-400 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{item.label}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{item.occurred_at}</p>
      </div>
    </li>
  )
}

function RecentActivityList({ items }: RecentActivityListProps) {
  if (!items || items.length === 0) {
    return (
      <p className="text-sm text-slate-400 dark:text-slate-500 py-6 text-center italic">
        Sin actividad reciente
      </p>
    )
  }
  return (
    <ul>
      {items.map((item, i) => (
        <ActivityRow key={`${item.type}-${i}`} item={item} />
      ))}
    </ul>
  )
}

// ── Combined Row ──────────────────────────────────────────────────────────────

interface PendingAndActivityRowProps {
  pendingActions: PendingActionItem[] | undefined
  recentActivity: ActivityItem[] | undefined
}

export function PendingAndActivityRow({ pendingActions, recentActivity }: PendingAndActivityRowProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-3">Pendientes de gestión</h3>
        <PendingActionsList items={pendingActions} />
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-3">Actividad reciente</h3>
        <RecentActivityList items={recentActivity} />
      </div>
    </div>
  )
}
