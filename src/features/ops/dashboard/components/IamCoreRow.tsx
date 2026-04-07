import type { CountSummary, AppSummary, MembershipSummary } from '@/shared/types/dashboard'
import { useTranslation } from 'react-i18next'
import { IconBuilding, IconUsers, IconApps, IconLink } from '@/shared/ui/icons'
import { BreakdownCard } from './DashboardPrimitives'

// ── Component ─────────────────────────────────────────────────────────────────

interface IamCoreRowProps {
  tenants: CountSummary | undefined
  users: CountSummary | undefined
  apps: AppSummary | undefined
  memberships: MembershipSummary | undefined
}

export function IamCoreRow({ tenants, users, apps, memberships }: IamCoreRowProps) {
  const { t } = useTranslation()

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <BreakdownCard
        label={t('adminDashboard.iamCards.tenants')}
        icon={<IconBuilding className="w-4 h-4" aria-hidden="true" />}
        total={tenants?.total}
        active={tenants?.active}
        pending={tenants?.pending}
        suspended={tenants?.suspended}
      />
      <BreakdownCard
        label={t('adminDashboard.iamCards.users')}
        icon={<IconUsers className="w-4 h-4" aria-hidden="true" />}
        total={users?.total}
        active={users?.active}
        pending={users?.pending}
        suspended={users?.suspended}
      />
      <BreakdownCard
        label={t('adminDashboard.iamCards.apps')}
        icon={<IconApps className="w-4 h-4" aria-hidden="true" />}
        total={apps?.total}
        active={apps?.active}
        pending={apps?.pending}
        suspended={apps?.suspended}
      />
      <BreakdownCard
        label={t('adminDashboard.iamCards.memberships')}
        icon={<IconLink className="w-4 h-4" aria-hidden="true" />}
        total={memberships?.total}
        active={memberships?.active}
        pending={memberships?.pending}
        suspended={memberships?.suspended}
      />
    </div>
  )
}
