import type { CountSummary, AppSummary, MembershipSummary } from '@/types/dashboard'
import { BreakdownCard } from './DashboardPrimitives'

// ── Icons ─────────────────────────────────────────────────────────────────────

function IconBuilding() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M9 21V7l6-4v18M9 7H5a1 1 0 00-1 1v13M15 11h2M15 15h2M9 11H7M9 15H7" />
    </svg>
  )
}

function IconUsers() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  )
}

function IconApps() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  )
}

function IconLink() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

interface IamCoreRowProps {
  tenants: CountSummary | undefined
  users: CountSummary | undefined
  apps: AppSummary | undefined
  memberships: MembershipSummary | undefined
}

export function IamCoreRow({ tenants, users, apps, memberships }: IamCoreRowProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <BreakdownCard
        label="Tenants"
        icon={<IconBuilding />}
        total={tenants?.total}
        active={tenants?.active}
        pending={tenants?.pending}
        suspended={tenants?.suspended}
      />
      <BreakdownCard
        label="Usuarios"
        icon={<IconUsers />}
        total={users?.total}
        active={users?.active}
        pending={users?.pending}
        suspended={users?.suspended}
      />
      <BreakdownCard
        label="Apps"
        icon={<IconApps />}
        total={apps?.total}
        active={apps?.active}
        pending={apps?.pending}
        suspended={apps?.suspended}
      />
      <BreakdownCard
        label="Memberships"
        icon={<IconLink />}
        total={memberships?.total}
        active={memberships?.active}
        pending={memberships?.pending}
        suspended={memberships?.suspended}
      />
    </div>
  )
}
