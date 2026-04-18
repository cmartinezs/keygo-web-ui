import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { useForm, useController } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { platformResetPasswordWithTemporaryPassword } from '@/features/account/api'
import { getAppApiError, getUserMessage } from '@/shared/api/errorNormalizer'
import { applyFieldErrors } from '@/shared/hooks/useFieldErrors'
import { NETWORK_REQUEST_TIMEOUT_MS } from '@/shared/lib/config/network'
import { isRequestTimeout, notifyMutationTimeout } from '@/shared/lib/network/recovery'
import { IconShield, IconArrowRight, IconChevronLeft } from '@/shared/ui/icons/definitions'
import { LocaleSwitcher } from '@/shared/ui/LocaleSwitcher'
import { ServerErrorBanner } from '@/shared/ui/ServerErrorBanner'
import { ResetPasswordFields } from './ResetPasswordFields'

// ── OTP input ─────────────────────────────────────────────────────────────────

function OtpInput({
  value,
  onChange,
  hasError,
}: {
  value: string
  onChange: (code: string) => void
  hasError: boolean
}) {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(''))
  const refs = useRef<Array<HTMLInputElement | null>>(Array(6).fill(null))

  // Sync external resets (e.g. after a failed submission)
  useEffect(() => {
    if (value === '') {
      setDigits(Array(6).fill(''))
      refs.current[0]?.focus()
    }
  }, [value])

  function handleChange(index: number, raw: string) {
    const digit = raw.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[index] = digit
    setDigits(next)
    if (digit && index < 5) refs.current[index + 1]?.focus()
    onChange(next.join(''))
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus()
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return
    const next = Array(6).fill('')
    pasted.split('').forEach((ch, i) => { next[i] = ch })
    setDigits(next)
    refs.current[Math.min(pasted.length, 5)]?.focus()
    onChange(next.join(''))
  }

  return (
    <div className="flex gap-2 justify-center" onPaste={handlePaste}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          aria-label={`Dígito ${i + 1} de 6`}
          className={`w-11 h-14 text-center text-2xl font-bold rounded-xl border-2 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
            hasError
              ? 'border-red-500 bg-red-950/30 text-red-300'
              : d
                ? 'border-indigo-500 bg-indigo-950/40 text-white'
                : 'border-white/15 bg-slate-900/70 text-white'
          }`}
        />
      ))}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

interface ResetPasswordLocationState {
  requestId?: string | null
  emailOrUsername?: string
}

function buildSchema(t: ReturnType<typeof useTranslation>['t']) {
  return z
    .object({
      request_id: z.string().min(1, t('authRecovery.reset.errors.requestIdRequired')),
      verification_code: z
        .string()
        .min(1, t('authRecovery.reset.errors.verificationCodeRequired'))
        .length(6, t('authRecovery.reset.errors.verificationCodeLength'))
        .regex(/^\d{6}$/, t('authRecovery.reset.errors.verificationCodeFormat')),
      temporary_password: z.string().min(1, t('authRecovery.errors.temporaryPasswordRequired')),
      new_password: z
        .string()
        .min(12, t('authRecovery.errors.passwordMin'))
        .regex(/[A-Z]/, t('authRecovery.errors.passwordUppercase'))
        .regex(/[a-z]/, t('authRecovery.errors.passwordLowercase'))
        .regex(/\d/, t('authRecovery.errors.passwordDigit'))
        .regex(/[^A-Za-z0-9]/, t('authRecovery.errors.passwordSpecial')),
      confirm_new_password: z.string().min(1, t('authRecovery.errors.confirmPasswordRequired')),
    })
    .refine((values) => values.new_password === values.confirm_new_password, {
      message: t('authRecovery.errors.passwordsMismatch'),
      path: ['confirm_new_password'],
    })
}

type ResetTemporaryPasswordForm = {
  request_id: string
  verification_code: string
  temporary_password: string
  new_password: string
  confirm_new_password: string
}

export default function ResetPasswordPage() {
  const { t } = useTranslation()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const state = (location.state ?? {}) as ResetPasswordLocationState
  const requestId = state.requestId ?? searchParams.get('reset_code_id') ?? null
  const emailHint = state.emailOrUsername ?? null

  const [isReset, setIsReset] = useState(false)
  const [showTemporaryPassword, setShowTemporaryPassword] = useState(false)

  const schema = useMemo(() => buildSchema(t), [t])

  const hasRequestIdFromState = Boolean(requestId)

  const {
    register,
    handleSubmit,
    control,
    watch,
    setError,
    formState: { errors },
  } = useForm<ResetTemporaryPasswordForm>({
    resolver: zodResolver(schema),
    defaultValues: { request_id: requestId ?? '' },
  })

  const { field: otpField } = useController({ name: 'verification_code', control, defaultValue: '' })

  const newPassword = watch('new_password') ?? ''
  const confirmPassword = watch('confirm_new_password') ?? ''

  const mutation = useMutation({
    mutationFn: (values: ResetTemporaryPasswordForm) =>
      platformResetPasswordWithTemporaryPassword(
        {
          request_id: values.request_id,
          verification_code: values.verification_code,
          temporary_password: values.temporary_password,
          new_password: values.new_password,
          confirm_new_password: values.confirm_new_password,
        },
        { timeoutMs: NETWORK_REQUEST_TIMEOUT_MS },
      ),
    onSuccess: () => {
      setIsReset(true)
      toast.success(t('authRecovery.reset.successToast'))
    },
    onError: (error) => {
      if (isRequestTimeout(error)) {
        notifyMutationTimeout(t('authRecovery.reset.timeoutAction'))
        return
      }
      const appError = getAppApiError(error)
      toast.error(getUserMessage(appError))
      applyFieldErrors(appError, setError, {
        knownFields: ['request_id', 'verification_code', 'temporary_password', 'new_password', 'confirm_new_password'],
      })
    },
  })

  function onSubmit(values: ResetTemporaryPasswordForm) {
    mutation.mutate(values)
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 px-4 py-10">
      <div className="relative w-full max-w-md lg:max-w-4xl">
        <div className="mb-4 flex justify-end">
          <LocaleSwitcher
            compact
            triggerClassName="h-10 border border-white/15 bg-slate-900/60 px-3 text-slate-200 hover:bg-slate-800/70 hover:text-white focus-visible:ring-indigo-400"
            panelClassName="absolute right-0 top-full mt-2 w-full rounded-lg bg-slate-900 border border-white/15 shadow-xl py-1 z-50"
            optionClassName="text-slate-200 hover:bg-white/10 hover:text-white"
            activeOptionClassName="text-indigo-300 bg-indigo-500/15 font-semibold"
            selectedValueClassName="font-semibold text-white"
          />
        </div>
        <section
          className="w-full rounded-2xl border border-white/10 bg-slate-800/70 p-8 shadow-2xl backdrop-blur"
          aria-labelledby="reset-password-title"
        >
        <div className="lg:grid lg:grid-cols-2 lg:gap-10">
          {/* ── Left column: info & instructions ──────────────────────── */}
          <div className="mb-6 lg:mb-0 lg:flex lg:flex-col lg:justify-center">
            <h1 id="reset-password-title" className="text-2xl font-bold text-white">
              {t('authRecovery.reset.title')}
            </h1>
            <p className="mt-2 text-sm text-slate-300">{t('authRecovery.reset.subtitle')}</p>

            {emailHint && (
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-indigo-500/30 bg-indigo-950/40 px-4 py-3 text-sm text-indigo-300">
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                <span>{t('authRecovery.reset.codeSentTo', { email: emailHint })}</span>
              </div>
            )}

            {/* Steps guide — visible only on lg */}
            <ol className="mt-6 hidden lg:flex lg:flex-col gap-3 text-sm text-slate-400">
              <li className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-600/30 text-xs font-semibold text-indigo-300" aria-hidden="true">1</span>
                <span>{t('authRecovery.reset.step1')}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-600/30 text-xs font-semibold text-indigo-300" aria-hidden="true">2</span>
                <span>{t('authRecovery.reset.step2')}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-600/30 text-xs font-semibold text-indigo-300" aria-hidden="true">3</span>
                <span>{t('authRecovery.reset.step3')}</span>
              </li>
            </ol>

            <div className="mt-6 hidden lg:block">
              <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-slate-300 underline-offset-2 hover:text-white hover:underline">
                <IconChevronLeft className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {t('authRecovery.backToLogin')}
              </Link>
            </div>
          </div>

          {/* ── Right column: form ────────────────────────────────────── */}
          <div>
        {isReset ? (
          <div className="space-y-4 lg:flex lg:flex-col lg:justify-center lg:min-h-[300px]">
            <p role="status" aria-live="polite" className="rounded-lg border border-emerald-500/30 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-300">
              {t('authRecovery.reset.successMessage')}
            </p>
            <Link
              to="/login"
              className="flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
            >
              <IconArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
              {t('authRecovery.reset.goToLogin')}
            </Link>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>

            {/* Request ID — visible readonly when provided by backend, editable when manual entry */}
            <div>
              <label htmlFor="request-id" className="mb-1 block text-sm font-medium text-slate-200">
                {t('authRecovery.reset.requestIdLabel')} <span className="text-red-400" aria-hidden="true">*</span>
              </label>
              <input
                id="request-id"
                type="text"
                autoComplete="off"
                readOnly={hasRequestIdFromState}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                className={`w-full rounded-lg border bg-slate-900/70 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition font-mono ${
                  hasRequestIdFromState
                    ? 'border-white/10 text-slate-400 cursor-not-allowed'
                    : 'focus-visible:ring-2 focus-visible:ring-indigo-500'
                } ${
                  errors.request_id
                    ? 'border-red-500'
                    : hasRequestIdFromState ? '' : 'border-white/15'
                }`}
                aria-invalid={Boolean(errors.request_id)}
                aria-describedby={errors.request_id ? 'request-id-error' : 'request-id-hint'}
                {...register('request_id')}
              />
              {errors.request_id ? (
                <p id="request-id-error" role="alert" className="mt-1 text-xs text-red-400">
                  {errors.request_id.message}
                </p>
              ) : (
                <p id="request-id-hint" className="mt-1 text-xs text-slate-500">
                  {hasRequestIdFromState
                    ? t('authRecovery.reset.requestIdProvidedHint')
                    : t('authRecovery.reset.requestIdHint')}
                </p>
              )}
            </div>

            {/* Verification code */}
            <div>
              <p className="mb-3 text-sm font-medium text-slate-200">
                {t('authRecovery.reset.verificationCodeLabel')}
              </p>
              <OtpInput
                value={otpField.value}
                onChange={otpField.onChange}
                hasError={Boolean(errors.verification_code)}
              />
              {errors.verification_code ? (
                <p id="verification-code-error" role="alert" className="mt-2 text-xs text-red-400 text-center">
                  {errors.verification_code.message}
                </p>
              ) : (
                <p id="verification-code-hint" className="mt-2 text-xs text-slate-500 text-center">
                  {t('authRecovery.reset.verificationCodeHint')}
                </p>
              )}
            </div>

            {/* Temporary (old) password */}
            <div>
              <label htmlFor="temporary-password" className="mb-1 block text-sm font-medium text-slate-200">
                {t('authRecovery.reset.temporaryPasswordLabel')}
              </label>
              <div className="relative">
                <input
                  id="temporary-password"
                  type={showTemporaryPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-4 py-2.5 pr-12 text-sm text-white placeholder-slate-500 outline-none transition focus-visible:ring-2 focus-visible:ring-indigo-500"
                  aria-invalid={Boolean(errors.temporary_password)}
                  aria-describedby={errors.temporary_password ? 'temporary-password-error' : undefined}
                  {...register('temporary_password')}
                />
                <button
                  type="button"
                  aria-label={showTemporaryPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                  aria-pressed={showTemporaryPassword}
                  onClick={() => setShowTemporaryPassword((current) => !current)}
                  className="absolute inset-y-0 right-0 z-10 flex w-11 items-center justify-center rounded-r-lg border-l border-white/10 bg-slate-900/60 text-slate-300 transition-colors hover:bg-slate-800/80 hover:text-white focus-visible:ring-2 focus-visible:ring-indigo-400"
                >
                  {showTemporaryPassword ? (
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.584 10.587A2 2 0 0012 14a2 2 0 001.414-.586M9.88 5.094A9.76 9.76 0 0112 4.8c4.12 0 7.66 2.55 9.12 6.2a9.58 9.58 0 01-3.62 4.5M6.72 6.72A9.56 9.56 0 002.88 11c.8 2 2.24 3.72 4.02 4.94A9.72 9.72 0 0012 17.2c1.12 0 2.2-.18 3.22-.5" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.88 11c1.46-3.65 5-6.2 9.12-6.2s7.66 2.55 9.12 6.2c-1.46 3.65-5 6.2-9.12 6.2S4.34 14.65 2.88 11z" />
                      <circle cx="12" cy="11" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.temporary_password && (
                <p id="temporary-password-error" role="alert" className="mt-1 text-xs text-red-400">
                  {errors.temporary_password.message}
                </p>
              )}
            </div>

            <ResetPasswordFields
              passwordRegister={register('new_password')}
              confirmRegister={register('confirm_new_password')}
              passwordValue={newPassword}
              confirmValue={confirmPassword}
              passwordError={errors.new_password?.message}
              confirmError={errors.confirm_new_password?.message}
              disabled={mutation.isPending}
            />

            {/* Errores del servidor no mapeados a campos específicos */}
            <ServerErrorBanner errors={errors} className="dark:border-red-500/20 dark:bg-red-950/40" />

            <button
              type="submit"
              disabled={mutation.isPending}
              aria-busy={mutation.isPending}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {mutation.isPending ? (
                <svg className="h-4 w-4 animate-spin shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
              ) : (
                <IconShield className="h-4 w-4 shrink-0" aria-hidden="true" />
              )}
              {mutation.isPending ? t('authRecovery.reset.submitting') : t('authRecovery.reset.submit')}
            </button>

            {/* Back to login — visible only on mobile (lg uses left column link) */}
            <div className="flex justify-end pt-1 text-sm lg:hidden">
              <Link to="/login" className="inline-flex items-center gap-1.5 text-slate-300 underline-offset-2 hover:text-white hover:underline">
                <IconChevronLeft className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {t('authRecovery.backToLogin')}
              </Link>
            </div>
          </form>
        )}
          </div>
        </div>
        </section>
        <footer className="mt-4 text-center text-xs text-slate-600" role="contentinfo">
          © {new Date().getFullYear()} KeyGo - {t('auth.copyright')}
        </footer>
      </div>
    </main>
  )
}
