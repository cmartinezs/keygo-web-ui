import type { PlatformDashboardData } from '@/shared/types/dashboard'
import { useTranslation } from 'react-i18next'
import { IconServer, IconTag, IconGlobe, IconKey } from '@/shared/ui/icons'
import { StatCard } from './DashboardPrimitives'

// ── Component ─────────────────────────────────────────────────────────────────

interface ServiceStatusRowProps {
  service: PlatformDashboardData['service'] | undefined
  activeSigningKey: PlatformDashboardData['security']['active_signing_key'] | undefined
}

export function ServiceStatusRow({ service, activeSigningKey }: ServiceStatusRowProps) {
  const { t } = useTranslation()

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <StatCard label={t('adminDashboard.serviceRow.service')} value={service?.name} icon={<IconServer className="w-4 h-4" aria-hidden="true" />} highlight />
      <StatCard label={t('adminDashboard.serviceRow.environment')} value={service?.environment} icon={<IconGlobe className="w-4 h-4" aria-hidden="true" />} highlight />
      <StatCard label={t('adminDashboard.serviceRow.version')} value={service?.version} icon={<IconTag className="w-4 h-4" aria-hidden="true" />} highlight />
      <div className="bg-white dark:bg-slate-900 border border-indigo-400 dark:border-indigo-500/60 rounded-xl p-5 flex flex-col gap-2 transition-colors">
        <div className="flex items-center gap-1.5">
          <span className="text-amber-500"><IconKey className="w-4 h-4" aria-hidden="true" /></span>
          <span className="text-[10px] font-semibold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest">
            {t('adminDashboard.serviceRow.activeSigningKey')}
          </span>
        </div>
        {activeSigningKey
          ? (
            <>
              <span className="text-sm font-mono font-semibold text-slate-900 dark:text-white truncate">
                {activeSigningKey.kid}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {t('adminDashboard.serviceRow.keyMeta', {
                  algorithm: activeSigningKey.algorithm,
                  days: activeSigningKey.age_days,
                })}
              </span>
            </>
          )
          : <span className="text-slate-400 dark:text-slate-600 text-sm font-normal italic">—</span>}
      </div>
    </div>
  )
}


