import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { AppPlan, AppPlanVersion, AppPlanVersionBillingOption } from '@/types/billing'
import type { ContractorFormValues } from './ContractorStep'
import { TurnstileWidget } from '@/components/TurnstileWidget'
import { PolicyModal } from '@/components/PolicyModal'
import { TermsOfServiceContent } from '@/components/TermsOfServiceContent'
import { PrivacyPolicyContent } from '@/components/PrivacyPolicyContent'
import { env } from '@/config/env'
import { normalizeLocale } from '@/i18n/localeUtils'

const TURNSTILE_ENABLED = Boolean(env.TURNSTILE_SITE_KEY)

interface TermsStepProps {
  plan: AppPlan
  version: AppPlanVersion
  billingOption: AppPlanVersionBillingOption | null
  contractor: ContractorFormValues
  acceptTerms: boolean
  acceptPrivacy: boolean
  onAcceptTerms: (value: boolean) => void
  onAcceptPrivacy: (value: boolean) => void
  onBack: () => void
  onSubmit: () => void
  isSubmitting: boolean
  error: string | null
}

export function TermsStep({ plan, version, billingOption, contractor, acceptTerms, acceptPrivacy, onAcceptTerms, onAcceptPrivacy, onBack, onSubmit, isSubmitting, error }: TermsStepProps) {
  const { t, i18n } = useTranslation()
  const activeLocale = normalizeLocale(i18n.resolvedLanguage ?? i18n.language)

  const periodLabels: Record<string, string> = {
    MONTHLY: t('subscribe.period.monthlySuffix'),
    YEARLY: t('subscribe.period.yearlySuffix'),
    ONE_TIME: t('subscribe.period.oneTimeSuffix'),
  }

  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [showPrivacyModal, setShowPrivacyModal] = useState(false)

  const canSubmit = acceptTerms && acceptPrivacy && !isSubmitting && (!TURNSTILE_ENABLED || !!captchaToken)

  const isCustomPricing = plan.code === 'FLEX' || plan.code === 'ENTERPRISE'
  const priceLabel = isCustomPricing
    ? t('subscribe.customPricing')
    : !billingOption || billingOption.base_price === 0
      ? t('subscribe.free')
      : `${new Intl.NumberFormat(activeLocale, { style: 'currency', currency: version.currency, minimumFractionDigits: 0 }).format(billingOption.base_price)}${periodLabels[billingOption.billing_period] ?? ''}`

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900">{t('subscribe.steps.terms.title')}</h2>
        <p className="mt-1 text-slate-500 text-sm">{t('subscribe.steps.terms.description')}</p>
      </div>

      {/* Summary */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">{t('subscribe.steps.terms.summaryTitle')}</h3>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div>
            <dt className="text-slate-500">{t('subscribe.steps.terms.fields.plan')}</dt>
            <dd className="font-semibold text-indigo-700">{plan.name}</dd>
          </div>
          <div>
            <dt className="text-slate-500">{t('subscribe.steps.terms.fields.price')}</dt>
            <dd className="font-semibold text-slate-800">{priceLabel}</dd>
          </div>
          {version.trial_days > 0 && (
            <div className="sm:col-span-2">
              <dt className="text-slate-500">{t('subscribe.steps.terms.fields.trialPeriod')}</dt>
              <dd className="font-medium text-emerald-700">{t('subscribe.steps.terms.fields.trialDays', { days: version.trial_days })}</dd>
            </div>
          )}

          <div className="sm:col-span-2 border-t border-slate-200 pt-3 mt-1">
            <dt className="text-slate-500 mb-1">{t('subscribe.steps.terms.fields.contractOwner')}</dt>
            <dd className="font-medium text-slate-800">{contractor.firstName} {contractor.lastName}</dd>
            <dd className="text-slate-500">{contractor.email}</dd>
          </div>

          {contractor.companyName && (
            <>
              <div>
                <dt className="text-slate-500">{t('subscribe.steps.terms.fields.company')}</dt>
                <dd className="font-medium text-slate-800">{contractor.companyName}</dd>
              </div>
            </>
          )}
        </dl>
      </div>

      {/* Terms checkboxes */}
      <fieldset className="flex flex-col gap-3">
        <legend className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-1">
          {t('subscribe.steps.terms.acceptanceTitle')}
          <span className="relative group/tip">
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-slate-200 text-slate-500 text-[10px] font-bold cursor-default select-none">?</span>
            <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 rounded-lg bg-slate-800 text-white text-xs px-3 py-2 text-center shadow-lg opacity-0 group-hover/tip:opacity-100 transition-opacity z-10">
              {t('subscribe.steps.terms.acceptanceTooltip')}
              <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
            </span>
          </span>
        </legend>

        <label className="flex items-start gap-3 cursor-default group">
          <input
            type="checkbox"
            checked={acceptTerms}
            readOnly
            tabIndex={-1}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 cursor-default pointer-events-none"
          />
          <span className="text-sm text-slate-600">
            {t('subscribe.steps.terms.acceptTermsPrefix')}{' '}
            <button
              type="button"
              onClick={() => setShowTermsModal(true)}
              className="text-indigo-600 hover:underline font-medium focus-visible:ring-2 focus-visible:ring-indigo-500 rounded outline-none"
            >
              {t('subscribe.steps.terms.termsLink')}
            </button>{' '}
            {t('subscribe.steps.terms.acceptTermsSuffix')} <span aria-hidden="true" className="text-red-500">*</span>
          </span>
        </label>

        <label className="flex items-start gap-3 cursor-default group">
          <input
            type="checkbox"
            checked={acceptPrivacy}
            readOnly
            tabIndex={-1}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 cursor-default pointer-events-none"
          />
          <span className="text-sm text-slate-600">
            {t('subscribe.steps.terms.acceptPrivacyPrefix')}{' '}
            <button
              type="button"
              onClick={() => setShowPrivacyModal(true)}
              className="text-indigo-600 hover:underline font-medium focus-visible:ring-2 focus-visible:ring-indigo-500 rounded outline-none"
            >
              {t('subscribe.steps.terms.privacyLink')}
            </button>
            {t('subscribe.steps.terms.acceptPrivacySuffix')}{' '}
            <span aria-hidden="true" className="text-red-500">*</span>
          </span>
        </label>
      </fieldset>

      {/* Policy modals */}
      <PolicyModal
        isOpen={showTermsModal}
        title={t('subscribe.steps.terms.termsModalTitle')}
        onClose={() => setShowTermsModal(false)}
        onAccept={() => onAcceptTerms(true)}
      >
        <TermsOfServiceContent />
      </PolicyModal>

      <PolicyModal
        isOpen={showPrivacyModal}
        title={t('subscribe.steps.terms.privacyModalTitle')}
        onClose={() => setShowPrivacyModal(false)}
        onAccept={() => onAcceptPrivacy(true)}
      >
        <PrivacyPolicyContent />
      </PolicyModal>

      {/* Error banner */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 flex gap-3" role="alert">
          <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Cloudflare Turnstile CAPTCHA */}
      <TurnstileWidget onTokenChange={setCaptchaToken} />

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="flex-1 sm:flex-none border border-slate-300 text-slate-600 font-semibold px-6 py-3 rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          {t('subscribe.actions.back')}
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit}
          className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-semibold px-8 py-3 rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              {t('subscribe.actions.processing')}
            </>
          ) : (
            t('subscribe.steps.terms.confirmAndContinue')
          )}
        </button>
      </div>
    </div>
  )
}
