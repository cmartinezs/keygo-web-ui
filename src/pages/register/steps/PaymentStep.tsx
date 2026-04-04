import type { AppPlan, AppPlanVersion, AppPlanVersionBillingOption } from '@/types/billing'
import { useTranslation } from 'react-i18next'
import { env } from '@/config/env'
import { normalizeLocale } from '@/i18n/localeUtils'

const IS_DEV = env.DEV

interface PaymentStepProps {
  plan: AppPlan
  version: AppPlanVersion
  billingOption: AppPlanVersionBillingOption | null
  isProcessing: boolean
  error: string | null
  onMockApprove: () => void
}

export function PaymentStep({ plan, version, billingOption, isProcessing, error, onMockApprove }: PaymentStepProps) {
  const { t, i18n } = useTranslation()
  const activeLocale = normalizeLocale(i18n.resolvedLanguage ?? i18n.language)
  const isCustomPricing = plan.code === 'FLEX' || plan.code === 'ENTERPRISE'
  const priceLabel = isCustomPricing
    ? t('subscribe.customPricing')
    : !billingOption || billingOption.base_price === 0
      ? t('subscribe.free')
      : new Intl.NumberFormat(activeLocale, {
          style: 'currency',
          currency: version.currency,
          minimumFractionDigits: 0,
        }).format(billingOption.base_price)

  return (
    <div className="flex flex-col gap-6 items-center text-center">
      {/* Icon */}
      <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center" aria-hidden="true">
        <svg className="w-8 h-8 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-slate-900">{t('subscribe.steps.payment.title')}</h2>
        <p className="mt-2 text-slate-500 text-sm max-w-sm">
          {t('subscribe.steps.payment.description')}
        </p>
      </div>

      {/* Order summary */}
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-slate-50 p-5 text-left">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">{t('subscribe.steps.payment.orderSummary')}</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-slate-900">{plan.name}</p>
            <p className="text-sm text-slate-500">
              {billingOption?.billing_period === 'MONTHLY' ? t('subscribe.steps.payment.monthlyBilling')
                : billingOption?.billing_period === 'YEARLY' ? t('subscribe.steps.payment.yearlyBilling')
                : t('subscribe.steps.payment.oneTimePayment')}
            </p>
          </div>
          <p className="text-lg font-bold text-slate-900">{priceLabel}</p>
        </div>
        {version.trial_days > 0 && (
          <p className="mt-3 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
            {t('subscribe.steps.payment.trialInfo', { days: version.trial_days })}
          </p>
        )}
      </div>

      {error && (
        <div className="w-full max-w-sm rounded-lg bg-red-50 border border-red-200 p-4 flex gap-3" role="alert">
          <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <p className="text-sm text-red-700 text-left">{error}</p>
        </div>
      )}

      {/* DEV: mock payment button */}
      {IS_DEV ? (
        <div className="w-full max-w-sm flex flex-col gap-3">
          <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{t('subscribe.steps.payment.devMode')}</span>
          </div>
          <button
            type="button"
            onClick={onMockApprove}
            disabled={isProcessing}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-semibold px-8 py-3 rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                  {t('subscribe.actions.processing')}
              </>
            ) : (
                t('subscribe.steps.payment.confirmMockPayment')
            )}
          </button>
        </div>
      ) : (
        /* PROD: pasarela de pago real pendiente */
        <div className="w-full max-w-sm flex flex-col gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-100 border border-slate-200 rounded-lg px-4 py-3">
            <svg className="w-4 h-4 flex-shrink-0 text-slate-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 002 0V6zm-1 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            <span>{t('subscribe.steps.payment.gatewayPending')}</span>
          </div>
        </div>
      )}
    </div>
  )
}
