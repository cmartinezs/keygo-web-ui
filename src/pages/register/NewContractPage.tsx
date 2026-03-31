import { useState, useEffect, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  getBillingCatalog,
  getBillingContract,
  createBillingContract,
  verifyContractEmail,
  mockApprovePayment,
  activateBillingContract,
  resendContractVerificationEmail,
  BILLING_QUERY_KEYS,
} from '@/api/billing'
import { TENANT, CLIENT_ID } from '@/api/client'
import type { AppContract, AppPlan, AppPlanVersion, AppPlanVersionBillingOption, BillingPeriod } from '@/types/billing'
import { PlanStep } from './steps/PlanStep'
import { ContractorStep } from './steps/ContractorStep'
import type { ContractorFormValues } from './steps/ContractorStep'
import { TermsStep } from './steps/TermsStep'
import { EmailVerificationStep } from './steps/EmailVerificationStep'
import { PaymentStep } from './steps/PaymentStep'
import { SuccessStep } from './steps/SuccessStep'
import { HoneypotField } from '@/components/HoneypotField'
import { useHoneypot } from '@/hooks/useHoneypot'
import { AppFooter } from '@/components/AppFooter'

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

interface ResumeLookupStepProps {
  inputId: string
  onInputChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  isLoading: boolean
  error: string | null
  onExit: () => void
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

function ResumeLookupStep({
  inputId,
  onInputChange,
  onSubmit,
  isLoading,
  error,
  onExit,
}: ResumeLookupStepProps) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6" noValidate>
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900">Retomar contratación</h2>
        <p className="mt-1 text-slate-500 text-sm">
          Ingresa el ID de contrato para continuar desde el paso 4 de este flujo.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="resumeContractId" className="text-sm font-medium text-slate-700">
          ID de contrato <span aria-hidden="true" className="text-red-500">*</span>
        </label>
        <input
          id="resumeContractId"
          type="text"
          autoComplete="off"
          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
          value={inputId}
          onChange={(event) => onInputChange(event.target.value)}
          className={`w-full rounded-lg border px-3 py-2.5 text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
            error ? 'border-red-400 bg-red-50' : 'border-slate-300 bg-white'
          }`}
          aria-describedby={error ? 'resume-contract-error' : 'resume-contract-hint'}
          aria-invalid={error ? true : undefined}
        />
        {error ? (
          <p id="resume-contract-error" className="text-xs text-red-600" role="alert">{error}</p>
        ) : (
          <p id="resume-contract-hint" className="text-xs text-slate-400">
            Puedes encontrar este ID en el correo que recibiste al iniciar la contratación.
          </p>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onExit}
          className="flex-1 sm:flex-none border border-slate-300 text-slate-600 font-semibold px-6 py-3 rounded-xl hover:bg-slate-50 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          ← Volver al flujo nuevo
        </button>
        <button
          type="submit"
          disabled={!inputId.trim() || isLoading}
          className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-semibold px-8 py-3 rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
        >
          {isLoading ? 'Buscando...' : 'Continuar contrato →'}
        </button>
      </div>
    </form>
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
  const [activePeriod, setActivePeriod] = useState<BillingPeriod>('MONTHLY')
  const [contractor, setContractor] = useState<ContractorFormValues | null>(null)

  const [acceptTerms, setAcceptTerms] = useState(false)
  const [acceptPrivacy, setAcceptPrivacy] = useState(false)

  // post-createContract
  const [contractId, setContractId] = useState<string | null>(null)
  const [resumeInputId, setResumeInputId] = useState('')
  const [resumeLookupError, setResumeLookupError] = useState<string | null>(null)
  const [isResumingContract, setIsResumingContract] = useState(false)
  const [isResumeMode, setIsResumeMode] = useState(false)
  const [resumePhase, setResumePhase] = useState<'lookup' | 'verify-email'>('lookup')

  // loading/error state for post-form API calls
  const [isProcessing, setIsProcessing] = useState(false)
  const [processError, setProcessError] = useState<string | null>(null)
  const [isResending, setIsResending] = useState(false)

  const honeypot = useHoneypot()
  const [searchParams] = useSearchParams()
  const planParam = searchParams.get('plan')?.toUpperCase() ?? null
  const periodParam = searchParams.get('period')?.toUpperCase() as BillingPeriod | null
  const resumeParam = searchParams.get('resume')

  // ── Catalog query ──────────────────────────────────────────────────────────
  const {
    data: plans = [],
    isLoading: catalogLoading,
    isError: catalogError,
    refetch: refetchCatalog,
  } = useQuery({
    queryKey: BILLING_QUERY_KEYS.catalog(TENANT, CLIENT_ID),
    queryFn: () => getBillingCatalog(TENANT, CLIENT_ID),
    staleTime: 5 * 60 * 1000, // 5 min
  })

  // ── Auto-select plan and period from URL params ───────────────────────────
  useEffect(() => {
    if (periodParam === 'YEARLY' || periodParam === 'MONTHLY') {
      setActivePeriod(periodParam)
    }
  }, [periodParam])

  useEffect(() => {
    if (!planParam || plans.length === 0 || selectedPlan) return
    const match = plans.find((p) => p.code.toUpperCase() === planParam)
    if (!match) return
    const version = match.versions?.find((v) => v.status === 'ACTIVE') ?? match.versions?.[0] ?? null
    if (!version) return
    const period = periodParam === 'YEARLY' || periodParam === 'MONTHLY' ? periodParam : 'MONTHLY'
    const billingOption =
      version.billing_options?.find((o) => o.billing_period === period) ??
      version.billing_options?.find((o) => o.is_default) ??
      version.billing_options?.[0] ??
      null
    handlePlanSelect(match, version, billingOption)
  }, [plans, planParam]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (resumeParam !== '1') return
    setIsResumeMode(true)
    setResumePhase('lookup')
    setStep(3)
  }, [resumeParam])

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

  function syncPlanSelectionFromContract(contract: AppContract): boolean {
    // Some contracts can come with a client_app_id representation that differs from
    // what catalog returns. The strongest join key here is the selected plan version.
    const plan = plans.find((item) =>
      item.versions.some((versionItem) => versionItem.id === contract.selected_plan_version_id),
    )
    if (!plan) return false

    const version = plan.versions.find((item) => item.id === contract.selected_plan_version_id)
    if (!version) return false

    const billingOption =
      version.billing_options.find((item) => item.billing_period === contract.billing_period) ??
      version.billing_options.find((item) => item.is_default) ??
      version.billing_options[0] ??
      null

    setSelectedPlan(plan)
    setSelectedVersion(version)
    setSelectedBillingOption(billingOption)
    setActivePeriod(contract.billing_period)
    return true
  }

  function startResumeMode() {
    setIsResumeMode(true)
    setResumePhase('lookup')
    setResumeLookupError(null)
    setProcessError(null)
    setStep(3)
  }

  function stopResumeMode() {
    setIsResumeMode(false)
    setResumePhase('lookup')
    setResumeInputId('')
    setResumeLookupError(null)
    setProcessError(null)
    if (!contractId) {
      setStep(0)
    }
  }

  async function handleResumeLookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const id = resumeInputId.trim()
    if (!id) return

    setIsResumingContract(true)
    setResumeLookupError(null)
    setProcessError(null)

    try {
      const contract = await getBillingContract(id)
      const canMapPlan = syncPlanSelectionFromContract(contract)

      if (!canMapPlan) {
        setResumeLookupError('No pudimos asociar este contrato a un plan vigente del catálogo. Inicia una nueva contratación.')
        return
      }

      setContractId(contract.id)
      setContractor({
        firstName: contract.contractor_first_name,
        lastName: contract.contractor_last_name,
        email: contract.contractor_email,
        companyName: contract.company_name ?? '',
        companyTaxId: '',
        companyAddress: '',
      })

      if (contract.status === 'PENDING_EMAIL_VERIFICATION') {
        setResumePhase('verify-email')
        setStep(3)
        return
      }

      if (contract.status === 'PENDING_PAYMENT' || contract.status === 'READY_TO_ACTIVATE') {
        setStep(4)
        return
      }

      if (contract.status === 'ACTIVE' || contract.status === 'SUPERSEDED' || contract.status === 'FINALIZED') {
        setResumeLookupError('Este contrato ya está procesado. Puedes iniciar sesión con tu cuenta activa.')
        return
      }

      setResumeLookupError('Este contrato no se puede retomar porque está expirado, cancelado o fallido.')
    } catch {
      setResumeLookupError('No encontramos un contrato con ese ID. Verifica el dato e inténtalo de nuevo.')
    } finally {
      setIsResumingContract(false)
    }
  }

  async function handleTermsSubmit() {
    if (!selectedPlan || !selectedVersion || !contractor) return

    const { blocked } = honeypot.validate()
    if (blocked) return // silently discard bot submissions

    setIsProcessing(true)
    setProcessError(null)

    try {
      const contract = await createBillingContract({
        client_app_id: selectedPlan.client_app_id,
        plan_version_id: selectedVersion.id,
        ...(selectedBillingOption && { billing_period: selectedBillingOption.billing_period }),
        contractor_email: contractor.email,
        contractor_first_name: contractor.firstName,
        contractor_last_name: contractor.lastName,
        ...(contractor.companyName && {
          company_name: contractor.companyName,
          company_tax_id: contractor.companyTaxId || undefined,
          company_address: contractor.companyAddress || undefined,
        }),
      })
      setContractId(contract.id)
      setStep(3)
    } catch (err: unknown) {
      const msg = extractErrorMessage(err)
      if (msg.includes('INVALID_INPUT')) {
        setProcessError('Los datos introducidos no son válidos. Por favor, revísalos e inténtalo de nuevo.')
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

  async function handleResend() {
    if (!contractId) return
    setIsResending(true)
    try {
      await resendContractVerificationEmail(contractId)
      toast.success('Código reenviado. Revisa tu bandeja de entrada.')
    } catch {
      toast.error('No se pudo reenviar el código. Inténtalo de nuevo más tarde.')
    } finally {
      setIsResending(false)
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
      <main className="flex-1 flex flex-col items-center justify-center py-10 px-4">
        <div className={`w-full ${isWide ? 'max-w-5xl' : 'max-w-3xl'}`}>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-10">
            {done && selectedPlan && contractor ? (
              <SuccessStep
                email={contractor.email}
                planName={selectedPlan.name}
              />
            ) : (
              <>
                <StepIndicator current={step} done={done} />

                {step === 0 && (
                  <PlanStep
                    plans={plans}
                    isLoading={catalogLoading}
                    isError={catalogError}
                    onRetry={() => void refetchCatalog()}
                    selectedPlanId={selectedPlan?.id ?? null}
                    selectedVersionId={selectedVersion?.id ?? null}                    activePeriod={activePeriod}
                    onPeriodChange={setActivePeriod}                    onSelect={handlePlanSelect}
                    onNext={() => setStep(1)}
                  />
                )}

                {step === 1 && selectedPlan && (
                  <ContractorStep
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
                    acceptTerms={acceptTerms}
                    acceptPrivacy={acceptPrivacy}
                    onAcceptTerms={setAcceptTerms}
                    onAcceptPrivacy={setAcceptPrivacy}
                    onBack={() => setStep(1)}
                    onSubmit={handleTermsSubmit}
                    isSubmitting={isProcessing}
                    error={processError}
                  />
                )}

                {step === 3 && isResumeMode && resumePhase === 'lookup' && (
                  <ResumeLookupStep
                    inputId={resumeInputId}
                    onInputChange={setResumeInputId}
                    onSubmit={handleResumeLookup}
                    isLoading={isResumingContract}
                    error={resumeLookupError}
                    onExit={stopResumeMode}
                  />
                )}

                {step === 3 && contractor && (!isResumeMode || resumePhase === 'verify-email') && (
                  <EmailVerificationStep
                    email={contractor.email}
                    isSubmitting={isProcessing}
                    error={processError}
                    onSubmit={handleEmailVerification}
                    onResend={handleResend}
                    isResending={isResending}
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

                <p className="text-center text-xs text-slate-400 mt-6 pt-4 border-t border-slate-100">
                  ¿Iniciaste una contratación antes?{' '}
                  <button
                    type="button"
                    onClick={startResumeMode}
                    className="text-indigo-600 hover:text-indigo-500 underline-offset-2 hover:underline"
                  >
                    Continuar en el paso 4 con un contrato existente
                  </button>
                </p>
              </>
            )}
          </div>
        </div>
      </main>

      <AppFooter />
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
