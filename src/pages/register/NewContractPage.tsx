import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  getBillingCatalog,
  createBillingContract,
  verifyContractEmail,
  mockApprovePayment,
  activateBillingContract,
  BILLING_QUERY_KEYS,
} from '@/api/billing'
import { TENANT, CLIENT_ID } from '@/api/client'
import type { AppPlan, AppPlanVersion, AppPlanVersionBillingOption } from '@/types/billing'
import { PlanStep } from './steps/PlanStep'
import { ContractorStep } from './steps/ContractorStep'
import type { ContractorFormValues } from './steps/ContractorStep'
import { TermsStep } from './steps/TermsStep'
import { EmailVerificationStep } from './steps/EmailVerificationStep'
import { PaymentStep } from './steps/PaymentStep'
import { SuccessStep } from './steps/SuccessStep'
import { HoneypotField } from '@/components/HoneypotField'
import { useHoneypot } from '@/hooks/useHoneypot'

// ── Step definitions ──────────────────────────────────────────────────────────

const STEPS = [
  { label: 'Plan' },
  { label: 'Tus datos' },
  { label: 'Revisión' },
  { label: 'Email' },
  { label: 'Pago' },
] as const

type StepIndex = 0 | 1 | 2 | 3 | 4

// ── Sub-components ────────────────────────────────────────────────────────────

interface StepIndicatorProps {
  current: StepIndex
  done: boolean
}

function StepIndicator({ current, done }: StepIndicatorProps) {
  return (
    <nav aria-label="Pasos del registro" className="flex items-center justify-center gap-0 mb-8">
      {STEPS.map((step, idx) => {
        const isDone = done || idx < current
        const isActive = !done && idx === current
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
              <div className={`w-10 sm:w-16 h-0.5 mx-1 mb-4 ${isDone ? 'bg-emerald-400' : 'bg-slate-200'}`} aria-hidden="true" />
            )}
          </div>
        )
      })}
    </nav>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function NewContractPage() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [step, setStep] = useState<StepIndex>(0)
  const [done, setDone] = useState(false)

  const [selectedPlan, setSelectedPlan] = useState<AppPlan | null>(null)
  const [selectedVersion, setSelectedVersion] = useState<AppPlanVersion | null>(null)
  const [selectedBillingOption, setSelectedBillingOption] = useState<AppPlanVersionBillingOption | null>(null)
  const [contractor, setContractor] = useState<ContractorFormValues | null>(null)

  // post-createContract
  const [contractId, setContractId] = useState<string | null>(null)

  // loading/error state for post-form API calls
  const [isProcessing, setIsProcessing] = useState(false)
  const [processError, setProcessError] = useState<string | null>(null)

  const honeypot = useHoneypot()

  // ── Catalog query ──────────────────────────────────────────────────────────
  const {
    data: plans = [],
    isLoading: catalogLoading,
    isError: catalogError,
  } = useQuery({
    queryKey: BILLING_QUERY_KEYS.catalog(TENANT, CLIENT_ID),
    queryFn: () => getBillingCatalog(TENANT, CLIENT_ID),
    staleTime: 5 * 60 * 1000, // 5 min
  })

  // ── Handlers ───────────────────────────────────────────────────────────────

  function handlePlanSelect(plan: AppPlan, version: AppPlanVersion, billingOption: AppPlanVersionBillingOption | null) {
    setSelectedPlan(plan)
    setSelectedVersion(version)
    setSelectedBillingOption(billingOption)
  }

  function handleContractorNext(data: ContractorFormValues) {
    setContractor(data)
    setStep(2)
  }

  async function handleTermsSubmit() {
    if (!selectedPlan || !selectedVersion || !contractor) return

    const { blocked } = honeypot.validate()
    if (blocked) return // silently discard bot submissions

    setIsProcessing(true)
    setProcessError(null)

    try {
      const contract = await createBillingContract({
        plan_version_id: selectedVersion.id,
        ...(selectedBillingOption && { billing_period: selectedBillingOption.billing_period }),
        contractor_email: contractor.email,
        contractor_first_name: contractor.firstName,
        contractor_last_name: contractor.lastName,
        ...(selectedPlan.subscriber_type === 'TENANT' && {
          company_name: contractor.companyName,
          company_slug: contractor.companySlug,
          company_tax_id: contractor.companyTaxId || undefined,
          company_address: contractor.companyAddress || undefined,
        }),
      })
      setContractId(contract.id)
      setStep(3)
    } catch (err: unknown) {
      const msg = extractErrorMessage(err)
      if (msg.includes('slug') || msg.includes('INVALID_INPUT')) {
        setProcessError('El identificador de empresa ya está en uso. Por favor, elige otro.')
      } else {
        setProcessError('No se pudo iniciar el contrato. Por favor, inténtalo de nuevo.')
      }
    } finally {
      setIsProcessing(false)
    }
  }

  async function handleEmailVerification(code: string) {
    if (!contractId) return
    setIsProcessing(true)
    setProcessError(null)
    try {
      await verifyContractEmail(contractId, { code })
      setStep(4)
    } catch {
      setProcessError('El código es incorrecto o ha expirado. Revisa tu correo e inténtalo de nuevo.')
    } finally {
      setIsProcessing(false)
    }
  }

  async function handleMockApprove() {
    if (!contractId) return
    setIsProcessing(true)
    setProcessError(null)
    try {
      await mockApprovePayment(contractId)
      // Auto-activate contract after payment approval
      await activateBillingContract(contractId)
      setDone(true)
      toast.success('¡Cuenta activada exitosamente!')
    } catch {
      setProcessError('No se pudo completar el pago o la activación. Por favor, inténtalo de nuevo.')
    } finally {
      setIsProcessing(false)
    }
  }

  // ── Narrow card width on plan step ────────────────────────────────────────
  const isWide = step === 0 && !done

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex flex-col">
      {/* Honeypot — invisible to real users */}
      <HoneypotField name="website" {...honeypot.fieldProps} />

      {/* Top bar */}
      <header className="py-4 px-6 border-b border-white/60 bg-white/70 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg" aria-label="Volver al inicio">
            <svg className="w-6 h-6 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
            </svg>
            <span className="font-bold text-slate-900">KeyGo</span>
          </Link>
          <Link to="/login" className="text-sm text-slate-500 hover:text-indigo-600 transition-colors">
            ¿Ya tienes cuenta?{' '}
            <span className="font-semibold text-indigo-600">Iniciar sesión</span>
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-start py-10 px-4">
        <div className={`w-full ${isWide ? 'max-w-5xl' : 'max-w-3xl'}`}>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-10">
            {done && selectedPlan && contractor ? (
              <SuccessStep
                email={contractor.email}
                planName={selectedPlan.name}
                companySlug={contractor.companySlug}
              />
            ) : (
              <>
                <StepIndicator current={step} done={done} />

                {step === 0 && (
                  <PlanStep
                    plans={plans}
                    isLoading={catalogLoading}
                    isError={catalogError}
                    selectedPlanId={selectedPlan?.id ?? null}
                    selectedVersionId={selectedVersion?.id ?? null}
                    onSelect={handlePlanSelect}
                    onNext={() => setStep(1)}
                  />
                )}

                {step === 1 && selectedPlan && (
                  <ContractorStep
                    subscriberType={selectedPlan.subscriber_type}
                    defaultValues={contractor ?? {}}
                    onBack={() => setStep(0)}
                    onNext={handleContractorNext}
                  />
                )}

                {step === 2 && selectedPlan && selectedVersion && contractor && (
                  <TermsStep
                    plan={selectedPlan}
                    version={selectedVersion}
                    billingOption={selectedBillingOption}
                    contractor={contractor}
                    onBack={() => setStep(1)}
                    onSubmit={handleTermsSubmit}
                    isSubmitting={isProcessing}
                    error={processError}
                  />
                )}

                {step === 3 && contractor && (
                  <EmailVerificationStep
                    email={contractor.email}
                    isSubmitting={isProcessing}
                    error={processError}
                    onSubmit={handleEmailVerification}
                  />
                )}

                {step === 4 && selectedPlan && selectedVersion && (
                  <PaymentStep
                    plan={selectedPlan}
                    version={selectedVersion}
                    billingOption={selectedBillingOption}
                    isProcessing={isProcessing}
                    error={processError}
                    onMockApprove={handleMockApprove}
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

// ── Utility ───────────────────────────────────────────────────────────────────

function extractErrorMessage(err: unknown): string {
  if (typeof err === 'object' && err !== null) {
    const e = err as Record<string, unknown>
    if (typeof e['message'] === 'string') return e['message']
  }
  return ''
}
