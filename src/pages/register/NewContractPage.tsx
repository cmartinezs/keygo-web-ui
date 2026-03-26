import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { submitContract } from '@/api/contracts' // ⏳ pendiente
import type { PlanId } from '@/api/contracts'
import { PLAN_NAMES } from '@/components/plans'
import { PlanStep } from './steps/PlanStep'
import { ContractorStep } from './steps/ContractorStep'
import type { ContractorFormValues } from './steps/ContractorStep'
import { TermsStep } from './steps/TermsStep'
import { SuccessStep } from './steps/SuccessStep'

// ── Step config ──────────────────────────────────────────────────────────────

const STEPS = [
  { label: 'Plan' },
  { label: 'Tus datos' },
  { label: 'Condiciones' },
] as const

const VALID_PLANS: PlanId[] = ['starter', 'business', 'on-premise']

function parsePlanParam(value: string | null): PlanId | null {
  if (value && (VALID_PLANS as string[]).includes(value)) return value as PlanId
  return null
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface StepIndicatorProps {
  current: number
}

function StepIndicator({ current }: StepIndicatorProps) {
  return (
    <nav aria-label="Pasos del registro" className="flex items-center justify-center gap-0 mb-8">
      {STEPS.map((step, idx) => {
        const isDone = idx < current
        const isActive = idx === current
        return (
          <div key={step.label} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  isDone
                    ? 'bg-emerald-500 text-white'
                    : isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                      : 'bg-slate-200 text-slate-500'
                }`}
                aria-current={isActive ? 'step' : undefined}
              >
                {isDone ? (
                  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  idx + 1
                )}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${isActive ? 'text-indigo-700' : isDone ? 'text-emerald-600' : 'text-slate-400'}`}>
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`w-16 sm:w-24 h-0.5 mx-1 mb-4 ${isDone ? 'bg-emerald-400' : 'bg-slate-200'}`} aria-hidden="true" />
            )}
          </div>
        )
      })}
    </nav>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function NewContractPage() {
  const [searchParams] = useSearchParams()
  const preselectedPlan = parsePlanParam(searchParams.get('plan'))

  const [step, setStep] = useState(preselectedPlan ? 1 : 0)
  const [selectedPlan, setSelectedPlan] = useState<PlanId | null>(preselectedPlan)
  const [contractor, setContractor] = useState<ContractorFormValues | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function handleSubmit() {
    if (!selectedPlan || !contractor) return
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      await submitContract({
        plan: selectedPlan,
        organizationName: contractor.organizationName,
        ownerFirstName: contractor.firstName,
        ownerLastName: contractor.lastName,
        ownerEmail: contractor.email,
        phone: contractor.phone ?? undefined,
        country: contractor.country,
      })
      setDone(true)
    } catch {
      setSubmitError('Ha ocurrido un error al enviar tu solicitud. Por favor, inténtalo de nuevo.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex flex-col">
      {/* Top bar */}
      <header className="py-4 px-6 border-b border-white/60 bg-white/70 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg" aria-label="Volver al inicio">
            <svg className="w-6 h-6 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
            </svg>
            <span className="font-bold text-slate-900">KeyGo</span>
          </Link>
          <Link to="/login" className="text-sm text-slate-500 hover:text-indigo-600 transition-colors">
            ¿Ya tienes cuenta? <span className="font-semibold text-indigo-600">Iniciar sesión</span>
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-start py-10 px-4">
        {/* Pending feature notice — contained width */}
        <div className="w-full max-w-3xl mb-6">
          <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5" role="status">
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 002 0V6zm-1 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            <span><strong>Próximamente:</strong> El proceso de auto-contratación está en desarrollo. Nuestro equipo se pondrá en contacto contigo tras recibir tu solicitud.</span>
          </div>
        </div>

        {/* Content card — wider when showing plan grid */}
        <div className={`w-full ${step === 0 && !done ? 'max-w-5xl' : 'max-w-3xl'}`}>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-10">
            {done && selectedPlan && contractor ? (
              <SuccessStep email={contractor.email} planName={PLAN_NAMES[selectedPlan]} />
            ) : (
              <>
                <StepIndicator current={step} />
                {step === 0 && (
                  <PlanStep
                    selectedPlan={selectedPlan}
                    onSelect={setSelectedPlan}
                    onNext={() => setStep(1)}
                  />
                )}
                {step === 1 && (
                  <ContractorStep
                    defaultValues={contractor ?? {}}
                    onBack={() => setStep(0)}
                    onNext={(data) => { setContractor(data); setStep(2) }}
                  />
                )}
                {step === 2 && selectedPlan && contractor && (
                  <TermsStep
                    plan={selectedPlan}
                    contractor={contractor}
                    onBack={() => setStep(1)}
                    onSubmit={handleSubmit}
                    isSubmitting={isSubmitting}
                    error={submitError}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
