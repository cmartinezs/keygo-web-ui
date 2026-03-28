import { useState } from 'react'
import type { PlanId } from '@/api/contracts'
import type { ContractorFormValues } from './ContractorStep'
import { TurnstileWidget } from '@/components/TurnstileWidget'

const TURNSTILE_ENABLED = Boolean(import.meta.env.VITE_TURNSTILE_SITE_KEY)

const PLAN_LABELS: Record<PlanId, string> = {
  starter: 'Starter — Gratis',
  business: 'Business — 49 € / mes',
  'on-premise': 'On-Premise — A medida',
}

interface TermsStepProps {
  plan: PlanId
  contractor: ContractorFormValues
  onBack: () => void
  onSubmit: () => void
  isSubmitting: boolean
  error: string | null
}

export function TermsStep({ plan, contractor, onBack, onSubmit, isSubmitting, error }: TermsStepProps) {
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [acceptPrivacy, setAcceptPrivacy] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)

  const canSubmit = acceptTerms && acceptPrivacy && !isSubmitting && (!TURNSTILE_ENABLED || !!captchaToken)

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900">Resumen y condiciones</h2>
        <p className="mt-1 text-slate-500 text-sm">Revisa tu solicitud y acepta las condiciones para finalizar.</p>
      </div>

      {/* Summary */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">Resumen de tu solicitud</h3>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 text-sm">
          <div>
            <dt className="text-slate-500">Plan seleccionado</dt>
            <dd className="font-semibold text-indigo-700">{PLAN_LABELS[plan]}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Organización</dt>
            <dd className="font-medium text-slate-800">{contractor.organizationName}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Responsable</dt>
            <dd className="font-medium text-slate-800">{contractor.firstName} {contractor.lastName}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Correo de contacto</dt>
            <dd className="font-medium text-slate-800">{contractor.email}</dd>
          </div>
          {contractor.phone && (
            <div>
              <dt className="text-slate-500">Teléfono</dt>
              <dd className="font-medium text-slate-800">{contractor.phone}</dd>
            </div>
          )}
          <div>
            <dt className="text-slate-500">País</dt>
            <dd className="font-medium text-slate-800">{contractor.country}</dd>
          </div>
        </dl>

        {plan === 'on-premise' && (
          <p className="mt-4 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
            Para el plan On-Premise, nuestro equipo se pondrá en contacto contigo en un plazo de 24-48 h hábiles para configurar los detalles del contrato.
          </p>
        )}
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
            , incluyendo el tratamiento de mis datos personales. <span aria-hidden="true" className="text-red-500">*</span>
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

      {/* Cloudflare Turnstile CAPTCHA (only when VITE_TURNSTILE_SITE_KEY is set) */}
      <TurnstileWidget onTokenChange={setCaptchaToken} />

      <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="border border-slate-300 hover:border-slate-400 disabled:opacity-50 text-slate-600 font-medium px-6 py-2.5 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-slate-400"
        >
          ← Atrás
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-semibold px-8 py-2.5 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              Enviando solicitud…
            </>
          ) : (
            'Enviar solicitud'
          )}
        </button>
      </div>
    </div>
  )
}
