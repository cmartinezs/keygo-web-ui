import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { BILLING_QUERY_KEYS, getActiveSubscription, listInvoices } from '@/api/billing'
import { TENANT, CLIENT_ID } from '@/api/client'
import { useCurrentUser } from '@/hooks/useCurrentUser'
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

const SETTINGS_TABS: SettingsTabOption[] = [
  { key: 'security', label: 'Seguridad' },
  { key: 'notifications', label: 'Notificaciones' },
  { key: 'connections', label: 'Conexiones' },
  { key: 'billing', label: 'Facturacion' },
]

function PendingFeatureCard({
  title,
  body,
  requiredEndpoint,
}: {
  title: string
  body: string
  requiredEndpoint: string
}) {
  return (
    <article className="rounded-xl border border-dashed border-slate-300 bg-white p-4 dark:border-white/20 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
          Proximamente
        </span>
      </div>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{body}</p>
      <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
        Endpoint requerido: <span className="font-mono">{requiredEndpoint}</span>
      </p>
    </article>
  )
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function AccountSettingsPage() {
  const user = useCurrentUser()
  const [searchParams] = useSearchParams()
  const tenantSlug = user?.tenantSlug ?? TENANT
  const activeRole = user?.activeRole ?? null
  const canViewBilling = activeRole === 'ADMIN_TENANT'
  const initialTab = searchParams.get('tab')
  const normalizedInitialTab: SettingsTab = initialTab && SETTINGS_TABS.some((tab) => tab.key === initialTab)
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

  return (
    <div className="mx-auto max-w-screen-xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Configuracion de cuenta</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Administra seguridad, preferencias personales y estado de facturacion.
        </p>
      </header>

      <section aria-label="Secciones de configuracion" className="rounded-xl border border-slate-200 bg-white p-2 dark:border-white/10 dark:bg-slate-900">
        <div role="tablist" aria-label="Tabs de configuracion de cuenta" className="flex flex-wrap gap-2">
          {SETTINGS_TABS.map((tab) => (
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
        />
        <PendingFeatureCard
          title="Sesiones activas"
          body="Lista de dispositivos y capacidad de cierre remoto de sesiones para proteccion de cuenta."
          requiredEndpoint="GET/DELETE /api/v1/tenants/{tenantSlug}/account/sessions[/sessionId]"
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
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Facturacion</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Esta seccion esta disponible para roles con permisos de administracion del tenant.
            </p>
          </article>
        ) : (
          <>
            {subscriptionQuery.isLoading ? (
              <div role="status" aria-live="polite" className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500 dark:border-white/10 dark:bg-slate-900 dark:text-slate-400">
                Cargando suscripcion...
              </div>
            ) : null}

            {subscriptionQuery.isError ? (
              <div role="alert" className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
                No fue posible cargar la suscripcion activa.
              </div>
            ) : null}

            {!subscriptionQuery.isLoading && !subscriptionQuery.isError && subscriptionQuery.data ? (
              <article className="rounded-xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900">
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">Suscripcion actual</h2>
                <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Estado</dt>
                    <dd className="text-sm font-medium text-slate-900 dark:text-white">{subscriptionQuery.data.status}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Renovacion automatica</dt>
                    <dd className="text-sm font-medium text-slate-900 dark:text-white">{subscriptionQuery.data.auto_renew ? 'Activa' : 'Inactiva'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Periodo actual</dt>
                    <dd className="text-sm font-medium text-slate-900 dark:text-white">
                      {new Date(subscriptionQuery.data.current_period_start).toLocaleDateString('es-CL')} - {new Date(subscriptionQuery.data.current_period_end).toLocaleDateString('es-CL')}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Siguiente cobro</dt>
                    <dd className="text-sm font-medium text-slate-900 dark:text-white">
                      {subscriptionQuery.data.next_billing_at
                        ? new Date(subscriptionQuery.data.next_billing_at).toLocaleDateString('es-CL')
                        : 'No definido'}
                    </dd>
                  </div>
                </dl>
              </article>
            ) : null}

            {invoicesQuery.isLoading ? (
              <div role="status" aria-live="polite" className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500 dark:border-white/10 dark:bg-slate-900 dark:text-slate-400">
                Cargando facturas...
              </div>
            ) : null}

            {invoicesQuery.isError ? (
              <div role="alert" className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
                No fue posible cargar las facturas.
              </div>
            ) : null}

            {!invoicesQuery.isLoading && !invoicesQuery.isError ? (
              <article className="rounded-xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900">
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">Facturas recientes</h2>
                {invoicesPreview.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">No hay facturas disponibles para esta suscripcion.</p>
                ) : (
                  <ul className="mt-3 divide-y divide-slate-200 dark:divide-white/10">
                    {invoicesPreview.map((invoice) => (
                      <li key={invoice.id} className="flex items-center justify-between gap-3 py-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{invoice.invoice_number}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Emision: {new Date(invoice.issue_date).toLocaleDateString('es-CL')} - Vencimiento: {new Date(invoice.due_date).toLocaleDateString('es-CL')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">
                            {formatCurrency(invoice.total, invoice.currency)}
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
