import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { useNavigate, Link } from 'react-router-dom'
import { decodeJwt } from 'jose'
import { useTranslation } from 'react-i18next'
import { authorize, login, exchangeToken } from '@/features/auth/api'
import { getAppApiError } from '@/shared/api/errorNormalizer'
import { generateCodeVerifier, generateCodeChallenge, generateState } from '@/shared/lib/auth/pkce'
import { verifyIdToken, extractRoles } from '@/shared/lib/auth/jwksVerify'
import { useTokenStore } from '@/shared/lib/auth/tokenStore'
import { useBlockingErrorStore } from '@/shared/lib/auth/blockingErrorStore'
import { persistRefreshToken } from '@/shared/lib/auth/refresh'
import { TENANT } from '@/shared/api/client'
import { useRateLimit } from '@/shared/hooks/useRateLimit'
import { useHoneypot } from '@/shared/hooks/useHoneypot'
import { HoneypotField } from '@/shared/ui/HoneypotField'
import { TurnstileWidget } from '@/shared/ui/TurnstileWidget'
import { LocaleSwitcher } from '@/shared/ui/LocaleSwitcher'
import { env } from '@/shared/lib/config/env'
import {
  NETWORK_MAX_RETRIES,
  NETWORK_REQUEST_TIMEOUT_MS,
  NETWORK_RETRY_DELAY_MS,
} from '@/shared/lib/config/network'
import {
  buildMutationTimeoutMessage,
  isRequestTimeout,
} from '@/shared/lib/network/recovery'
import { i18n } from '@/shared/lib/i18n/config'
import type { AppRole } from '@/shared/types/roles'
import type { AuthorizeData } from '@/shared/types/auth'

const TURNSTILE_ENABLED = Boolean(env.TURNSTILE_SITE_KEY)
const AUTH_TIMEOUT_MS = NETWORK_REQUEST_TIMEOUT_MS
const AUTH_RETRY_DELAY_MS = NETWORK_RETRY_DELAY_MS
const AUTH_MAX_RETRIES: number = NETWORK_MAX_RETRIES

// ── Schemas ─────────────────────────────────────────────────────────────────

function createLoginSchema() {
  return z.object({
    emailOrUsername: z.string().min(1, i18n.t('auth.errors.usernameRequired')),
    password: z.string().min(1, i18n.t('auth.errors.passwordRequired')),
  })
}

type LoginFormValues = {
  emailOrUsername: string
  password: string
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function resolveRedirectPath(roles: AppRole[]): string {
  if (roles.includes('ADMIN')) return '/dashboard'
  if (roles.includes('ADMIN_TENANT')) return '/dashboard'
  if (roles.includes('USER_TENANT')) return '/dashboard'
  return '/dashboard'
}

/**
 * Maps Paso 1 (GET /oauth2/authorize) errors to user-facing messages.
 * These occur before the form is shown.
 */
function extractAuthorizeError(error: unknown): { message: string; retryable: boolean } {
  const appError = getAppApiError(error)

  if (appError.code === 'RESOURCE_NOT_FOUND') {
    return {
      message: i18n.t('auth.errors.missingAppOrTenant'),
      retryable: false,
    }
  }

  if (appError.code === 'BUSINESS_RULE_VIOLATION') {
    return {
      message: i18n.t('auth.errors.accessSuspended'),
      retryable: false,
    }
  }

  if (appError.code === 'INVALID_INPUT') {
    return {
      message: i18n.t('auth.errors.appConfigError'),
      retryable: false,
    }
  }

  return {
    message: appError.clientMessage,
    retryable: appError.retryable,
  }
}

/**
 * Maps Paso 2 (POST /account/login) errors to user-facing messages.
 * `sessionExpired` signals Pasos 0-1 must be re-run before retrying.
 */
function extractLoginError(error: unknown): { message: string; sessionExpired: boolean } {
  const appError = getAppApiError(error)

  if (appError.code === 'AUTHENTICATION_REQUIRED') {
    return { message: i18n.t('auth.errors.invalidCredentials'), sessionExpired: false }
  }

  if (appError.code === 'BUSINESS_RULE_VIOLATION') {
    return {
      message: i18n.t('auth.errors.accountNoAccess'),
      sessionExpired: false,
    }
  }

  if (appError.code === 'EMAIL_NOT_VERIFIED') {
    return {
      message: i18n.t('auth.errors.emailPending'),
      sessionExpired: false,
    }
  }

  if (appError.code === 'RESOURCE_NOT_FOUND') {
    return { message: i18n.t('auth.errors.userNotFound'), sessionExpired: false }
  }

  // INVALID_INPUT in this step -> no prior session; Pasos 0-1 must be re-run
  if (appError.code === 'INVALID_INPUT') {
    return {
      message: i18n.t('auth.errors.sessionExpired'),
      sessionExpired: true,
    }
  }

  return { message: appError.clientMessage, sessionExpired: false }
}

/**
 * Extracts the `reset_code_id` field from the body of a 401 RESET_PASSWORD_REQUIRED error.
 * The backend may include it under `data.reset_code_id` in the BaseResponse envelope.
 * Returns null if the field is absent or not a string.
 */
function extractResetRequestId(error: unknown): string | null {
  try {
    const axiosError = error as { response?: { data?: unknown } }
    const body = axiosError?.response?.data
    if (typeof body !== 'object' || body === null) return null
    const data = (body as Record<string, unknown>)['data']
    if (typeof data !== 'object' || data === null) return null
    const id = (data as Record<string, unknown>)['reset_code_id']
    return typeof id === 'string' ? id : null
  } catch {
    return null
  }
}

// ── Sub-components ───────────────────────────────────────────────────────────

/** Shown while Pasos 0-1 are running (before the user sees anything interactive). */
function InitLoadingState() {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center gap-4 py-10" role="status" aria-live="polite">
      <svg
        className="w-8 h-8 text-indigo-400 animate-spin"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
        />
      </svg>
      <p className="text-slate-400 text-sm">{t('auth.initLoading')}</p>
    </div>
  )
}

interface InitErrorStateProps {
  message: string
  retryable: boolean
  onRetry: () => void
  onGoHome: () => void
}

/** Shown when Paso 1 fails (tenant not found, suspended, bad config, network error). */
function InitErrorState({ message, retryable, onRetry, onGoHome }: InitErrorStateProps) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center gap-5 py-10" role="alert">
      <svg
        className="w-10 h-10 text-red-400"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
        />
      </svg>
      <p className="text-slate-300 text-sm text-center leading-relaxed">{message}</p>
      <div className="flex flex-col sm:flex-row gap-3 w-full">
        {retryable && (
          <button
            onClick={onRetry}
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold py-2.5 px-4 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-indigo-400"
          >
            {t('common.retryNow')}
          </button>
        )}
        <button
          onClick={onGoHome}
          className="flex-1 border border-white/20 hover:border-white/40 hover:bg-white/5 text-slate-300 text-sm font-medium py-2.5 px-4 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-white/30"
        >
          {t('common.comeBackLater')}
        </button>
      </div>
    </div>
  )
}

interface LoginFormProps {
  clientName: string
  isReiniting: boolean
  isPending: boolean
  error: unknown
  onSubmit: (values: LoginFormValues) => void
  isLocked: boolean
  remainingSeconds: number
}

/**
 * Paso 2: Credential capture. Only rendered once Paso 1 has completed.
 * `isReiniting` is true while Pasos 0-1 are re-running after a session expiry.
 */
function LoginForm({ clientName, isReiniting, isPending, error, onSubmit, isLocked, remainingSeconds }: LoginFormProps) {
  const { t } = useTranslation()
  const loginSchema = useMemo(() => createLoginSchema(), [])
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) })

  const honeypot = useHoneypot()
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const loginError = error ? extractLoginError(error) : null
  // Suppress the error banner while we are automatically re-initializing
  const showError = loginError && !loginError.sessionExpired
  const isDisabled = isPending || isReiniting || isLocked || (TURNSTILE_ENABLED && !captchaToken)

  function handleFormSubmit(values: LoginFormValues) {
    const { blocked } = honeypot.validate()
    if (blocked) return // silently discard automated submissions
    onSubmit(values)
  }

  return (
    <>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-white">{t('auth.title')}</h1>
        <p className="text-slate-400 text-sm mt-1">
          {clientName ? t('auth.subtitleWithClient', { clientName }) : t('auth.subtitleDefault')}
        </p>
      </div>

      {/* Session-expiry reinit indicator */}
      {isReiniting && (
        <div className="mb-4 flex items-center justify-center gap-2 text-amber-400 text-sm" role="status" aria-live="polite">
          <svg className="w-4 h-4 animate-spin shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          {t('auth.restartingSession')}
        </div>
      )}

      {/* Rate-limit lockout banner */}
      {isLocked && (
        <div
          role="alert"
          className="mb-5 flex items-start gap-3 bg-amber-950/60 border border-amber-500/30 text-amber-300 text-sm rounded-lg px-4 py-3"
        >
          <svg
            className="w-4 h-4 mt-0.5 shrink-0"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z"
              clipRule="evenodd"
            />
          </svg>
          <span>
            {t('auth.lockout', { seconds: remainingSeconds })}
          </span>
        </div>
      )}

      {/* Login error banner */}
      {showError && (
        <div
          role="alert"
          className="mb-5 flex items-start gap-3 bg-red-950/60 border border-red-500/30 text-red-300 text-sm rounded-lg px-4 py-3"
        >
          <svg
            className="w-4 h-4 mt-0.5 shrink-0"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
              clipRule="evenodd"
            />
          </svg>
          <span>{loginError.message}</span>
        </div>
      )}

      <form className="space-y-5" onSubmit={handleSubmit(handleFormSubmit)} noValidate>
        {/* Honeypot trap — bots fill this; real users never see it */}
        <HoneypotField name="website" {...honeypot.fieldProps} />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="emailOrUsername" className="text-sm font-medium text-slate-300">
            {t('auth.usernameOrEmail')}
          </label>
          <input
            id="emailOrUsername"
            type="text"
            autoComplete="username"
            disabled={isDisabled}
            className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition disabled:opacity-50"
            placeholder="admin@keygo.io"
            {...register('emailOrUsername')}
          />
          {errors.emailOrUsername && (
            <p className="text-xs text-red-400">{errors.emailOrUsername.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-medium text-slate-300">
            {t('auth.password')}
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              disabled={isDisabled}
              className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-4 py-2.5 pr-12 text-white placeholder-slate-500 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition disabled:opacity-50"
              placeholder="••••••••"
              {...register('password')}
            />
            <button
              type="button"
              aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
              aria-pressed={showPassword}
              onClick={() => setShowPassword((current) => !current)}
              disabled={isDisabled}
              className="absolute inset-y-0 right-0 z-10 flex w-11 items-center justify-center rounded-r-lg border-l border-white/10 bg-slate-900/60 text-slate-300 transition-colors hover:bg-slate-800/80 hover:text-white focus-visible:ring-2 focus-visible:ring-indigo-400 disabled:opacity-50"
            >
              {showPassword ? (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10.584 10.587A2 2 0 0012 14a2 2 0 001.414-.586M9.88 5.094A9.76 9.76 0 0112 4.8c4.12 0 7.66 2.55 9.12 6.2a9.58 9.58 0 01-3.62 4.5M6.72 6.72A9.56 9.56 0 002.88 11c.8 2 2.24 3.72 4.02 4.94A9.72 9.72 0 0012 17.2c1.12 0 2.2-.18 3.22-.5"
                  />
                </svg>
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.88 11c1.46-3.65 5-6.2 9.12-6.2s7.66 2.55 9.12 6.2c-1.46 3.65-5 6.2-9.12 6.2S4.34 14.65 2.88 11z"
                  />
                  <circle cx="12" cy="11" r="3" />
                </svg>
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-red-400">{errors.password.message}</p>
          )}
        </div>

        {/* Cloudflare Turnstile CAPTCHA (only when VITE_TURNSTILE_SITE_KEY is set) */}
        <TurnstileWidget onTokenChange={setCaptchaToken} className="mt-1" />

        <button
          type="submit"
          disabled={isDisabled}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800 flex items-center justify-center gap-2"
        >
          {isPending && !isReiniting ? (
            <>
              <svg
                className="w-4 h-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
              {t('auth.authenticating')}
            </>
          ) : (
            t('auth.submit')
          )}
        </button>
      </form>
    </>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

/**
 * Login page — orchestrates the OAuth2/PKCE flow:
 *
 *  Paso 0-1 (on mount, invisible to the user):
 *    generate PKCE → GET /oauth2/authorize (establishes JSESSIONID)
 *
 *  Paso 2-3 (after user submits credentials):
 *    POST /account/login → POST /oauth2/token → verify id_token → navigate
 *
 *  Session expiry recovery:
 *    If Paso 2 returns INVALID_INPUT ("no prior session"),
 *    Pasos 0-1 are re-run automatically before the user retries.
 */
export default function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { accessToken, idToken, roles, setTokens } = useTokenStore()
  const { setError } = useBlockingErrorStore()
  const codeVerifierRef = useRef<string | null>(null)
  const isAutoRetryingRef = useRef(false)
  const lastAuthErrorRef = useRef<{ message: string; retryable: boolean } | null>(null)
  const loginPhaseRef = useRef<'login' | 'post-login'>('login')
  const autoRetryCountRef = useRef(0)
  const autoRetryTimeoutRef = useRef<number | null>(null)

  function clearAutoRetryTimeout() {
    if (autoRetryTimeoutRef.current === null) return
    window.clearTimeout(autoRetryTimeoutRef.current)
    autoRetryTimeoutRef.current = null
  }

  function triggerInit(resetAutoRetry = false) {
    if (resetAutoRetry) {
      autoRetryCountRef.current = 0
      clearAutoRetryTimeout()
    }
    initMutation.mutate()
  }

  // Client-side rate limiting — progressive lockout on repeated credential failures
  const rateLimit = useRateLimit('login')

  // Si hay sesión válida pero sin roles compatibles → activar modal de error bloqueante.
  // Cubre tanto login recién completado como sesión restaurada al recargar la página.
  useEffect(() => {
    if (!accessToken) return
    if (roles.length > 0) {
      navigate(resolveRedirectPath(roles), { replace: true })
      return
    }
    try {
      const claims = idToken ? (decodeJwt(idToken) as Record<string, unknown>) : {}
      setError({
        kind: 'NO_ROLE',
        supportCode: 'KG-NO-ROLE',
        userId: typeof claims.sub === 'string' ? claims.sub : 'N/D',
        usernameHint:
          typeof claims.preferred_username === 'string'
            ? claims.preferred_username
            : typeof claims.username === 'string'
              ? claims.username
              : 'N/D',
        rolesDetected: '(sin roles)',
        tenantClaim: typeof claims.tenant_slug === 'string' ? claims.tenant_slug : 'N/D',
        issuer: typeof claims.iss === 'string' ? claims.iss : 'N/D',
        timestamp: new Date().toISOString(),
        actions: [
          { id: 'close-modal', label: 'Cerrar mensaje', kind: 'close', variant: 'secondary' },
          { id: 'logout', label: 'Cerrar sesión', kind: 'logout', variant: 'primary' },
        ],
      })
    } catch {
      setError({
        kind: 'NO_ROLE',
        supportCode: 'KG-NO-ROLE',
        userId: 'N/D',
        usernameHint: 'N/D',
        rolesDetected: '(sin roles)',
        tenantClaim: 'N/D',
        issuer: 'N/D',
        timestamp: new Date().toISOString(),
        actions: [
          { id: 'close-modal', label: 'Cerrar mensaje', kind: 'close', variant: 'secondary' },
          { id: 'logout', label: 'Cerrar sesión', kind: 'logout', variant: 'primary' },
        ],
      })
    }
  }, [accessToken, idToken, roles, navigate, setError])

  // ── Paso 0-1: generate PKCE + call /oauth2/authorize ──────────────────────
  const initMutation = useMutation<AuthorizeData>({
    mutationFn: async () => {
      const verifier = generateCodeVerifier()
      const challenge = await generateCodeChallenge(verifier)
      const state = generateState()
      codeVerifierRef.current = verifier
      return authorize(
        { tenantSlug: TENANT, codeChallenge: challenge, state },
        { timeoutMs: AUTH_TIMEOUT_MS },
      )
    },
    retry: 0, // Config errors (tenant not found, suspended) must not be auto-retried
    onSuccess: () => {
      autoRetryCountRef.current = 0
      clearAutoRetryTimeout()
      isAutoRetryingRef.current = false
      lastAuthErrorRef.current = null // reset so a future disconnect shows the full spinner
      // Clear any previous login error once the session is fresh
      loginMutation.reset()
    },
    onError: () => {
      isAutoRetryingRef.current = false
    },
  })

  // ── Pasos 2-3: POST /account/login + POST /oauth2/token ───────────────────
  const loginMutation = useMutation({
    mutationFn: async (values: LoginFormValues) => {
      const codeVerifier = codeVerifierRef.current
      if (!codeVerifier) throw new Error('PKCE verifier missing')

      loginPhaseRef.current = 'login'
      const { code } = await login({
        tenantSlug: TENANT,
        emailOrUsername: values.emailOrUsername,
        password: values.password,
      }, {
        timeoutMs: AUTH_TIMEOUT_MS,
        idempotencyKey: `kg-login-${TENANT}-${values.emailOrUsername.toLowerCase()}`,
      })

      // Authorization code obtained — any error from here on must trigger re-init
      // because the code is single-use and the session state is now uncertain.
      loginPhaseRef.current = 'post-login'
      const tokens = await exchangeToken(
        { tenantSlug: TENANT, code, codeVerifier },
        {
          timeoutMs: AUTH_TIMEOUT_MS,
          idempotencyKey: `kg-token-exchange-${TENANT}-${code}`,
        },
      )
      const claims = await verifyIdToken(tokens.id_token, TENANT)
      const roles = extractRoles(claims)
      return { tokens, roles }
    },
    onSuccess: ({ tokens, roles }) => {
      rateLimit.recordSuccess()
      setTokens({
        accessToken: tokens.access_token,
        idToken: tokens.id_token,
        refreshToken: tokens.refresh_token,
        roles,
      })
      persistRefreshToken(tokens.refresh_token)
      if (roles.length > 0) {
        navigate(resolveRedirectPath(roles), { replace: true })
      }
      // Sin roles: el useEffect detecta accessToken sin roles y activa el modal bloqueante
    },
    onError: (error, variables) => {
      const phase = loginPhaseRef.current
      loginPhaseRef.current = 'login' // reset for next attempt
      const appError = getAppApiError(error)

      if (isRequestTimeout(error)) {
        toast.error(buildMutationTimeoutMessage(t('auth.errors.timeoutActionLogin'), {
          timeoutMs: AUTH_TIMEOUT_MS,
          retryHint: t('auth.errors.timeoutRetryManual'),
        }))
        return
      }

      if (phase === 'post-login') {
        const isNetwork = appError.httpStatus === undefined
        toast.error(
          isNetwork
            ? t('auth.errors.networkAfterLogin')
            : appError.clientMessage,
        )
        triggerInit(true)
        return
      }

      // phase === 'login': error from POST /account/login
      // RESET_PASSWORD_REQUIRED: redirect to reset-password page with request_id from response
      if (appError.code === 'RESET_PASSWORD_REQUIRED') {
        const requestId = extractResetRequestId(error)
        navigate('/reset-password', {
          state: { requestId, emailOrUsername: variables.emailOrUsername },
          replace: true,
        })
        return
      }

      const { sessionExpired } = extractLoginError(error)
      if (sessionExpired) {
        toast.warning(t('auth.errors.sessionExpiredReconnecting'))
        triggerInit(true)
      } else if (appError.retryable) {
        toast.warning(t('auth.errors.cannotConnectReconnecting'))
        triggerInit(true)
      } else {
        // Credential error (wrong password, account suspended, etc.) — count against rate limit
        rateLimit.recordFailure()
      }
    },
  })

  // Run Pasos 0-1 once on mount (user has not interacted yet).
  // React 18 StrictMode double-invokes effects (mount → cleanup → remount). We use a
  // deferred call via setTimeout so the cleanup has a chance to cancel it before it fires.
  // On the real (final) mount the cleanup never runs, so the timer fires exactly once.
  useEffect(() => {
    if (accessToken) return
    const timerId = window.setTimeout(() => {
      triggerInit(true)
    }, 0)
    return () => {
      window.clearTimeout(timerId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken])

  // While in error state, schedule one controlled retry every AUTH_RETRY_DELAY_MS.
  // The counter is reset only when a new init episode starts (manual retry or explicit re-init).
  // isAutoRetryingRef suppresses the full spinner; toasts provide visual feedback.
  useEffect(() => {
    if (!initMutation.isError) return

    const authError = extractAuthorizeError(initMutation.error)
    if (!authError.retryable) return

    if (AUTH_MAX_RETRIES === 0) return
    if (autoRetryCountRef.current >= AUTH_MAX_RETRIES) return

    const nextAttempt = autoRetryCountRef.current + 1
    const remaining = AUTH_MAX_RETRIES - nextAttempt

    autoRetryTimeoutRef.current = window.setTimeout(() => {
      autoRetryCountRef.current = nextAttempt
      isAutoRetryingRef.current = true

      const toastId = toast.loading(t('auth.errors.reconnecting'))
      initMutation.mutate(undefined, {
        onSuccess: () => {
          toast.success(t('auth.errors.connectionRestored'), { id: toastId })
        },
        onError: (error) => {
          setTimeout(() => {
            if (isRequestTimeout(error)) {
              toast.error(buildMutationTimeoutMessage(t('auth.errors.timeoutActionReconnect'), {
                timeoutMs: AUTH_TIMEOUT_MS,
                retryHint: t('auth.errors.timeoutRetrying'),
              }), { id: toastId })
              return
            }
            if (remaining > 0) {
              toast.error(t('auth.errors.connectionRetryIn5'), { id: toastId })
            } else {
              toast.error(t('auth.errors.connectionManualRetry'), { id: toastId })
            }
          }, 800)
        },
      })
    }, AUTH_RETRY_DELAY_MS)

    return () => {
      clearAutoRetryTimeout()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initMutation.isError, initMutation.error, t])

  // Derived state
  const loginError = loginMutation.error ? extractLoginError(loginMutation.error) : null
  const isReiniting = (loginError?.sessionExpired ?? false) && initMutation.isPending

  const authError = initMutation.error
    ? extractAuthorizeError(initMutation.error)
    : null

  // Keep a snapshot while authError is defined (resets to null while mutation is pending).
  if (authError) lastAuthErrorRef.current = authError

  // ── Render ──────────────────────────────────────────────────────────────────────────────

  function renderCardContent() {
    // Auto-retry in flight: keep error card static — toast provides feedback.
    // Manual retry (onRetry button) and first mount do NOT set isAutoRetryingRef,
    // so they fall through to the InitLoadingState below.
    if (initMutation.isPending && isAutoRetryingRef.current && lastAuthErrorRef.current) {
      return (
        <InitErrorState
          message={lastAuthErrorRef.current.message}
          retryable={lastAuthErrorRef.current.retryable}
          onRetry={() => triggerInit(true)}
          onGoHome={() => navigate('/')}
        />
      )
    }

    if (initMutation.isPending) return <InitLoadingState />

    if (initMutation.isError && authError) {
      return (
        <InitErrorState
          message={authError.message}
          retryable={authError.retryable}
          onRetry={() => triggerInit(true)}
          onGoHome={() => navigate('/')}
        />
      )
    }

    if (initMutation.isSuccess) {
      return (
        <LoginForm
          clientName={initMutation.data.client_name}
          isReiniting={isReiniting}
          isPending={loginMutation.isPending}
          error={loginMutation.error}
          onSubmit={(values) => loginMutation.mutate(values)}
          isLocked={rateLimit.isLocked}
          remainingSeconds={rateLimit.remainingSeconds}
        />
      )
    }

    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 px-4 overflow-hidden relative pb-10">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
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

        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <svg
            className="w-8 h-8 text-indigo-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"
            />
          </svg>
          <Link
            to="/"
            className="text-white font-bold text-2xl tracking-tight hover:text-indigo-300 transition-colors"
          >
            KeyGo
          </Link>
        </div>

        {/* Card */}
        <div className="bg-slate-800/60 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-2xl">
          {renderCardContent()}
        </div>

        {/* Footer — only when form is visible */}
        {initMutation.isSuccess && (
          <div className="mt-6 space-y-2 text-center text-sm">
            <p>
              <Link
                to="/forgot-password"
                className="font-medium text-slate-300 hover:text-white transition-colors underline-offset-2 hover:underline"
              >
                {t('auth.forgotPasswordCta')}
              </Link>
            </p>
            <p className="text-slate-400">
              {t('auth.registerPrompt')}{' '}
              <Link
                to="/register"
                className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                {t('auth.registerCta')}
              </Link>
            </p>
          </div>
        )}
      </div>

      {/* Copyright */}
      <footer className="absolute bottom-3 left-0 right-0 text-center text-xs text-slate-600" role="contentinfo">
        © {new Date().getFullYear()} KeyGo - {t('auth.copyright')}
      </footer>
    </div>
  )
}
