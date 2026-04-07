import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { getAppApiError } from '@/shared/api/errorNormalizer'
import { registerUser } from '@/features/console/users/api'
import { useHoneypot } from '@/shared/hooks/useHoneypot'
import { HoneypotField } from '@/shared/ui/HoneypotField'
import { TurnstileWidget } from '@/shared/ui/TurnstileWidget'
import { LocaleSwitcher } from '@/shared/ui/LocaleSwitcher'
import { env } from '@/shared/lib/config/env'
import { AppFooter } from '@/shared/ui/AppFooter'
import { IconArrowRight, IconChevronLeft, IconCheckmark, IconPlus } from '@/shared/ui/icons/definitions'

const TURNSTILE_ENABLED = Boolean(env.TURNSTILE_SITE_KEY)

// ── Step definitions ──────────────────────────────────────────────────────────

const STEP_KEYS = ['company', 'personal'] as const
type StepKey = (typeof STEP_KEYS)[number]

// ── TypeScript types ──────────────────────────────────────────────────────────

type CompanyValues = { tenantSlug: string; clientId: string }
type PersonalValues = {
  firstName?: string
  lastName?: string
  username: string
  email: string
  password: string
  confirmPassword: string
}

// ── Step indicator ────────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
  const { t } = useTranslation()
  return (
    <nav aria-label={t('register.steps.ariaNb')} className="flex items-center justify-center gap-0 mb-8">
      {STEP_KEYS.map((key, idx) => {
        const isDone = idx < current
        const isActive = idx === current
        return (
          <div key={key} className="flex items-center">
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
                {t(`register.steps.${key as StepKey}`)}
              </span>
            </div>
            {idx < STEP_KEYS.length - 1 && (
              <div className={`w-16 sm:w-24 h-0.5 mx-1 mb-4 ${isDone ? 'bg-emerald-400' : 'bg-slate-200'}`} aria-hidden="true" />
            )}
          </div>
        )
      })}
    </nav>
  )
}

// ── Step 1 — Company ──────────────────────────────────────────────────────────

function CompanyStep({
  defaultValues,
  onNext,
}: {
  defaultValues: Partial<CompanyValues>
  onNext: (data: CompanyValues) => void
}) {
  const { t } = useTranslation()
  const schema = z.object({
    tenantSlug: z
      .string()
      .min(1, t('register.company.errors.tenantSlugRequired'))
      .regex(/^[a-z0-9-]+$/, t('register.company.errors.tenantSlugPattern')),
    clientId: z
      .string()
      .min(1, t('register.company.errors.clientIdRequired')),
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CompanyValues>({
    resolver: zodResolver(schema),
    defaultValues,
  })

  return (
    <form onSubmit={handleSubmit(onNext)} noValidate>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">{t('register.company.title')}</h2>
        <p className="text-slate-500 text-sm max-w-md mx-auto">
          {t('register.company.description')}
        </p>
      </div>

      <div className="max-w-md mx-auto space-y-5">
        {/* Tenant slug */}
        <div>
          <label htmlFor="tenantSlug" className="block text-sm font-medium text-slate-700 mb-1.5">
            {t('register.company.tenantSlugLabel')} <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <input
            id="tenantSlug"
            type="text"
            autoComplete="off"
            placeholder={t('register.company.tenantSlugPlaceholder')}
            {...register('tenantSlug')}
            className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 bg-white outline-none transition-colors
              focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
              ${errors.tenantSlug ? 'border-red-400 bg-red-50' : 'border-slate-300 hover:border-slate-400'}`}
          />
          {errors.tenantSlug && (
            <p className="mt-1.5 text-xs text-red-600" role="alert">{errors.tenantSlug.message}</p>
          )}
          <p className="mt-1.5 text-xs text-slate-400">
            {t('register.company.tenantSlugHint')} <code className="font-mono bg-slate-100 px-1 rounded">acme-corp</code>
          </p>
        </div>

        {/* Client ID */}
        <div>
          <label htmlFor="clientId" className="block text-sm font-medium text-slate-700 mb-1.5">
            {t('register.company.clientIdLabel')} <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <input
            id="clientId"
            type="text"
            autoComplete="off"
            placeholder={t('register.company.clientIdPlaceholder')}
            {...register('clientId')}
            className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 bg-white outline-none transition-colors
              focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
              ${errors.clientId ? 'border-red-400 bg-red-50' : 'border-slate-300 hover:border-slate-400'}`}
          />
          {errors.clientId && (
            <p className="mt-1.5 text-xs text-red-600" role="alert">{errors.clientId.message}</p>
          )}
          <p className="mt-1.5 text-xs text-slate-400">
            {t('register.company.clientIdHint')}
          </p>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2.5 px-4 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            {t('register.company.continueBtn')}
            <IconArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* No tenant CTA */}
      <div className="mt-8 pt-6 border-t border-slate-100 text-center">
        <p className="text-sm text-slate-500 mb-3">
          {t('register.company.noTenantQuestion')}
        </p>
        <Link
          to="/subscribe"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
        >
          <IconPlus className="h-4 w-4 shrink-0" aria-hidden="true" />
          {t('register.company.noTenantCta')}
        </Link>
        <p className="text-sm text-slate-500 mt-3">
          {t('subscribe.header.alreadyHaveAccount')}{' '}
          <Link to="/login" className="text-indigo-600 font-semibold hover:text-indigo-500 underline-offset-2 hover:underline">
            {t('subscribe.header.login')}
          </Link>
        </p>
      </div>
    </form>
  )
}

// ── Step 2 — Personal data ────────────────────────────────────────────────────

function PersonalStep({
  onBack,
  onSubmit,
  isSubmitting,
  error,
}: {
  onBack: () => void
  onSubmit: (data: PersonalValues) => void
  isSubmitting: boolean
  error: string | null
}) {
  const { t } = useTranslation()
  const schema = z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    username: z.string().min(1, t('register.personal.errors.usernameRequired')).max(100),
    email: z.string().min(1, t('register.personal.errors.emailRequired')).email(t('register.personal.errors.emailInvalid')),
    password: z.string().min(8, t('register.personal.errors.passwordMin')),
    confirmPassword: z.string().min(1, t('register.personal.errors.confirmPasswordRequired')),
  }).refine((d) => d.password === d.confirmPassword, {
    message: t('register.personal.errors.passwordMismatch'),
    path: ['confirmPassword'],
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PersonalValues>({ resolver: zodResolver(schema) })

  const honeypot = useHoneypot()
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const isSubmitDisabled = isSubmitting || (TURNSTILE_ENABLED && !captchaToken)

  function handleFormSubmit(data: PersonalValues) {
    const { blocked } = honeypot.validate()
    if (blocked) return // silently discard automated submissions
    onSubmit(data)
  }

  const field = (
    id: keyof PersonalValues,
    label: string,
    type = 'text',
    required = false,
    placeholder = '',
  ) => (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>}
      </label>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        autoComplete={type === 'password' ? 'new-password' : id}
        {...register(id)}
        className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 bg-white outline-none transition-colors
          focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
          ${errors[id] ? 'border-red-400 bg-red-50' : 'border-slate-300 hover:border-slate-400'}`}
      />
      {errors[id] && (
        <p className="mt-1.5 text-xs text-red-600" role="alert">{errors[id]?.message}</p>
      )}
    </div>
  )

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} noValidate>
      {/* Honeypot trap — bots fill this; real users never see it */}
      <HoneypotField name="website" {...honeypot.fieldProps} />

      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">{t('register.personal.title')}</h2>
        <p className="text-slate-500 text-sm max-w-md mx-auto">
          {t('register.personal.description')}
        </p>
      </div>

      <div className="max-w-md mx-auto space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {field('firstName', t('register.personal.firstNameLabel'), 'text', false, t('register.personal.firstNamePlaceholder'))}
          {field('lastName', t('register.personal.lastNameLabel'), 'text', false, t('register.personal.lastNamePlaceholder'))}
        </div>
        {field('username', t('register.personal.usernameLabel'), 'text', true, t('register.personal.usernamePlaceholder'))}
        {field('email', t('register.personal.emailLabel'), 'email', true, t('register.personal.emailPlaceholder'))}
        {field('password', t('register.personal.passwordLabel'), 'password', true, t('register.personal.passwordPlaceholder'))}
        {field('confirmPassword', t('register.personal.confirmPasswordLabel'), 'password', true, t('register.personal.confirmPasswordPlaceholder'))}

        {error && (
          <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3" role="alert">
            <svg className="w-4 h-4 mt-0.5 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onBack}
            disabled={isSubmitting}
            className="flex-1 flex items-center justify-center gap-2 border border-slate-300 hover:border-slate-400 text-slate-700 text-sm font-semibold py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50"
          >
            <IconChevronLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
            {t('register.personal.backBtn')}
          </button>

          <div className="flex-1 flex flex-col gap-2">
            {/* Cloudflare Turnstile CAPTCHA (only when VITE_TURNSTILE_SITE_KEY is set) */}
            <TurnstileWidget onTokenChange={setCaptchaToken} />

            <button
              type="submit"
              disabled={isSubmitDisabled}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2.5 px-4 rounded-lg transition-colors disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              {isSubmitting ? (
                <>
                  <svg className="h-4 w-4 animate-spin shrink-0" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {t('register.personal.submittingBtn')}
                </>
              ) : (
                <>
                  <IconCheckmark className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {t('register.personal.submitBtn')}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </form>
  )
}

// ── Success state ─────────────────────────────────────────────────────────────

function SuccessState({ email }: { email: string }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  return (
    <div className="text-center py-6 max-w-md mx-auto">
      <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-5">
        <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
        </svg>
      </div>

      <h2 className="text-2xl font-bold text-slate-900 mb-3">{t('register.success.title')}</h2>

      <p className="text-slate-500 text-sm mb-2">
        {t('register.success.sentEmailPre')}{' '}
        <strong className="text-slate-700">{email}</strong>.
      </p>
      <p className="text-slate-500 text-sm mb-6">
        {t('register.success.pendingApprovalBody')}
      </p>

      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-left mb-6">
        <div className="flex items-start gap-2">
          <svg className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <p className="text-xs text-amber-700">
            {t('register.success.linkExpiryPre')}{' '}
            <strong>{t('register.success.linkExpiryDuration')}</strong>
            {t('register.success.linkExpirySuffix')}
          </p>
        </div>
      </div>

      <button
        onClick={() => navigate('/login')}
        className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2.5 px-4 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500"
      >
        <IconArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
        {t('register.success.goToLoginBtn')}
      </button>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function UserRegisterPage() {
  const { t } = useTranslation()
  const [step, setStep] = useState(0)
  const [company, setCompany] = useState<{ tenantSlug: string; clientId: string } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null)

  async function handlePersonalSubmit(data: {
    firstName?: string
    lastName?: string
    username: string
    email: string
    password: string
    confirmPassword: string
  }) {
    if (!company) return
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      await registerUser(company.tenantSlug, company.clientId, {
        username: data.username,
        email: data.email,
        password: data.password,
        first_name: data.firstName || undefined,
        last_name: data.lastName || undefined,
      })
      setRegisteredEmail(data.email)
    } catch (err) {
      const appError = getAppApiError(err)
      if (appError.code === 'RESOURCE_NOT_FOUND') {
        setSubmitError(t('register.errors.tenantOrAppNotFound'))
      } else if (
        appError.code === 'DUPLICATE_RESOURCE'
        || appError.code === 'CONFLICT'
        || appError.httpStatus === 409
      ) {
        setSubmitError(t('register.errors.duplicateAccount'))
      } else {
        setSubmitError(appError.clientMessage)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex flex-col">
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

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-start py-10 px-4">
        <div className="w-full max-w-2xl">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-10">
            {registeredEmail ? (
              <SuccessState email={registeredEmail} />
            ) : (
              <>
                <StepIndicator current={step} />
                {step === 0 && (
                  <CompanyStep
                    defaultValues={company ?? {}}
                    onNext={(data) => {
                      setCompany(data)
                      setStep(1)
                    }}
                  />
                )}
                {step === 1 && (
                  <PersonalStep
                    onBack={() => { setSubmitError(null); setStep(0) }}
                    onSubmit={handlePersonalSubmit}
                    isSubmitting={isSubmitting}
                    error={submitError}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </main>

      <AppFooter />
    </div>
  )
}
