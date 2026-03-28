import type { SecuritySummary } from '@/types/dashboard'
import { SecurityCard } from './DashboardPrimitives'

// ── Icons ─────────────────────────────────────────────────────────────────────

function IconClock() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function IconRefresh() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  )
}

function IconCode() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
  )
}

function IconBell() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

interface SecurityRowProps {
  security: SecuritySummary | undefined
}

export function SecurityRow({ security }: SecurityRowProps) {
  const c = security?.counts
  const alertTotal = security?.alerts.length
  const criticalAlerts = security?.alerts.filter((a) => a.level === 'CRITICAL').length

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <SecurityCard
        label="Sesiones"
        icon={<IconClock />}
        total={c?.active_sessions}
        subLabel="Expiradas"
        subValue={c?.expired_sessions}
        subColor="text-slate-400"
      />
      <SecurityCard
        label="Refresh Tokens"
        icon={<IconRefresh />}
        total={c?.active_refresh_tokens}
        subLabel="Revocados"
        subValue={c?.revoked_refresh_tokens}
        subColor="text-red-500"
      />
      <SecurityCard
        label="Auth Codes"
        icon={<IconCode />}
        total={c?.pending_authorization_codes}
        subLabel="Usados"
        subValue={c?.used_authorization_codes}
        subColor="text-slate-400"
      />
      <SecurityCard
        label="Alertas"
        icon={<IconBell />}
        total={alertTotal}
        subLabel="Críticas"
        subValue={criticalAlerts}
        subColor="text-red-500"
      />
    </div>
  )
}
