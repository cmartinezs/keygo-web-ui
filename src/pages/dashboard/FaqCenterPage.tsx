import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useTokenStore } from '@/auth/tokenStore'
import { resolvePrimaryRole } from '@/types/roles'
import type { AppRole } from '@/types/roles'

interface FaqItem {
  key: string
}

interface FaqTab {
  key: string
  labelKey: string
  items: FaqItem[]
}

const FAQ_TABS_BY_ROLE: Record<AppRole, FaqTab[]> = {
  ADMIN: [
    {
      key: 'platform',
      labelKey: 'dashboard.platform',
      items: [{ key: 'platformOverview' }, { key: 'platformTenants' }, { key: 'platformAppsUsers' }],
    },
    {
      key: 'accessAudit',
      labelKey: 'dashboard.accessAndAudit',
      items: [{ key: 'accessAuditOverview' }, { key: 'accessAuditDifference' }],
    },
    {
      key: 'security',
      labelKey: 'dashboard.security',
      items: [{ key: 'securitySessions' }, { key: 'securityTokens' }],
    },
    {
      key: 'system',
      labelKey: 'dashboard.system',
      items: [{ key: 'systemApi' }, { key: 'systemSlowLoading' }],
    },
    {
      key: 'account',
      labelKey: 'dashboard.account',
      items: [{ key: 'accountWhereChangeLanguage' }, { key: 'accountLanguageAutoDetection' }, { key: 'accountLanguageBrowserConfig' }],
    },
  ],
  ADMIN_TENANT: [
    {
      key: 'myOrganization',
      labelKey: 'dashboard.myOrganization',
      items: [{ key: 'organizationOverview' }, { key: 'organizationUsersApps' }],
    },
    {
      key: 'access',
      labelKey: 'dashboard.access',
      items: [{ key: 'accessMemberships' }, { key: 'accessSessions' }],
    },
    {
      key: 'account',
      labelKey: 'dashboard.account',
      items: [{ key: 'accountWhereChangeLanguage' }, { key: 'accountLanguageAutoDetection' }, { key: 'accountLanguageBrowserConfig' }],
    },
  ],
  USER_TENANT: [
    {
      key: 'home',
      labelKey: 'dashboard.home',
      items: [{ key: 'homeOverview' }, { key: 'homeMyAccess' }],
    },
    {
      key: 'account',
      labelKey: 'dashboard.account',
      items: [{ key: 'accountWhereChangeLanguage' }, { key: 'accountLanguageAutoDetection' }, { key: 'accountLanguageBrowserConfig' }],
    },
  ],
}

export default function FaqCenterPage() {
  const { t } = useTranslation()
  const roles = useTokenStore((state) => state.roles)
  const activeRole = useTokenStore((state) => state.activeRole)

  const resolvedRole = useMemo(
    () => (activeRole ?? resolvePrimaryRole(roles) ?? 'USER_TENANT') as AppRole,
    [activeRole, roles],
  )

  const tabs = FAQ_TABS_BY_ROLE[resolvedRole]
  const [selectedTab, setSelectedTab] = useState<string>(tabs[0]?.key ?? 'account')
  const [searchTerm, setSearchTerm] = useState('')
  const activeTab = tabs.some((tab) => tab.key === selectedTab) ? selectedTab : (tabs[0]?.key ?? 'account')
  const normalizedSearchTerm = searchTerm.trim().toLocaleLowerCase()

  const filteredTabItems = useMemo(() => {
    const tabItemsMap = new Map<string, FaqItem[]>()

    for (const tab of tabs) {
      const filteredItems = tab.items.filter((item) => {
        if (!normalizedSearchTerm) return true

        const question = t(`systemFaq.items.${item.key}.question`).toLocaleLowerCase()
        const answer = t(`systemFaq.items.${item.key}.answer`).toLocaleLowerCase()
        return question.includes(normalizedSearchTerm) || answer.includes(normalizedSearchTerm)
      })

      tabItemsMap.set(tab.key, filteredItems)
    }

    return tabItemsMap
  }, [normalizedSearchTerm, t, tabs])

  return (
    <div className="mx-auto max-w-screen-xl space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('systemFaq.title')}</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">{t('systemFaq.subtitle')}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{t('systemFaq.orderNote')}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{t('systemFaq.growthNote')}</p>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900" aria-label={t('systemFaq.tabsAria')}>
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">{t('systemFaq.sectionTitle')}</h2>

        <div className="mt-4">
          <label htmlFor="faq-search" className="sr-only">
            {t('systemFaq.searchLabel')}
          </label>
          <input
            id="faq-search"
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder={t('systemFaq.searchPlaceholder')}
            aria-describedby="faq-search-help"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-white/20 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
          <p id="faq-search-help" className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            {t('systemFaq.searchHelp')}
          </p>
        </div>

        <div role="tablist" aria-label={t('systemFaq.tabsAria')} className="mt-4 flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              id={`faq-tab-${tab.key}`}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.key}
              aria-controls={`faq-panel-${tab.key}`}
              onClick={() => setSelectedTab(tab.key)}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${
                activeTab === tab.key
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white'
              }`}
            >
              {t(tab.labelKey)}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-4">
          {tabs.map((tab) => (
            <section
              key={tab.key}
              id={`faq-panel-${tab.key}`}
              role="tabpanel"
              aria-labelledby={`faq-tab-${tab.key}`}
              hidden={activeTab !== tab.key}
              aria-label={t(tab.labelKey)}
              className="space-y-2"
            >
              {(filteredTabItems.get(tab.key) ?? []).length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-300 px-3 py-3 text-sm text-slate-600 dark:border-white/20 dark:text-slate-400" role="status" aria-live="polite">
                  {t('systemFaq.noResults')}
                </div>
              ) : (
                (filteredTabItems.get(tab.key) ?? []).map((item) => (
                  <details key={item.key} className="rounded-lg border border-slate-200 px-3 py-2 dark:border-white/10">
                    <summary className="cursor-pointer list-none text-sm font-medium text-slate-800 marker:hidden dark:text-slate-100">
                      {t(`systemFaq.items.${item.key}.question`)}
                    </summary>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                      {t(`systemFaq.items.${item.key}.answer`)}
                    </p>
                  </details>
                ))
              )}
            </section>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link
          to="/dashboard/account/settings"
          className="inline-flex items-center rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-white/20 dark:text-slate-200 dark:hover:bg-white/10"
        >
          {t('systemFaq.backToSettings')}
        </Link>
      </div>
    </div>
  )
}