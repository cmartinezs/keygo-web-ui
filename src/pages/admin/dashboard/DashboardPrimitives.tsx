// ── Shared UI primitives for the admin dashboard ─────────────────────────────

// ── StatCard ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string
  value: string | number | null | undefined
  icon?: React.ReactNode
  iconColor?: string
  highlight?: boolean
  className?: string
}

export function StatCard({ label, value, icon, iconColor = 'text-indigo-500 dark:text-indigo-400', highlight, className = '' }: StatCardProps) {
  return (
    <div
      className={`bg-white dark:bg-slate-900 border rounded-xl p-5 flex flex-col gap-2 transition-colors
        ${highlight
          ? 'border-indigo-400 dark:border-indigo-500/60'
          : 'border-slate-200 dark:border-white/10 hover:border-indigo-400 dark:hover:border-indigo-500/40'}
        ${className}`}
    >
      <div className="flex items-center gap-1.5">
        {icon && <span className={iconColor}>{icon}</span>}
        <span className="text-[10px] font-semibold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest">
          {label}
        </span>
      </div>
      <span className="text-2xl font-bold text-slate-900 dark:text-white">
        {value != null
          ? value
          : <span className="text-slate-400 dark:text-slate-600 text-sm font-normal italic">—</span>}
      </span>
    </div>
  )
}

// ── BreakdownCard ─────────────────────────────────────────────────────────────

interface BreakdownCardProps {
  label: string
  icon: React.ReactNode
  total: number | undefined
  active: number | undefined
  pending: number | undefined
  suspended: number | undefined
}

export function BreakdownCard({ label, icon, total, active, pending, suspended }: BreakdownCardProps) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-5 flex flex-col gap-3 hover:border-indigo-400 dark:hover:border-indigo-500/40 transition-colors">
      <div className="flex items-center gap-2">
        <span className="text-indigo-500 dark:text-indigo-400">{icon}</span>
        <span className="text-[10px] font-semibold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest">
          {label}
        </span>
      </div>
      <span className="text-2xl font-bold text-slate-900 dark:text-white">{total ?? '—'}</span>
      <div className="flex flex-col gap-1 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-white/5 pt-2">
        <BreakdownRow label="Activos" value={active} color="text-emerald-500" />
        <BreakdownRow label="Pendientes" value={pending} color="text-amber-500" />
        <BreakdownRow label="Suspendidos" value={suspended} color="text-red-500" />
      </div>
    </div>
  )
}

interface BreakdownRowProps {
  label: string
  value: number | undefined
  color: string
}

function BreakdownRow({ label, value, color }: BreakdownRowProps) {
  return (
    <div className="flex justify-between items-center">
      <span>{label}</span>
      <span className={`font-semibold ${color}`}>{value ?? '—'}</span>
    </div>
  )
}

// ── SecurityCard ──────────────────────────────────────────────────────────────

interface SecurityCardProps {
  label: string
  icon: React.ReactNode
  total: number | undefined
  subLabel: string
  subValue: number | undefined
  subColor?: string
}

export function SecurityCard({ label, icon, total, subLabel, subValue, subColor = 'text-emerald-500' }: SecurityCardProps) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-5 flex flex-col gap-3 hover:border-indigo-400 dark:hover:border-indigo-500/40 transition-colors">
      <div className="flex items-center gap-2">
        <span className="text-indigo-500 dark:text-indigo-400">{icon}</span>
        <span className="text-[10px] font-semibold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest">
          {label}
        </span>
      </div>
      <span className="text-2xl font-bold text-slate-900 dark:text-white">{total ?? '—'}</span>
      <div className="flex justify-between items-center text-xs border-t border-slate-100 dark:border-white/5 pt-2 text-slate-500 dark:text-slate-400">
        <span>{subLabel}</span>
        <span className={`font-semibold ${subColor}`}>{subValue ?? '—'}</span>
      </div>
    </div>
  )
}

// ── SectionTitle ──────────────────────────────────────────────────────────────

interface SectionTitleProps {
  children: React.ReactNode
}

export function SectionTitle({ children }: SectionTitleProps) {
  return (
    <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">
      {children}
    </h2>
  )
}

// ── CardSkeleton ──────────────────────────────────────────────────────────────

export function CardSkeleton() {
  return (
    <div className="bg-slate-200 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-5 animate-pulse h-28" />
  )
}

// ── ErrorAlert ────────────────────────────────────────────────────────────────

interface ErrorAlertProps {
  message: string
}

export function ErrorAlert({ message }: ErrorAlertProps) {
  return (
    <div
      role="alert"
      className="bg-red-950/50 border border-red-500/30 text-red-300 text-sm rounded-xl px-5 py-4"
    >
      {message}
    </div>
  )
}
