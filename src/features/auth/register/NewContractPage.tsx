import { useState, useEffect, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { getAppApiError, getUserMessage } from '@/shared/api/errorNormalizer'
import { generateCodeChallenge, generateCodeVerifier, generateState } from '@/shared/lib/auth/pkce'
import {
  getPlatformBillingCatalog,
  PLATFORM_BILLING_QUERY_KEYS,
} from '@/features/ops/billing/api'
import { platformAuthorize, platformCheckEmail } from '@/features/auth/api'
import {
  getBillingContract,
  createBillingContract,
  verifyContractEmail,
  mockApprovePayment,
  activateBillingContract,
  resendContractVerificationEmail,
} from '@/features/console/billing/api'
import type { AppContract, AppPlan, AppPlanVersion, AppPlanVersionBillingOption, BillingPeriod } from '@/shared/types/billing'
import { PlanStep } from './steps/PlanStep'
import { ContractorStep } from './steps/ContractorStep'
import type { ContractorFormValues } from './steps/ContractorStep'
import { TermsStep } from './steps/TermsStep'
import { EmailVerificationStep } from './steps/EmailVerificationStep'
import { PaymentStep } from './steps/PaymentStep'
import { SuccessStep } from './steps/SuccessStep'
import { HoneypotField } from '@/shared/ui/HoneypotField'
import { LocaleSwitcher } from '@/shared/ui/LocaleSwitcher'
import { useHoneypot } from '@/shared/hooks/useHoneypot'
import { AppFooter } from '@/shared/ui/AppFooter'
import {
  NETWORK_MAX_RETRIES,
  NETWORK_REQUEST_TIMEOUT_MS,
  NETWORK_RETRY_DELAY_MS,
} from '@/shared/lib/config/network'
import {
  buildTimeoutStateMessage,
  isRequestTimeout,
  notifyMutationTimeout,
  runGetWithRecovery,
} from '@/shared/lib/network/recovery'
import { normalizeLocale } from '@/shared/lib/i18n/localeUtils'
import { planSupportsPeriod } from '@/shared/ui/plans'
import { IconSearch } from '@/shared/ui/icons/definitions'

// ── Step definitions ──────────────────────────────────────────────────────────

const STEPS = [
  { labelKey: 'subscribe.stepLabels.plan' },
  { labelKey: 'subscribe.stepLabels.contractor' },
  { labelKey: 'subscribe.stepLabels.terms' },
  { labelKey: 'subscribe.stepLabels.email' },
  { labelKey: 'subscribe.stepLabels.payment' },
] as const

const CATALOG_TIMEOUT_MS = NETWORK_REQUEST_TIMEOUT_MS
const CATALOG_RETRY_DELAY_MS = NETWORK_RETRY_DELAY_MS
const CATALOG_MAX_RETRIES = NETWORK_MAX_RETRIES
const CONTRACT_LOOKUP_TIMEOUT_MS = NETWORK_REQUEST_TIMEOUT_MS
const CONTRACT_LOOKUP_RETRY_DELAY_MS = NETWORK_RETRY_DELAY_MS
const CONTRACT_LOOKUP_MAX_RETRIES = NETWORK_MAX_RETRIES
const WRITE_OPERATION_TIMEOUT_MS = NETWORK_REQUEST_TIMEOUT_MS

type StepIndex = 0 | 1 | 2 | 3 | 4

// ── Sub-components ────────────────────────────────────────────────────────────

interface StepIndicatorProps {
  current: StepIndex
  done: boolean
}

interface LiveSummaryProps {
  current: StepIndex
  done: boolean
  selectedPlan: AppPlan | null
  selectedBillingOption: AppPlanVersionBillingOption | null
  selectedVersion: AppPlanVersion | null
  contractor: ContractorFormValues | null
  contractId: string | null
  acceptTerms: boolean
  acceptPrivacy: boolean
}

interface ResumeLookupStepProps {
  inputId: string
  onInputChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  isLoading: boolean
  error: string | null
  isInputLocked?: boolean
}

function StepIndicator({ current, done }: StepIndicatorProps) {
  const { t } = useTranslation()
  return (
    <nav aria-label={t('subscribe.stepIndicatorAria')} className="flex items-center justify-center gap-0 mb-6 max-w-full overflow-hidden">
      {STEPS.map((step, idx) => {
        const isDone = done || idx < current
        const isActive = !done && idx === current
        return (
          <div key={step.labelKey} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold transition-colors ${
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
                {t(step.labelKey)}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`w-4 sm:w-16 h-0.5 mx-0.5 sm:mx-1 mb-3 sm:mb-4 ${isDone ? 'bg-emerald-400' : 'bg-slate-200'}`} aria-hidden="true" />
            )}
          </div>
        )
      })}
    </nav>
  )
}

function StepRail({ current, done }: StepIndicatorProps) {
  const { t } = useTranslation()
  return (
    <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-24">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">{t('subscribe.layout.stepsTitle')}</h3>
      <nav aria-label={t('subscribe.stepIndicatorAria')} className="space-y-3">
        {STEPS.map((step, idx) => {
          const isDone = done || idx < current
          const isActive = !done && idx === current

          return (
            <div key={step.labelKey} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    isDone
                      ? 'bg-emerald-500 text-white'
                      : isActive
                        ? 'bg-indigo-600 text-white'
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
                {idx < STEPS.length - 1 && (
                  <span className={`w-0.5 h-8 mt-1 ${isDone ? 'bg-emerald-300' : 'bg-slate-200'}`} aria-hidden="true" />
                )}
              </div>
              <p className={`pt-1 text-sm ${isActive ? 'font-semibold text-indigo-700' : isDone ? 'text-emerald-700' : 'text-slate-500'}`}>
                {t(step.labelKey)}
              </p>
            </div>
          )
        })}
      </nav>
    </aside>
  )
}

function LiveSummary({
  current,
  done,
  selectedPlan,
  selectedBillingOption,
  selectedVersion,
  contractor,
  contractId,
  acceptTerms,
  acceptPrivacy,
}: LiveSummaryProps) {
  const { t, i18n } = useTranslation()
  const activeLocale = normalizeLocale(i18n.resolvedLanguage ?? i18n.language)

  const priceText = (() => {
    if (!selectedPlan || !selectedVersion) return t('subscribe.layout.notProvided')
    const isCustomPricing = selectedPlan.code === 'FLEX' || selectedPlan.code === 'ENTERPRISE'
    if (isCustomPricing) return t('subscribe.customPricing')
    if (!selectedBillingOption || selectedBillingOption.base_price === 0) return t('subscribe.free')
    const suffixMap: Record<string, string> = {
      MONTHLY: t('subscribe.period.monthlySuffix'),
      YEARLY: t('subscribe.period.yearlySuffix'),
      ONE_TIME: t('subscribe.period.oneTimeSuffix'),
    }
    const formatted = new Intl.NumberFormat(activeLocale, {
      style: 'currency',
      currency: selectedVersion.currency,
      minimumFractionDigits: 0,
    }).format(selectedBillingOption.base_price)
    return `${formatted}${suffixMap[selectedBillingOption.billing_period] ?? ''}`
  })()

  return (
    <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-24">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">{t('subscribe.layout.summaryTitle')}</h3>

      <div className="space-y-4 text-sm">
        <div className="rounded-xl bg-indigo-50 border-2 border-indigo-500 shadow-md px-3 py-2">
          <p className="text-xs uppercase tracking-wide text-indigo-700 mb-1">{t('subscribe.layout.currentStep')}</p>
          <p className="font-semibold text-indigo-900">
            {done ? t('subscribe.layout.completed') : t(STEPS[current].labelKey)}
          </p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">{t('subscribe.layout.selectedPlan')}</p>
          <p className="font-semibold text-slate-800">{selectedPlan?.name ?? t('subscribe.layout.notProvided')}</p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">{t('subscribe.layout.price')}</p>
          <p className="font-semibold text-slate-800">{priceText}</p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">{t('subscribe.layout.contractOwner')}</p>
          <p className="text-slate-800">{contractor ? `${contractor.firstName} ${contractor.lastName}` : t('subscribe.layout.notProvided')}</p>
          {contractor?.email && <p className="text-slate-500 text-xs">{contractor.email}</p>}
        </div>

        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">{t('subscribe.layout.company')}</p>
          <p className="text-slate-800">{contractor?.companyName || t('subscribe.layout.notProvided')}</p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">{t('subscribe.layout.conditions')}</p>
          <p className="text-slate-800">
            {acceptTerms && acceptPrivacy ? t('subscribe.layout.conditionsAccepted') : t('subscribe.layout.conditionsPending')}
          </p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">{t('subscribe.layout.contractId')}</p>
          <p className="font-mono text-xs text-slate-700 break-all">{contractId ?? t('subscribe.layout.notProvided')}</p>
        </div>
      </div>
    </aside>
  )
}

function ResumeLookupStep({
  inputId,
  onInputChange,
  onSubmit,
  isLoading,
  error,
  isInputLocked = false,
}: ResumeLookupStepProps) {
  const { t } = useTranslation()
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6" noValidate>
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900">{t('subscribe.resume.title')}</h2>
        <p className="mt-1 text-slate-500 text-sm">
          {t('subscribe.resume.description')}
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="resumeContractId" className="text-sm font-medium text-slate-700">
          {t('subscribe.resume.contractIdLabel')} <span aria-hidden="true" className="text-red-500">*</span>
        </label>
        <input
          id="resumeContractId"
          type="text"
          autoComplete="off"
          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
          value={inputId}
          onChange={(event) => onInputChange(event.target.value)}
          readOnly={isInputLocked}
          className={`w-full rounded-lg border px-3 py-2.5 text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
            error ? 'border-red-400 bg-red-50' : isInputLocked ? 'border-slate-300 bg-slate-50 text-slate-600' : 'border-slate-300 bg-white'
          }`}
          aria-describedby={error ? 'resume-contract-error' : 'resume-contract-hint'}
          aria-invalid={error ? true : undefined}
          aria-readonly={isInputLocked || undefined}
        />
        {error ? (
          <p id="resume-contract-error" className="text-xs text-red-600" role="alert">{error}</p>
        ) : (
          <p id="resume-contract-hint" className="text-xs text-slate-400">
            {t('subscribe.resume.contractIdHint')}
          </p>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="submit"
          disabled={!inputId.trim() || isLoading}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-semibold px-8 py-3 rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
        >
          {isLoading ? (
            <>
              <svg className="h-4 w-4 animate-spin shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              {t('subscribe.resume.searching')}
            </>
          ) : (
            <>
              <IconSearch className="h-4 w-4 shrink-0" aria-hidden="true" />
              {t('subscribe.resume.continueContract')}
            </>
          )}
        </button>
      </div>
    </form>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function NewContractPage() {
  const { t } = useTranslation()

  function normalizeKeySegment(value: string): string {
    return value.toLowerCase().replace(/[^a-z0-9-]/g, '-')
  }

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
  const [isCheckingContractorEmail, setIsCheckingContractorEmail] = useState(false)
  const [contractorStepError, setContractorStepError] = useState<string | null>(null)
  const [contractorEmailError, setContractorEmailError] = useState<string | null>(null)

  const honeypot = useHoneypot()
  const [searchParams] = useSearchParams()
  const planParam = searchParams.get('plan')?.toUpperCase() ?? null
  const periodParam = searchParams.get('period')?.toUpperCase() as BillingPeriod | null
  const resumeParam = searchParams.get('resume')
  const contractIdParam = searchParams.get('contract_id')?.trim() ?? ''

  async function fetchCatalogWithRecovery(signal: AbortSignal): Promise<AppPlan[]> {
    return runGetWithRecovery({
      signal,
      label: t('subscribe.recovery.catalogLabel'),
      timeoutMs: CATALOG_TIMEOUT_MS,
      retryDelayMs: CATALOG_RETRY_DELAY_MS,
      maxRetries: CATALOG_MAX_RETRIES,
      query: () => getPlatformBillingCatalog({
        signal,
        timeoutMs: CATALOG_TIMEOUT_MS,
      }),
    })
  }

  async function fetchContractWithRecovery(contractLookupId: string): Promise<AppContract> {
    const controller = new AbortController()
    return runGetWithRecovery({
      signal: controller.signal,
      label: t('subscribe.recovery.contractLabel'),
      timeoutMs: CONTRACT_LOOKUP_TIMEOUT_MS,
      retryDelayMs: CONTRACT_LOOKUP_RETRY_DELAY_MS,
      maxRetries: CONTRACT_LOOKUP_MAX_RETRIES,
      query: () => getBillingContract(contractLookupId, {
        timeoutMs: CONTRACT_LOOKUP_TIMEOUT_MS,
      }),
    })
  }

  // ── Catalog query ──────────────────────────────────────────────────────────
  const {
    data: plans = [],
    isLoading: catalogLoading,
    isError: catalogError,
    refetch: refetchCatalog,
  } = useQuery({
    queryKey: PLATFORM_BILLING_QUERY_KEYS.catalog,
    queryFn: ({ signal }) => fetchCatalogWithRecovery(signal),
    staleTime: 5 * 60 * 1000, // 5 min
    retry: false,
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
    if (!selectedPlan || !selectedVersion) return
    if (planSupportsPeriod(selectedPlan, activePeriod)) return

    setSelectedPlan(null)
    setSelectedVersion(null)
    setSelectedBillingOption(null)
  }, [activePeriod, selectedPlan, selectedVersion])

  useEffect(() => {
    if (resumeParam !== '1') return
    setIsResumeMode(true)
    setResumePhase('lookup')
    if (contractIdParam) {
      setResumeInputId(contractIdParam)
    }
    setStep(3)
  }, [resumeParam, contractIdParam])

  // ── Handlers ───────────────────────────────────────────────────────────────

  function handlePlanSelect(plan: AppPlan, version: AppPlanVersion, billingOption: AppPlanVersionBillingOption | null) {
    setSelectedPlan(plan)
    setSelectedVersion(version)
    setSelectedBillingOption(billingOption)
  }

  function handleContractorEmailChange() {
    if (!contractorEmailError) return
    setContractorEmailError(null)
  }

  async function bootstrapPlatformAuthorizationSession() {
    const verifier = generateCodeVerifier()
    const challenge = await generateCodeChallenge(verifier)
    const state = generateState()

    await platformAuthorize(
      { codeChallenge: challenge, state },
      { timeoutMs: WRITE_OPERATION_TIMEOUT_MS },
    )
  }

  async function ensureNewPlatformUser(email: string) {
    const checkEmailOptions = {
      timeoutMs: WRITE_OPERATION_TIMEOUT_MS,
      idempotencyKey: `kg-platform-check-email-${normalizeKeySegment(email)}`,
    }

    try {
      const status = await platformCheckEmail({ email }, checkEmailOptions)
      return status === 'not_found'
    } catch (error) {
      const appError = getAppApiError(error)

      if (appError.code !== 'AUTHENTICATION_REQUIRED' && appError.httpStatus !== 401) {
        throw error
      }

      const toastId = toast.loading(t('subscribe.messages.restoringSession'))

      try {
        await bootstrapPlatformAuthorizationSession()
        toast.success(t('subscribe.messages.sessionRestored'), { id: toastId })
      } catch (sessionError) {
        toast.error(t('subscribe.messages.sessionRestoreFailed'), { id: toastId })
        throw sessionError
      }

      const status = await platformCheckEmail({ email }, checkEmailOptions)
      return status === 'not_found'
    }
  }

  async function handleContractorNext(data: ContractorFormValues) {
    setIsCheckingContractorEmail(true)
    setContractorStepError(null)
    setContractorEmailError(null)

    try {
      const isNewPlatformUser = await ensureNewPlatformUser(data.email)

      if (!isNewPlatformUser) {
        setContractorEmailError(t('subscribe.errors.emailAlreadyExists'))
        return
      }

      setContractor(data)
      setStep(2)
    } catch (err: unknown) {
      if (isRequestTimeout(err)) {
        setContractorStepError(buildTimeoutStateMessage(t('subscribe.recovery.checkEmailAction'), {
          retryHint: t('subscribe.recovery.connectionHint'),
        }))
        notifyMutationTimeout(t('subscribe.recovery.checkEmailAction'))
        return
      }

      const appError = getAppApiError(err)
      if (appError.code === 'AUTHENTICATION_REQUIRED' || appError.httpStatus === 401) {
        setContractorStepError(t('subscribe.errors.sessionExpired'))
      } else {
        setContractorStepError(getUserMessage(appError))
      }
    } finally {
      setIsCheckingContractorEmail(false)
    }
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
      const contract = await fetchContractWithRecovery(id)
      const canMapPlan = syncPlanSelectionFromContract(contract)

      if (!canMapPlan) {
        setResumeLookupError(t('subscribe.resume.errors.planNotAvailable'))
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
        setResumeLookupError(t('subscribe.resume.errors.alreadyProcessed'))
        return
      }

      setResumeLookupError(t('subscribe.resume.errors.unrecoverable'))
    } catch (err: unknown) {
      if (isRequestTimeout(err)) {
        setResumeLookupError(buildTimeoutStateMessage(t('subscribe.recovery.contractLookupAction'), {
          retryHint: t('subscribe.recovery.retryHint'),
          includeRetryExhaustedNote: true,
        }))
        return
      }
      const appError = getAppApiError(err)
      if (appError.code === 'RESOURCE_NOT_FOUND') {
        setResumeLookupError(t('subscribe.resume.errors.notFound'))
      } else {
        setResumeLookupError(getUserMessage(appError))
      }
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
      }, {
        timeoutMs: WRITE_OPERATION_TIMEOUT_MS,
        idempotencyKey: `kg-contract-create-${normalizeKeySegment(contractor.email)}-${selectedVersion.id}`,
      })
      setContractId(contract.id)
      setStep(3)
    } catch (err: unknown) {
      if (isRequestTimeout(err)) {
        setProcessError(buildTimeoutStateMessage(t('subscribe.recovery.createContractAction'), {
          retryHint: t('subscribe.recovery.connectionHint'),
        }))
        notifyMutationTimeout(t('subscribe.recovery.createContractAction'))
        return
      }
      const appError = getAppApiError(err)
      if (appError.code === 'INVALID_INPUT') {
        setProcessError(t('subscribe.errors.invalidInput'))
      } else {
        setProcessError(getUserMessage(appError))
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
      await verifyContractEmail(contractId, { code }, {
        timeoutMs: WRITE_OPERATION_TIMEOUT_MS,
        idempotencyKey: `kg-verify-email-${contractId}-${code}`,
      })
      setStep(4)
    } catch (err: unknown) {
      if (isRequestTimeout(err)) {
        setProcessError(buildTimeoutStateMessage(t('subscribe.recovery.verifyCodeAction')))
        notifyMutationTimeout(t('subscribe.recovery.verifyCodeAction'))
        return
      }
      const appError = getAppApiError(err)
      if (appError.code === 'INVALID_INPUT') {
        setProcessError(t('subscribe.errors.invalidCode'))
      } else {
        setProcessError(getUserMessage(appError))
      }
    } finally {
      setIsProcessing(false)
    }
  }

  async function handleResend() {
    if (!contractId) return
    setIsResending(true)
    try {
      await resendContractVerificationEmail(contractId, {
        timeoutMs: WRITE_OPERATION_TIMEOUT_MS,
        idempotencyKey: `kg-resend-email-${contractId}`,
      })
      toast.success(t('subscribe.messages.codeResent'))
    } catch (err: unknown) {
      if (isRequestTimeout(err)) {
        notifyMutationTimeout(t('subscribe.recovery.resendCodeAction'), {
          retryHint: t('subscribe.recovery.retryHintShort'),
        })
        return
      }
      const appError = getAppApiError(err)
      toast.error(getUserMessage(appError))
    } finally {
      setIsResending(false)
    }
  }

  async function handleMockApprove() {
    if (!contractId) return
    setIsProcessing(true)
    setProcessError(null)
    try {
      await mockApprovePayment(contractId, {
        timeoutMs: WRITE_OPERATION_TIMEOUT_MS,
        idempotencyKey: `kg-mock-approve-${contractId}`,
      })
      // Auto-activate contract after payment approval
      await activateBillingContract(contractId, {
        timeoutMs: WRITE_OPERATION_TIMEOUT_MS,
        idempotencyKey: `kg-activate-${contractId}`,
      })
      setDone(true)
      toast.success(t('subscribe.messages.accountActivated'))
    } catch (err: unknown) {
      if (isRequestTimeout(err)) {
        setProcessError(buildTimeoutStateMessage(t('subscribe.recovery.approvalActivationAction'), {
          retryHint: t('subscribe.recovery.approvalActivationHint'),
        }))
        notifyMutationTimeout(t('subscribe.recovery.paymentOrActivationAction'))
        return
      }
      const appError = getAppApiError(err)
      setProcessError(getUserMessage(appError))
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex flex-col">
      {/* Honeypot — invisible to real users */}
      <HoneypotField name="website" {...honeypot.fieldProps} />

      {/* Top bar */}
      <header className="py-4 px-6 border-b border-white/60 bg-white/70 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg" aria-label={t('subscribe.header.backHomeAria')}>
            <svg className="w-6 h-6 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
            </svg>
            <span className="hidden sm:inline font-bold text-slate-900">KeyGo</span>
          </Link>
          <div className="flex items-center gap-3">
            <LocaleSwitcher
              compact
              triggerClassName="h-10 border border-slate-300 bg-white px-3 text-slate-700 hover:bg-slate-50 hover:text-slate-900 focus-visible:ring-indigo-500"
              panelClassName="absolute right-0 top-full mt-2 w-full rounded-lg border border-slate-200 bg-white py-1 shadow-xl z-50"
              optionClassName="text-slate-700 hover:bg-slate-100 hover:text-slate-900"
              activeOptionClassName="text-indigo-700 bg-indigo-50 font-semibold"
              selectedValueClassName="hidden sm:inline font-semibold text-slate-900"
            />

          </div>
        </div>
      </header>

        <main className="flex-1 py-8 px-4 overflow-x-hidden">
          <div className="w-full max-w-7xl mx-auto">
            <div className="grid gap-6 lg:grid-cols-[200px_minmax(0,1fr)_260px] xl:grid-cols-[220px_minmax(0,1fr)_280px]">
              <div className="hidden lg:block">
                <StepRail current={step} done={done} />
              </div>

              <div className="min-w-0 bg-white rounded-2xl shadow-sm border border-slate-100 p-5 sm:p-8">
                {done && selectedPlan && contractor ? (
                  <SuccessStep
                    email={contractor.email}
                    planName={selectedPlan.name}
                  />
                ) : (
                  <>
                    <div className="lg:hidden">
                      <StepIndicator current={step} done={done} />
                    </div>

                    {step === 0 && (
                      <PlanStep
                        plans={plans}
                        isLoading={catalogLoading}
                        isError={catalogError}
                        onRetry={() => void refetchCatalog()}
                        selectedPlanId={selectedPlan?.id ?? null}
                        selectedVersionId={selectedVersion?.id ?? null}
                        activePeriod={activePeriod}
                        onPeriodChange={setActivePeriod}
                        onSelect={handlePlanSelect}
                        onNext={() => setStep(1)}
                      />
                    )}

                    {step === 1 && selectedPlan && (
                      <ContractorStep
                        defaultValues={contractor ?? {}}
                        onBack={() => setStep(0)}
                        onNext={handleContractorNext}
                        onEmailChange={handleContractorEmailChange}
                        isSubmitting={isCheckingContractorEmail}
                        error={contractorStepError}
                        emailError={contractorEmailError}
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
                        isInputLocked={Boolean(contractIdParam)}
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

                    <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col items-center gap-2 text-center text-sm text-slate-500">
                      <p>
                        {isResumeMode ? (
                          <>
                            {t('subscribe.resume.ctaNewProcessPrefix')}{' '}
                            <button
                              type="button"
                              onClick={stopResumeMode}
                              className="text-indigo-600 font-semibold hover:text-indigo-500 underline-offset-2 hover:underline"
                            >
                              {t('subscribe.resume.ctaNewProcessAction')}
                            </button>
                          </>
                        ) : (
                          <>
                            {t('subscribe.resume.ctaPrefix')}{' '}
                            <button
                              type="button"
                              onClick={startResumeMode}
                              className="text-indigo-600 font-semibold hover:text-indigo-500 underline-offset-2 hover:underline"
                            >
                              {t('subscribe.resume.ctaAction')}
                            </button>
                          </>
                        )}
                      </p>
                      <p>
                        {t('subscribe.header.alreadyHaveAccount')}{' '}
                        <Link to="/login" className="text-indigo-600 font-semibold hover:text-indigo-500 underline-offset-2 hover:underline">
                          {t('subscribe.header.login')}
                        </Link>
                      </p>
                    </div>
                  </>
                )}
              </div>

              <div className="hidden lg:block">
                <LiveSummary
                  current={step}
                  done={done}
                  selectedPlan={selectedPlan}
                  selectedBillingOption={selectedBillingOption}
                  selectedVersion={selectedVersion}
                  contractor={contractor}
                  contractId={contractId}
                  acceptTerms={acceptTerms}
                  acceptPrivacy={acceptPrivacy}
                />
              </div>
          </div>
        </div>
      </main>

      <AppFooter />
    </div>
  )
}
