import type { SecuritySummary } from '@/types/dashboard'
import { useTranslation } from 'react-i18next'
import { IconClock, IconRefresh, IconCode, IconBell } from '@/components/icons'
import { SecurityCard } from './DashboardPrimitives'

// ── Component ─────────────────────────────────────────────────────────────────

interface SecurityRowProps {
  security: SecuritySummary | undefined
}

export function SecurityRow({ security }: SecurityRowProps) {
  const { t } = useTranslation()
  const c = security?.counts
  const alertTotal = security?.alerts.length
  const criticalAlerts = security?.alerts.filter((a) => a.level === 'CRITICAL').length

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <SecurityCard
        label={t('adminDashboard.securityRow.sessions')}
        icon={<IconClock className="w-4 h-4" aria-hidden="true" />}
        total={c?.active_sessions}
        subLabel={t('adminDashboard.securityRow.expired')}
        subValue={c?.expired_sessions}
        subColor="text-slate-400"
      />
      <SecurityCard
        label={t('adminDashboard.securityRow.refreshTokens')}
        icon={<IconRefresh className="w-4 h-4" aria-hidden="true" />}
        total={c?.active_refresh_tokens}
        subLabel={t('adminDashboard.securityRow.revoked')}
        subValue={c?.revoked_refresh_tokens}
        subColor="text-red-500"
      />
      <SecurityCard
        label={t('adminDashboard.securityRow.authCodes')}
        icon={<IconCode className="w-4 h-4" aria-hidden="true" />}
        total={c?.pending_authorization_codes}
        subLabel={t('adminDashboard.securityRow.used')}
        subValue={c?.used_authorization_codes}
        subColor="text-slate-400"
      />
      <SecurityCard
        label={t('adminDashboard.securityRow.alerts')}
        icon={<IconBell className="w-4 h-4" aria-hidden="true" />}
        total={alertTotal}
        subLabel={t('adminDashboard.securityRow.critical')}
        subValue={criticalAlerts}
        subColor="text-red-500"
      />
    </div>
  )
}
