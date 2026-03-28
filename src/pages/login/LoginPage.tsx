import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import { authorize, login, exchangeToken } from '@/api/auth'
import { generateCodeVerifier, generateCodeChallenge, generateState } from '@/auth/pkce'
import { verifyIdToken, extractRoles } from '@/auth/jwksVerify'
import { useTokenStore } from '@/auth/tokenStore'
import { persistRefreshToken } from '@/auth/refresh'
import { TENANT } from '@/api/client'
import { useRateLimit } from '@/hooks/useRateLimit'
import { useHoneypot } from '@/hooks/useHoneypot'
import { HoneypotField } from '@/components/HoneypotField'
import { TurnstileWidget } from '@/components/TurnstileWidget'
import type { BaseResponse } from '@/types/base'
import type { AppRole } from '@/types/roles'
import type { AuthorizeData } from '@/types/auth'

const TURNSTILE_ENABLED = Boolean(import.meta.env.VITE_TURNSTILE_SITE_KEY)

// ── Schemas ─────────────────────────────────────────────────────────────────

const loginSchema = z.object({
  emailOrUsername: z.string().min(1, 'El usuario o correo es requerido'),
  password: z.string().min(1, 'La contraseña es requerida'),
})

type LoginFormValues = z.infer<typeof loginSchema>

// ── Helpers ──────────────────────────────────────────────────────────────────

function resolveRedirectPath(roles: AppRole[]): string {
  if (roles.includes('ADMIN')) return '/admin/dashboard'
  if (roles.includes('ADMIN_TENANT')) return '/tenant-admin/dashboard'
  if (roles.includes('USER_TENANT')) return '/dashboard'
  return '/'
}

/**
 * Maps Paso 1 (GET /oauth2/authorize) errors to user-facing messages.
 * These occur before the form is shown.
 */
function extractAuthorizeError(error: unknown): { message: string; retryable: boolean } {
  if (axios.isAxiosError(error) && error.response) {
    const body = error.response.data as BaseResponse<unknown>
    const code = body.failure?.code
    if (code === 'RESOURCE_NOT_FOUND')
      return {
        message: 'La aplicación o el tenant no están disponibles. Contacta al administrador.',
        retryable: false,
      }
    if (code === 'BUSINESS_RULE_VIOLATION')
      return {
        message: 'El acceso está suspendido temporalmente. Contacta al administrador.',
        retryable: false,
      }
    if (code === 'INVALID_INPUT')
      return {
        message: 'Error de configuración de la aplicación. Contacta al administrador.',
        retryable: false,
      }
    if (body.failure?.message) return { message: body.failure.message, retryable: false }
  }
  return {
    message:
      'No se pudo conectar con el servidor de autenticación. Puedes volver a intentarlo ahora o más tarde.',
    retryable: true,
  }
}

/**
 * Maps Paso 2 (POST /account/login) errors to user-facing messages.
 * `sessionExpired` signals Pasos 0-1 must be re-run before retrying.
 */
function extractLoginError(error: unknown): { message: string; sessionExpired: boolean } {
  if (axios.isAxiosError(error) && error.response) {
    const body = error.response.data as BaseResponse<unknown>
    const code = body.failure?.code
    if (code === 'AUTHENTICATION_REQUIRED')
      return { message: 'Credenciales incorrectas. Vuelve a intentarlo.', sessionExpired: false }
    if (code === 'BUSINESS_RULE_VIOLATION')
      return {
        message: 'Tu cuenta no tiene acceso a esta aplicación.',
        sessionExpired: false,
      }
    if (code === 'EMAIL_NOT_VERIFIED')
      return {
        message: 'Correo pendiente de verificación. Revisa tu bandeja de entrada.',
        sessionExpired: false,
      }
    if (code === 'RESOURCE_NOT_FOUND')
      return { message: 'Usuario no encontrado.', sessionExpired: false }
    // INVALID_INPUT in this step → no prior session; Pasos 0-1 must be re-run
    if (code === 'INVALID_INPUT')
      return {
        message: 'Tu sesión de inicio expiró. Por favor, vuelve a intentarlo.',
        sessionExpired: true,
      }
    if (body.failure?.message) return { message: body.failure.message, sessionExpired: false }
  }
  return { message: 'Error de conexión. Vuelve a intentarlo.', sessionExpired: false }
}

// ── Sub-components ───────────────────────────────────────────────────────────

/** Shown while Pasos 0-1 are running (before the user sees anything interactive). */
function InitLoadingState() {
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
      <p className="text-slate-400 text-sm">Preparando sesión segura…</p>
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
            Reintentar ahora
          </button>
        )}
        <button
          onClick={onGoHome}
          className="flex-1 border border-white/20 hover:border-white/40 hover:bg-white/5 text-slate-300 text-sm font-medium py-2.5 px-4 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-white/30"
        >
          Volver más tarde
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
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) })

  const honeypot = useHoneypot()
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)

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
        <h1 className="text-2xl font-bold text-white">Iniciar sesión</h1>
        <p className="text-slate-400 text-sm mt-1">
          {clientName ? `Accediendo a ${clientName}` : 'Accede con tus credenciales'}
        </p>
      </div>

      {/* Session-expiry reinit indicator */}
      {isReiniting && (
        <div className="mb-4 flex items-center justify-center gap-2 text-amber-400 text-sm" role="status" aria-live="polite">
          <svg className="w-4 h-4 animate-spin shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          Reiniciando sesión…
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
            Demasiados intentos fallidos. Espera{' '}
            <strong>{remainingSeconds} s</strong> antes de volver a intentarlo.
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
            Correo electrónico o usuario
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
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            disabled={isDisabled}
            className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition disabled:opacity-50"
            placeholder="••••••••"
            {...register('password')}
          />
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
              Autenticando…
            </>
          ) : (
            'Iniciar sesión'
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
  const navigate = useNavigate()
  const { accessToken, roles, setTokens } = useTokenStore()
  const codeVerifierRef = useRef<string | null>(null)
  const isAutoRetryingRef = useRef(false)
  const lastAuthErrorRef = useRef<{ message: string; retryable: boolean } | null>(null)
  const loginPhaseRef = useRef<'login' | 'post-login'>('login')

  // Client-side rate limiting — progressive lockout on repeated credential failures
  const rateLimit = useRateLimit('login')

  // Redirect if already authenticated
  useEffect(() => {
    if (accessToken) navigate(resolveRedirectPath(roles), { replace: true })
  }, [accessToken, roles, navigate])

  // ── Paso 0-1: generate PKCE + call /oauth2/authorize ──────────────────────
  const initMutation = useMutation<AuthorizeData>({
    mutationFn: async () => {
      const verifier = generateCodeVerifier()
      const challenge = await generateCodeChallenge(verifier)
      const state = generateState()
      codeVerifierRef.current = verifier
      return authorize({ tenantSlug: TENANT, codeChallenge: challenge, state })
    },
    retry: 0, // Config errors (tenant not found, suspended) must not be auto-retried
    onSuccess: () => {
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
      })

      // Authorization code obtained — any error from here on must trigger re-init
      // because the code is single-use and the session state is now uncertain.
      loginPhaseRef.current = 'post-login'
      const tokens = await exchangeToken({ tenantSlug: TENANT, code, codeVerifier })
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
      navigate(resolveRedirectPath(roles), { replace: true })
    },
    onError: (error) => {
      const phase = loginPhaseRef.current
      loginPhaseRef.current = 'login' // reset for next attempt

      if (phase === 'post-login') {
        const isNetwork = axios.isAxiosError(error) && !error.response
        toast.error(
          isNetwork
            ? 'Error de conexión al procesar el acceso. Por favor, intenta de nuevo.'
            : 'No se pudo completar el acceso. Por favor, intenta de nuevo.',
        )
        initMutation.mutate()
        return
      }

      // phase === 'login': error from POST /account/login
      const { sessionExpired } = extractLoginError(error)
      const networkError = axios.isAxiosError(error) && !error.response
      if (sessionExpired) {
        toast.warning('Tu sesión expiró. Reconectando…')
        initMutation.mutate()
      } else if (networkError) {
        toast.warning('Error de conexión. Reconectando…')
        initMutation.mutate()
      } else {
        // Credential error (wrong password, account suspended, etc.) — count against rate limit
        rateLimit.recordFailure()
      }
    },
  })

  // Run Pasos 0-1 once on mount (user has not interacted yet)
  useEffect(() => {
    initMutation.mutate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // While in error state, retry every 10 s — backend may have come back up.
  // Once initMutation succeeds the interval stops (isError becomes false).
  // If a login attempt later fails with a network error, loginMutation.onError
  // calls initMutation.mutate() again → transitions back to isError → interval restarts.
  // isAutoRetryingRef suppresses the spinner; the toast provides all visual feedback.
  useEffect(() => {
    if (!initMutation.isError) return
    const id = setInterval(() => {
      isAutoRetryingRef.current = true
      const toastId = toast.loading('Intentando reconectar…')
      setTimeout(() => {
        initMutation.mutate(undefined, {
          onSuccess: () => {
            toast.success('Conexión restablecida', { id: toastId })
          },
          onError: () => {
            setTimeout(() => {
              toast.error('Sin conexión. Reintentando en 10 s…', { id: toastId })
            }, 800)
          },
        })
      }, 600)
    }, 10_000)
    return () => clearInterval(id)
  }, [initMutation.isError, initMutation.mutate])

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
          onRetry={() => initMutation.mutate()}
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
          onRetry={() => initMutation.mutate()}
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 px-4 overflow-hidden relative">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
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
          <p className="text-center text-slate-500 text-xs mt-6">
            ¿Aún no tienes cuenta?{' '}
            <Link
              to="/register"
              className="text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Regístrate
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}

