import { useState } from 'react'
import type { AppPlan, AppPlanVersion, AppPlanVersionBillingOption } from '@/types/billing'
import type { ContractorFormValues } from './ContractorStep'
import { TurnstileWidget } from '@/components/TurnstileWidget'
import { env } from '@/config/env'

const TURNSTILE_ENABLED = Boolean(env.TURNSTILE_SITE_KEY)

const PERIOD_LABELS: Record<string, string> = {
  MONTHLY: '/mes',
  YEARLY: '/año',
  ONE_TIME: ' pago único',
}

interface TermsStepProps {
  plan: AppPlan
  version: AppPlanVersion
  billingOption: AppPlanVersionBillingOption | null
  contractor: ContractorFormValues
  onBack: () => void
  onSubmit: () => void
  isSubmitting: boolean
  error: string | null
}

export function TermsStep({ plan, version, billingOption, contractor, onBack, onSubmit, isSubmitting, error }: TermsStepProps) {
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [acceptPrivacy, setAcceptPrivacy] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)

  const canSubmit = acceptTerms && acceptPrivacy && !isSubmitting && (!TURNSTILE_ENABLED || !!captchaToken)

  const priceLabel = !billingOption || billingOption.base_price === 0
    ? 'Gratis'
    : `${new Intl.NumberFormat('es-MX', { style: 'currency', currency: version.currency, minimumFractionDigits: 0 }).format(billingOption.base_price)}${PERIOD_LABELS[billingOption.billing_period] ?? ''}`

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900">Resumen y condiciones</h2>
        <p className="mt-1 text-slate-500 text-sm">Revisa tu solicitud y acepta las condiciones para continuar.</p>
      </div>

      {/* Summary */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Resumen de la contratación</h3>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div>
            <dt className="text-slate-500">Plan</dt>
            <dd className="font-semibold text-indigo-700">{plan.name}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Precio</dt>
            <dd className="font-semibold text-slate-800">{priceLabel}</dd>
          </div>
          {version.trial_days > 0 && (
            <div className="sm:col-span-2">
              <dt className="text-slate-500">Período de prueba</dt>
              <dd className="font-medium text-emerald-700">{version.trial_days} días gratis</dd>
            </div>
          )}

          <div className="sm:col-span-2 border-t border-slate-200 pt-3 mt-1">
            <dt className="text-slate-500 mb-1">Responsable del contrato</dt>
            <dd className="font-medium text-slate-800">{contractor.firstName} {contractor.lastName}</dd>
            <dd className="text-slate-500">{contractor.email}</dd>
          </div>

          {plan.subscriber_type === 'TENANT' && contractor.companyName && (
            <>
              <div>
                <dt className="text-slate-500">Empresa</dt>
                <dd className="font-medium text-slate-800">{contractor.companyName}</dd>
              </div>
              {contractor.companySlug && (
                <div>
                  <dt className="text-slate-500">Identificador</dt>
                  <dd className="font-medium text-slate-500 font-mono text-xs">{contractor.companySlug}</dd>
                </div>
              )}
            </>
          )}
        </dl>
      </div>

      {/* Terms checkboxes */}
      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-semibold text-slate-700 mb-1">Aceptación de condiciones</legend>

        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={acceptTerms}
            onChange={(e) => setAcceptTerms(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 cursor-pointer"
          />
          <span className="text-sm text-slate-600 group-hover:text-slate-800 transition-colors">
            He leído y acepto los{' '}
            <a href="/terminos" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline font-medium">
              Términos de Uso y Servicio
            </a>{' '}
            de KeyGo. <span aria-hidden="true" className="text-red-500">*</span>
          </span>
        </label>

        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={acceptPrivacy}
            onChange={(e) => setAcceptPrivacy(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 cursor-pointer"
          />
          <span className="text-sm text-slate-600 group-hover:text-slate-800 transition-colors">
            He leído y acepto la{' '}
            <a href="/privacidad" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline font-medium">
              Política de Privacidad
            </a>
            , incluyendo el tratamiento de mis datos personales.{' '}
            <span aria-hidden="true" className="text-red-500">*</span>
          </span>
        </label>
      </fieldset>

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
          ← Atrás
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
              Procesando…
            </>
          ) : (
            'Confirmar y continuar →'
          )}
        </button>
      </div>
    </div>
  )
}
