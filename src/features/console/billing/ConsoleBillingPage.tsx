import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  getBillingCatalog,
  getActiveSubscription,
  listInvoices,
  cancelSubscription,
  BILLING_QUERY_KEYS,
} from '@/features/console/billing/api'
import { TENANT, CLIENT_ID } from '@/shared/api/client'
import { useTokenStore } from '@/shared/lib/auth/tokenStore'
import {
  IconCreditCard,
  IconReceiptPercent,
  IconCheckCircle,
  IconXCircle,
  IconAlertTriangle,
  IconInfo,
  IconChevronLeft,
} from '@/shared/ui/icons'
import {
  NETWORK_REQUEST_TIMEOUT_MS,
  NETWORK_MAX_RETRIES,
  NETWORK_RETRY_DELAY_MS,
} from '@/shared/lib/config/network'
import { runGetWithRecovery, isRequestTimeout, notifyMutationTimeout } from '@/shared/lib/network/recovery'
import type { SubscriptionStatus, InvoiceStatus, AppPlan, AppSubscription, AppInvoice } from '@/shared/types/billing'
import { useState } from 'react'

// ── Status helpers ────────────────────────────────────────────────────────────

const SUB_STATUS_STYLES: Record<SubscriptionStatus, string> = {
  ACTIVE: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  CANCELLED: 'bg-red-500/10 text-red-600 dark:text-red-400',
  PAST_DUE: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  SUSPENDED: 'bg-red-500/10 text-red-600 dark:text-red-400',
}

const INV_STATUS_STYLES: Record<InvoiceStatus, string> = {
  PAID: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  ISSUED: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  OVERDUE: 'bg-red-500/10 text-red-600 dark:text-red-400',
  VOID: 'bg-slate-500/10 text-slate-600 dark:text-slate-400',
}

// ── Section skeleton ──────────────────────────────────────────────────────────

function SectionSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="animate-pulse space-y-3" role="status" aria-label="Cargando">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full" />
      ))}
    </div>
  )
}

// ── Subscription card ─────────────────────────────────────────────────────────

interface SubscriptionCardProps {
  subscription: AppSubscription | undefined
  isLoading: boolean
  isError: boolean
  onCancel: () => void
  isCancelling: boolean
}

function SubscriptionCard({ subscription, isLoading, isError, onCancel, isCancelling }: SubscriptionCardProps) {
  const { t, i18n } = useTranslation()
  const lang = i18n.resolvedLanguage ?? i18n.language

  if (isLoading) {
    return (
      <div className="rounded-lg border border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 p-5">
        <SectionSkeleton rows={4} />
      </div>
    )
  }

  if (isError || !subscription) {
    return (
      <div className="rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/20 p-5">
        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
          <IconAlertTriangle className="w-5 h-5" aria-hidden="true" />
          <span className="text-sm font-semibold">{t('consoleBilling.noSubscription')}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <IconCreditCard className="w-5 h-5 text-indigo-500" aria-hidden="true" />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {t('consoleBilling.subscriptionTitle')}
          </h3>
        </div>
        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${SUB_STATUS_STYLES[subscription.status]}`}>
          {t(`consoleBilling.subStatus.${subscription.status}`)}
        </span>
      </div>

      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
        <div>
          <dt className="text-slate-400">{t('consoleBilling.periodStart')}</dt>
          <dd className="text-slate-600 dark:text-slate-300">
            {new Date(subscription.current_period_start).toLocaleDateString(lang)}
          </dd>
        </div>
        <div>
          <dt className="text-slate-400">{t('consoleBilling.periodEnd')}</dt>
          <dd className="text-slate-600 dark:text-slate-300">
            {new Date(subscription.current_period_end).toLocaleDateString(lang)}
          </dd>
        </div>
        <div>
          <dt className="text-slate-400">{t('consoleBilling.autoRenew')}</dt>
          <dd className="text-slate-600 dark:text-slate-300">
            {subscription.auto_renew ? t('consoleBilling.yes') : t('consoleBilling.no')}
          </dd>
        </div>
        <div>
          <dt className="text-slate-400">{t('consoleBilling.cancelAtEnd')}</dt>
          <dd className="text-slate-600 dark:text-slate-300">
            {subscription.cancel_at_period_end ? t('consoleBilling.yes') : t('consoleBilling.no')}
          </dd>
        </div>
      </dl>

      {subscription.status === 'ACTIVE' && !subscription.cancel_at_period_end && (
        <button
          onClick={onCancel}
          disabled={isCancelling}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
        >
          <IconXCircle className="w-4 h-4" aria-hidden="true" />
          {t('consoleBilling.cancelSubscription')}
        </button>
      )}
    </div>
  )
}

// ── Catalog card ──────────────────────────────────────────────────────────────

function CatalogCard({ plans, isLoading }: { plans: AppPlan[]; isLoading: boolean }) {
  const { t } = useTranslation()

  return (
    <div className="rounded-lg border border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <IconInfo className="w-5 h-5 text-blue-500" aria-hidden="true" />
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          {t('consoleBilling.catalogTitle')}
        </h3>
      </div>

      {isLoading ? (
        <SectionSkeleton rows={3} />
      ) : plans.length === 0 ? (
        <p className="text-sm text-slate-400">{t('consoleBilling.noCatalog')}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-white/5">
                <th className="text-left py-2 pr-4 text-xs font-semibold text-slate-400 uppercase">{t('consoleBilling.planName')}</th>
                <th className="text-left py-2 pr-4 text-xs font-semibold text-slate-400 uppercase">{t('consoleBilling.planCode')}</th>
                <th className="text-left py-2 pr-4 text-xs font-semibold text-slate-400 uppercase">{t('consoleBilling.planStatus')}</th>
                <th className="text-right py-2 text-xs font-semibold text-slate-400 uppercase">{t('consoleBilling.versions')}</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((plan) => (
                <tr key={plan.id} className="border-b border-slate-50 dark:border-white/[0.02]">
                  <td className="py-2 pr-4 text-slate-700 dark:text-slate-300 font-medium">{plan.name}</td>
                  <td className="py-2 pr-4 font-mono text-xs text-slate-500">{plan.code}</td>
                  <td className="py-2 pr-4">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      plan.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-500/10 text-slate-500'
                    }`}>
                      {plan.status}
                    </span>
                  </td>
                  <td className="py-2 text-right text-slate-500">{plan.versions.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Invoices table ────────────────────────────────────────────────────────────

function InvoicesTable({ invoices, isLoading }: { invoices: AppInvoice[]; isLoading: boolean }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.resolvedLanguage ?? i18n.language

  return (
    <div className="rounded-lg border border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <IconReceiptPercent className="w-5 h-5 text-indigo-500" aria-hidden="true" />
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          {t('consoleBilling.invoicesTitle')}
        </h3>
      </div>

      {isLoading ? (
        <SectionSkeleton rows={4} />
      ) : invoices.length === 0 ? (
        <p className="text-sm text-slate-400">{t('consoleBilling.noInvoices')}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-white/5">
                <th className="text-left py-2 pr-4 text-xs font-semibold text-slate-400 uppercase">{t('consoleBilling.invoiceNumber')}</th>
                <th className="text-left py-2 pr-4 text-xs font-semibold text-slate-400 uppercase">{t('consoleBilling.issueDate')}</th>
                <th className="text-left py-2 pr-4 text-xs font-semibold text-slate-400 uppercase">{t('consoleBilling.invoiceStatus')}</th>
                <th className="text-right py-2 text-xs font-semibold text-slate-400 uppercase">{t('consoleBilling.total')}</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-b border-slate-50 dark:border-white/[0.02]">
                  <td className="py-2 pr-4 font-mono text-xs text-slate-700 dark:text-slate-300">{inv.invoice_number}</td>
                  <td className="py-2 pr-4 text-slate-500">{new Date(inv.issue_date).toLocaleDateString(lang)}</td>
                  <td className="py-2 pr-4">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${INV_STATUS_STYLES[inv.status]}`}>
                      {t(`consoleBilling.invStatus.${inv.status}`)}
                    </span>
                  </td>
                  <td className="py-2 text-right font-medium text-slate-700 dark:text-slate-300">
                    {inv.currency} {inv.total.toLocaleString(lang, { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ConsoleBillingPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const timeoutMs = NETWORK_REQUEST_TIMEOUT_MS
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  const tenantSlug = useTokenStore((s) => s.managedTenantSlug) ?? TENANT
  const clientId = CLIENT_ID

  const catalogQuery = useQuery({
    queryKey: BILLING_QUERY_KEYS.catalog(tenantSlug, clientId),
    queryFn: ({ signal }) =>
      runGetWithRecovery({
        signal,
        label: 'catálogo de planes',
        timeoutMs,
        retryDelayMs: NETWORK_RETRY_DELAY_MS,
        maxRetries: NETWORK_MAX_RETRIES,
        query: () => getBillingCatalog(tenantSlug, clientId, { signal, timeoutMs }),
      }),
    retry: false,
  })

  const subscriptionQuery = useQuery({
    queryKey: BILLING_QUERY_KEYS.subscription(tenantSlug, clientId),
    queryFn: ({ signal }) =>
      runGetWithRecovery({
        signal,
        label: 'suscripción',
        timeoutMs,
        retryDelayMs: NETWORK_RETRY_DELAY_MS,
        maxRetries: NETWORK_MAX_RETRIES,
        query: () => getActiveSubscription(tenantSlug, clientId),
      }),
    retry: false,
  })

  const invoicesQuery = useQuery({
    queryKey: BILLING_QUERY_KEYS.invoices(tenantSlug, clientId),
    queryFn: ({ signal }) =>
      runGetWithRecovery({
        signal,
        label: 'facturas',
        timeoutMs,
        retryDelayMs: NETWORK_RETRY_DELAY_MS,
        maxRetries: NETWORK_MAX_RETRIES,
        query: () => listInvoices(tenantSlug, clientId),
      }),
    retry: false,
  })

  const cancelMutation = useMutation({
    mutationFn: () => cancelSubscription(tenantSlug, clientId),
    onSuccess: () => {
      toast.success(t('consoleBilling.cancelSuccess'))
      setShowCancelConfirm(false)
      queryClient.invalidateQueries({ queryKey: BILLING_QUERY_KEYS.subscription(tenantSlug, clientId) })
    },
    onError: (err) => {
      if (isRequestTimeout(err)) notifyMutationTimeout('cancelación de suscripción')
      else toast.error(t('consoleBilling.cancelError'))
    },
  })

  return (
    <div className="p-6 max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <IconCreditCard className="w-7 h-7 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          {t('consoleBilling.title')}
        </h1>
      </div>

      {/* Subscription */}
      <SubscriptionCard
        subscription={subscriptionQuery.data}
        isLoading={subscriptionQuery.isLoading}
        isError={subscriptionQuery.isError}
        onCancel={() => setShowCancelConfirm(true)}
        isCancelling={cancelMutation.isPending}
      />

      {/* Cancel confirmation */}
      {showCancelConfirm && (
        <div className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20 p-5 space-y-3">
          <p className="text-sm text-red-700 dark:text-red-300 font-medium">
            {t('consoleBilling.cancelConfirmMessage')}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => cancelMutation.mutate()}
              disabled={cancelMutation.isPending}
              className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors focus-visible:ring-2 focus-visible:ring-red-500"
            >
              {cancelMutation.isPending ? (
                <svg className="h-4 w-4 animate-spin shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
              ) : (
                <IconXCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
              )}
              {t('consoleBilling.cancelConfirm')}
            </button>
            <button
              onClick={() => setShowCancelConfirm(false)}
              className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
            >
              <IconChevronLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
              {t('consoleBilling.cancelBack')}
            </button>
          </div>
        </div>
      )}

      {/* Catalog */}
      <CatalogCard plans={catalogQuery.data ?? []} isLoading={catalogQuery.isLoading} />

      {/* Invoices */}
      <InvoicesTable invoices={invoicesQuery.data ?? []} isLoading={invoicesQuery.isLoading} />
    </div>
  )
}
