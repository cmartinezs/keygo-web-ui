import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { SelectDropdown } from '@/shared/ui/SelectDropdown'
import { BILLING_QUERY_KEYS, cancelSubscription, getActiveSubscription, listInvoices } from '@/features/console/billing/api'
import { TENANT, CLIENT_ID } from '@/shared/api/client'
import { getAppApiError, getUserMessage } from '@/shared/api/errorNormalizer'
import { useCurrentUser } from '@/shared/hooks/useCurrentUser'
import type { SupportedLocale } from '@/shared/lib/i18n/constants'
import { useLocale } from '@/shared/lib/i18n/useLocale'
import {
  isRequestTimeout,
  notifyMutationTimeout,
  runGetWithRecovery,
} from '@/shared/lib/network/recovery'
import { IconShield, IconBell, IconLink, IconCreditCard, IconFlagChile, IconFlagUs, IconGlobe, IconRefresh, IconXCircle } from '@/shared/ui/icons'
import {
  NETWORK_MAX_RETRIES,
  NETWORK_REQUEST_TIMEOUT_MS,
  NETWORK_RETRY_DELAY_MS,
} from '@/shared/lib/config/network'
import { ChangePasswordForm } from '@/features/account/security/ChangePasswordForm'
import { ConnectionsPanel } from '@/features/account/connections/ConnectionsPanel'
import { NotificationsPreferencesForm } from '@/features/account/notifications/NotificationsPreferencesForm'

type SettingsTab = 'security' | 'notifications' | 'connections' | 'language' | 'billing'

interface SettingsTabOption {
  key: SettingsTab
  label: string
  icon: ReactNode
}

function formatCurrency(amount: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

const LOCALE_ICONS: Record<SupportedLocale, ReactNode> = {
  'es-CL': <IconFlagChile />,
  'en-US': <IconFlagUs />,
}

export default function AccountSettingsPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { locale, setLocale, resetToDeviceLocale, supportedLocales, isAutoDetected } = useLocale()
  const user = useCurrentUser()
  const [searchParams] = useSearchParams()
  const tenantSlug = user?.tenantSlug ?? TENANT
  const activeRole = user?.activeRole ?? null
  const canViewBilling = activeRole === 'keygo_tenant_admin'
  const settingsTabs: SettingsTabOption[] = useMemo(() => [
    { key: 'security', label: t('accountSettings.security'), icon: <IconShield /> },
    { key: 'notifications', label: t('accountSettings.notifications'), icon: <IconBell /> },
    { key: 'connections', label: t('accountSettings.connections'), icon: <IconLink /> },
    { key: 'language', label: t('accountSettings.languageTitle'), icon: <IconGlobe /> },
    { key: 'billing', label: t('accountSettings.billing'), icon: <IconCreditCard /> },
  ], [t])
  const initialTab = searchParams.get('tab')
  const normalizedInitialTab: SettingsTab = initialTab && settingsTabs.some((tab) => tab.key === initialTab)
    ? (initialTab as SettingsTab)
    : 'security'
  const [activeTab, setActiveTab] = useState<SettingsTab>(normalizedInitialTab)

  async function fetchSubscriptionWithRecovery(signal: AbortSignal) {
    return runGetWithRecovery({
      signal,
      label: 'suscripcion activa',
      timeoutMs: NETWORK_REQUEST_TIMEOUT_MS,
      retryDelayMs: NETWORK_RETRY_DELAY_MS,
      maxRetries: NETWORK_MAX_RETRIES,
      query: () => getActiveSubscription(tenantSlug, CLIENT_ID),
    })
  }

  async function fetchInvoicesWithRecovery(signal: AbortSignal) {
    return runGetWithRecovery({
      signal,
      label: 'facturas',
      timeoutMs: NETWORK_REQUEST_TIMEOUT_MS,
      retryDelayMs: NETWORK_RETRY_DELAY_MS,
      maxRetries: NETWORK_MAX_RETRIES,
      query: () => listInvoices(tenantSlug, CLIENT_ID),
    })
  }

  const subscriptionQuery = useQuery({
    queryKey: BILLING_QUERY_KEYS.subscription(tenantSlug, CLIENT_ID),
    queryFn: ({ signal }) => fetchSubscriptionWithRecovery(signal),
    enabled: canViewBilling,
    retry: false,
  })

  const invoicesQuery = useQuery({
    queryKey: BILLING_QUERY_KEYS.invoices(tenantSlug, CLIENT_ID),
    queryFn: ({ signal }) => fetchInvoicesWithRecovery(signal),
    enabled: canViewBilling,
    retry: false,
  })

  const invoicesPreview = useMemo(() => (invoicesQuery.data ?? []).slice(0, 5), [invoicesQuery.data])
  const cancelRenewalMutation = useMutation({
    mutationFn: () => cancelSubscription(tenantSlug, CLIENT_ID),
    onSuccess: async () => {
      toast.success(t('accountSettings.cancelRenewalSuccess'))
      await queryClient.invalidateQueries({
        queryKey: BILLING_QUERY_KEYS.subscription(tenantSlug, CLIENT_ID),
      })
      await queryClient.invalidateQueries({
        queryKey: BILLING_QUERY_KEYS.invoices(tenantSlug, CLIENT_ID),
      })
    },
    onError: (error) => {
      if (isRequestTimeout(error)) {
        notifyMutationTimeout('cancelacion de renovacion')
        return
      }
      toast.error(getUserMessage(getAppApiError(error)))
    },
  })
  const localeStatusLabel = isAutoDetected
    ? t('accountSettings.languageAuto')
    : t('accountSettings.languageManual')

  function formatDate(dateIso: string): string {
    return new Date(dateIso).toLocaleDateString(locale)
  }

  async function handleLanguageChange(nextLocale: SupportedLocale) {
    await setLocale(nextLocale)
    toast.success(t('accountSettings.saveLocalOnly'))
  }

  async function handleResetToDeviceLocale() {
    await resetToDeviceLocale()
    toast.success(t('accountSettings.languageAuto'))
  }

  function handleCancelRenewal() {
    if (!subscriptionQuery.data || cancelRenewalMutation.isPending) return

    const confirmed = window.confirm(t('accountSettings.cancelRenewalConfirm'))
    if (!confirmed) return

    cancelRenewalMutation.mutate()
  }

  return (
    <div className="mx-auto max-w-screen-xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('accountSettings.title')}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {t('accountSettings.subtitle')}
        </p>
      </header>

      <section aria-label={t('accountSettings.tabsLabel')} className="rounded-xl border border-slate-200 bg-white p-2 dark:border-white/10 dark:bg-slate-900">
        <div role="tablist" aria-label={t('accountSettings.tabsAria')} className="flex flex-wrap gap-2">
          {settingsTabs.map((tab) => (
            <button
              key={tab.key}
              id={`settings-tab-${tab.key}`}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.key}
              aria-controls={`settings-panel-${tab.key}`}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${
                activeTab === tab.key
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white'
              }`}
            >
              <span className={activeTab === tab.key ? 'text-white' : ''}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      <section
        id="settings-panel-security"
        role="tabpanel"
        aria-labelledby="settings-tab-security"
        hidden={activeTab !== 'security'}
        className="space-y-4"
      >
        <ChangePasswordForm />
      </section>

      <section
        id="settings-panel-notifications"
        role="tabpanel"
        aria-labelledby="settings-tab-notifications"
        hidden={activeTab !== 'notifications'}
        className="space-y-4"
      >
        <NotificationsPreferencesForm />
      </section>

      <section
        id="settings-panel-connections"
        role="tabpanel"
        aria-labelledby="settings-tab-connections"
        hidden={activeTab !== 'connections'}
        className="space-y-4"
      >
        <ConnectionsPanel />
      </section>

      <section
        id="settings-panel-language"
        role="tabpanel"
        aria-labelledby="settings-tab-language"
        hidden={activeTab !== 'language'}
        className="space-y-4"
      >
        <article className="rounded-xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">{t('accountSettings.languageTitle')}</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{t('accountSettings.languageDescription')}</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t('accountSettings.languageAutoHelper')}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
              {t('common.language')}
            </span>
            <SelectDropdown
              value={locale as SupportedLocale}
              onChange={(nextLocale) => {
                void handleLanguageChange(nextLocale)
              }}
              options={supportedLocales.map((option) => ({
                value: option.value as SupportedLocale,
                label: option.label,
                icon: LOCALE_ICONS[option.value as SupportedLocale],
              }))}
              label={t('common.language')}
              icon={LOCALE_ICONS[locale as SupportedLocale]}
              ariaLabel={t('common.language')}
            />
            <button
              type="button"
              onClick={() => {
                void handleResetToDeviceLocale()
              }}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-white/20 dark:text-slate-200 dark:hover:bg-white/10"
            >
              <IconRefresh className="h-4 w-4 shrink-0" aria-hidden="true" />
              {t('accountSettings.languageAuto')}
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{localeStatusLabel}</p>
        </article>
      </section>

      <section
        id="settings-panel-billing"
        role="tabpanel"
        aria-labelledby="settings-tab-billing"
        hidden={activeTab !== 'billing'}
        className="space-y-4"
      >
        {!canViewBilling ? (
          <article className="rounded-xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">{t('accountSettings.billing')}</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              {t('accountSettings.billingRestricted')}
            </p>
          </article>
        ) : (
          <>
            {subscriptionQuery.isLoading ? (
              <div role="status" aria-live="polite" className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500 dark:border-white/10 dark:bg-slate-900 dark:text-slate-400">
                {t('common.loadingSubscription')}
              </div>
            ) : null}

            {subscriptionQuery.isError ? (
              <div role="alert" className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
                {t('accountSettings.subscriptionError')}
              </div>
            ) : null}

            {!subscriptionQuery.isLoading && !subscriptionQuery.isError && subscriptionQuery.data ? (
              <article className="rounded-xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900">
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">{t('accountSettings.currentSubscription')}</h2>
                <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{t('common.status')}</dt>
                    <dd className="text-sm font-medium text-slate-900 dark:text-white">{subscriptionQuery.data.status}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{t('accountSettings.autoRenew')}</dt>
                    <dd className="text-sm font-medium text-slate-900 dark:text-white">{subscriptionQuery.data.auto_renew ? t('accountSettings.autoRenewActive') : t('accountSettings.autoRenewInactive')}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{t('accountSettings.period')}</dt>
                    <dd className="text-sm font-medium text-slate-900 dark:text-white">
                      {formatDate(subscriptionQuery.data.current_period_start)} - {formatDate(subscriptionQuery.data.current_period_end)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{t('accountSettings.nextBilling')}</dt>
                    <dd className="text-sm font-medium text-slate-900 dark:text-white">
                      {subscriptionQuery.data.next_billing_at
                        ? formatDate(subscriptionQuery.data.next_billing_at)
                        : t('common.notDefined')}
                    </dd>
                  </div>
                </dl>

                {subscriptionQuery.data.auto_renew && !subscriptionQuery.data.cancel_at_period_end ? (
                  <div className="mt-4 border-t border-slate-200 pt-4 dark:border-white/10">
                    <p className="mb-3 text-sm text-slate-600 dark:text-slate-400">
                      {t('accountSettings.cancelRenewalHint')}
                    </p>
                    <button
                      type="button"
                      onClick={handleCancelRenewal}
                      disabled={cancelRenewalMutation.isPending}
                      aria-busy={cancelRenewalMutation.isPending}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-500/40 dark:text-red-300 dark:hover:bg-red-500/10"
                    >
                      <IconXCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                      {cancelRenewalMutation.isPending
                        ? t('accountSettings.cancelRenewalLoading')
                        : t('accountSettings.cancelRenewalAction')}
                    </button>
                  </div>
                ) : null}

                {subscriptionQuery.data.cancel_at_period_end ? (
                  <p role="status" aria-live="polite" className="mt-4 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300">
                    {t('accountSettings.cancelRenewalScheduled')}
                  </p>
                ) : null}
              </article>
            ) : null}

            {invoicesQuery.isLoading ? (
              <div role="status" aria-live="polite" className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500 dark:border-white/10 dark:bg-slate-900 dark:text-slate-400">
                {t('common.loadingInvoices')}
              </div>
            ) : null}

            {invoicesQuery.isError ? (
              <div role="alert" className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
                {t('accountSettings.invoicesError')}
              </div>
            ) : null}

            {!invoicesQuery.isLoading && !invoicesQuery.isError ? (
              <article className="rounded-xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900">
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">{t('accountSettings.recentInvoices')}</h2>
                {invoicesPreview.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">{t('accountSettings.invoicesEmpty')}</p>
                ) : (
                  <ul className="mt-3 divide-y divide-slate-200 dark:divide-white/10">
                    {invoicesPreview.map((invoice) => (
                      <li key={invoice.id} className="flex items-center justify-between gap-3 py-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{invoice.invoice_number}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {t('accountSettings.issueDate')}: {formatDate(invoice.issue_date)} - {t('accountSettings.dueDate')}: {formatDate(invoice.due_date)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">
                            {formatCurrency(invoice.total, invoice.currency, locale)}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{invoice.status}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            ) : null}
          </>
        )}
      </section>
    </div>
  )
}
