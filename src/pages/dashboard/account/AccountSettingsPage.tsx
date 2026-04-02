import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { BILLING_QUERY_KEYS, getActiveSubscription, listInvoices } from '@/api/billing'
import { TENANT, CLIENT_ID } from '@/api/client'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useLocale } from '@/i18n/useLocale'
import { runGetWithRecovery } from '@/lib/network/recovery'
import {
  NETWORK_MAX_RETRIES,
  NETWORK_REQUEST_TIMEOUT_MS,
  NETWORK_RETRY_DELAY_MS,
} from '@/config/network'

type SettingsTab = 'security' | 'notifications' | 'connections' | 'billing'

interface SettingsTabOption {
  key: SettingsTab
  label: string
}

function PendingFeatureCard({
  title,
  body,
  requiredEndpoint,
  badgeLabel,
}: {
  title: string
  body: string
  requiredEndpoint: string
  badgeLabel: string
}) {
  return (
    <article className="rounded-xl border border-dashed border-slate-300 bg-white p-4 dark:border-white/20 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
          {badgeLabel}
        </span>
      </div>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{body}</p>
      <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
        Endpoint requerido: <span className="font-mono">{requiredEndpoint}</span>
      </p>
    </article>
  )
}

function formatCurrency(amount: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function AccountSettingsPage() {
  const { t } = useTranslation()
  const { locale, setLocale, resetToDeviceLocale, supportedLocales, isAutoDetected } = useLocale()
  const user = useCurrentUser()
  const [searchParams] = useSearchParams()
  const tenantSlug = user?.tenantSlug ?? TENANT
  const activeRole = user?.activeRole ?? null
  const canViewBilling = activeRole === 'ADMIN_TENANT'
  const settingsTabs: SettingsTabOption[] = useMemo(() => [
    { key: 'security', label: t('accountSettings.security') },
    { key: 'notifications', label: t('accountSettings.notifications') },
    { key: 'connections', label: t('accountSettings.connections') },
    { key: 'billing', label: t('accountSettings.billing') },
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
  const localeStatusLabel = isAutoDetected
    ? t('accountSettings.languageAuto')
    : t('accountSettings.languageManual')

  function formatDate(dateIso: string): string {
    return new Date(dateIso).toLocaleDateString(locale)
  }

  async function handleLanguageChange(nextLocale: string) {
    await setLocale(nextLocale)
    toast.success(t('accountSettings.saveLocalOnly'))
  }

  async function handleResetToDeviceLocale() {
    await resetToDeviceLocale()
    toast.success(t('accountSettings.languageAuto'))
  }

  return (
    <div className="mx-auto max-w-screen-xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('accountSettings.title')}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {t('accountSettings.subtitle')}
        </p>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900" aria-label={t('accountSettings.languageTitle')}>
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">{t('accountSettings.languageTitle')}</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{t('accountSettings.languageDescription')}</p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label htmlFor="interface-language" className="text-sm font-medium text-slate-700 dark:text-slate-200">
            {t('common.language')}
          </label>
          <select
            id="interface-language"
            value={locale}
            onChange={(event) => {
              void handleLanguageChange(event.target.value)
            }}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-white/20 dark:bg-slate-950 dark:text-slate-100"
          >
            {supportedLocales.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => {
              void handleResetToDeviceLocale()
            }}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-white/20 dark:text-slate-200 dark:hover:bg-white/10"
          >
            {t('accountSettings.languageAuto')}
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{localeStatusLabel}</p>
      </section>

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
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${
                activeTab === tab.key
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white'
              }`}
            >
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
        <PendingFeatureCard
          title="Cambio de contrasena"
          body="Permite actualizar la contrasena de la cuenta con validacion de politica y verificacion de contrasena actual."
          requiredEndpoint="POST /api/v1/tenants/{tenantSlug}/account/change-password"
          badgeLabel={t('common.comingSoon')}
        />
        <PendingFeatureCard
          title="Sesiones activas"
          body="Lista de dispositivos y capacidad de cierre remoto de sesiones para proteccion de cuenta."
          requiredEndpoint="GET/DELETE /api/v1/tenants/{tenantSlug}/account/sessions[/sessionId]"
          badgeLabel={t('common.comingSoon')}
        />
      </section>

      <section
        id="settings-panel-notifications"
        role="tabpanel"
        aria-labelledby="settings-tab-notifications"
        hidden={activeTab !== 'notifications'}
        className="space-y-4"
      >
        <PendingFeatureCard
          title="Preferencias de notificaciones"
          body="Configura alertas de seguridad, facturacion y novedades por canal (email e in-app)."
          requiredEndpoint="GET/PATCH /api/v1/tenants/{tenantSlug}/account/notification-preferences"
          badgeLabel={t('common.comingSoon')}
        />
      </section>

      <section
        id="settings-panel-connections"
        role="tabpanel"
        aria-labelledby="settings-tab-connections"
        hidden={activeTab !== 'connections'}
        className="space-y-4"
      >
        <PendingFeatureCard
          title="Conexiones externas"
          body="Gestiona proveedores vinculados para login y desconexion de cuentas externas."
          requiredEndpoint="GET/POST/DELETE /api/v1/tenants/{tenantSlug}/account/connections"
          badgeLabel={t('common.comingSoon')}
        />
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
