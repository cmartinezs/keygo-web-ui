import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import {
  getBillingContract,
  verifyContractEmail,
  mockApprovePayment,
  activateBillingContract,
  resendContractVerificationEmail,
} from '@/api/billing'
import type { AppContract } from '@/types/billing'
import { env } from '@/config/env'
import { EmailVerificationStep } from './steps/EmailVerificationStep'
import { AppFooter } from '@/components/AppFooter'

const IS_DEV = env.DEV

// ── Phase machine ─────────────────────────────────────────────────────────────

type Phase = 'lookup' | 'loading' | 'verify-email' | 'payment' | 'done' | 'terminal'

// ── Sub-components ────────────────────────────────────────────────────────────

interface LookupFormProps {
  inputId: string
  onChange: (v: string) => void
  onSubmit: (e: React.FormEvent) => void
  isLoading: boolean
  error: string | null
}

function LookupForm({ inputId, onChange, onSubmit, isLoading, error }: LookupFormProps) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6" noValidate>
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-indigo-100 mb-4" aria-hidden="true">
          <svg className="w-7 h-7 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Continuar contratación</h2>
        <p className="mt-2 text-slate-500 text-sm max-w-sm mx-auto">
          Si iniciaste el proceso de contratación y no lo completaste, ingresa tu ID de contrato para retomarlo.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="contractId" className="text-sm font-medium text-slate-700">
          ID de contrato <span aria-hidden="true" className="text-red-500">*</span>
        </label>
        <input
          id="contractId"
          type="text"
          autoComplete="off"
          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
          value={inputId}
          onChange={(e) => onChange(e.target.value.trim())}
          className={`w-full rounded-lg border px-3 py-2.5 text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
            error ? 'border-red-400 bg-red-50' : 'border-slate-300 bg-white'
          }`}
          aria-describedby={error ? 'contractId-error' : 'contractId-hint'}
        />
        {error ? (
          <p id="contractId-error" className="text-xs text-red-600" role="alert">{error}</p>
        ) : (
          <p id="contractId-hint" className="text-xs text-slate-400">
            Puedes encontrarlo en el correo de confirmación que recibiste al iniciar el proceso.
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={!inputId || isLoading}
        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-semibold px-8 py-3 rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            Buscando…
          </>
        ) : (
          'Continuar →'
        )}
      </button>

      <p className="text-center text-sm text-slate-500">
        ¿Aún no tienes un contrato?{' '}
        <Link to="/subscribe" className="font-semibold text-indigo-600 hover:text-indigo-500">
          Iniciar contratación
        </Link>
      </p>
    </form>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

interface PaymentViewProps {
  isProcessing: boolean
  error: string | null
  onConfirm: () => void
}

function PaymentView({ isProcessing, error, onConfirm }: PaymentViewProps) {
  return (
    <div className="flex flex-col gap-6 items-center text-center">
      <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center" aria-hidden="true">
        <svg className="w-8 h-8 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-slate-900">Confirma el pago</h2>
        <p className="mt-2 text-slate-500 text-sm max-w-sm">
          Tu correo fue verificado. Completa el pago para activar tu cuenta.
        </p>
      </div>

      {error && (
        <div className="w-full rounded-lg bg-red-50 border border-red-200 p-4 flex gap-3" role="alert">
          <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <p className="text-sm text-red-700 text-left">{error}</p>
        </div>
      )}

      {IS_DEV ? (
        <div className="w-full flex flex-col gap-3">
          <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>Modo desarrollo — pago simulado</span>
          </div>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isProcessing}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-semibold px-8 py-3 rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Procesando…
              </>
            ) : (
              'Simular aprobación de pago (DEV)'
            )}
          </button>
        </div>
      ) : (
        <p className="text-sm text-slate-500 max-w-sm">
          La integración de pagos estará disponible próximamente. Contacta con soporte si necesitas activar tu cuenta.
        </p>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

function DoneView({ email }: { email: string }) {
  return (
    <div className="flex flex-col items-center gap-6 py-4 text-center">
      <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center" aria-hidden="true">
        <svg className="w-10 h-10 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>

      <div>
        <h2 className="text-3xl font-extrabold text-slate-900">¡Cuenta activada!</h2>
        <p className="mt-2 text-slate-500 max-w-sm mx-auto">
          Tu suscripción ha sido activada exitosamente.
        </p>
      </div>

      <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-5 max-w-sm w-full text-left space-y-2">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-0.5">Correo de acceso</p>
          <p className="font-semibold text-slate-800">{email}</p>
        </div>
        <p className="text-sm text-slate-600 pt-1">
          Recibirás un correo con tus credenciales en breve.
        </p>
      </div>

      <Link
        to="/login"
        className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-8 py-3 rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
      >
        Ir a iniciar sesión →
      </Link>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

interface TerminalViewProps {
  type: 'active' | 'unrecoverable'
}

function TerminalView({ type }: TerminalViewProps) {
  const isActive = type === 'active'
  return (
    <div className="flex flex-col items-center gap-6 py-4 text-center">
      <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isActive ? 'bg-emerald-100' : 'bg-amber-100'}`} aria-hidden="true">
        <svg
          className={`w-8 h-8 ${isActive ? 'text-emerald-600' : 'text-amber-600'}`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
        >
          {isActive ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          )}
        </svg>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          {isActive ? 'Contrato ya activado' : 'Contrato no disponible'}
        </h2>
        <p className="mt-2 text-slate-500 text-sm max-w-sm mx-auto">
          {isActive
            ? 'Este contrato ya fue procesado. Tu cuenta está activa, puedes iniciar sesión.'
            : 'Este contrato ha expirado o fue cancelado. Por favor, inicia un nuevo proceso de contratación.'}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        {isActive ? (
          <Link
            to="/login"
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-8 py-3 rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
          >
            Ir a iniciar sesión →
          </Link>
        ) : (
          <>
            <Link
              to="/subscribe"
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            >
              Nueva contratación
            </Link>
            <button
              type="button"
              onClick={() => window.history.back()}
              className="border border-slate-300 text-slate-600 font-semibold px-6 py-3 rounded-xl hover:bg-slate-50 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              Volver
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ResumeContractPage() {
  const [inputId, setInputId] = useState('')
  const [contract, setContract] = useState<AppContract | null>(null)
  const [phase, setPhase] = useState<Phase>('lookup')
  const [terminalType, setTerminalType] = useState<'active' | 'unrecoverable'>('unrecoverable')

  const [isLoading, setIsLoading] = useState(false)
  const [lookupError, setLookupError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processError, setProcessError] = useState<string | null>(null)
  const [isResending, setIsResending] = useState(false)

  // ── Handlers ───────────────────────────────────────────────────────────────

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault()
    const id = inputId.trim()
    if (!id) return

    setLookupError(null)
    setIsLoading(true)
    setPhase('loading')

    try {
      const c = await getBillingContract(id)
      setContract(c)

      if (c.status === 'PENDING_EMAIL_VERIFICATION') {
        setPhase('verify-email')
      } else if (c.status === 'PENDING_PAYMENT' || c.status === 'READY_TO_ACTIVATE') {
        setPhase('payment')
      } else if (c.status === 'ACTIVE' || c.status === 'SUPERSEDED' || c.status === 'FINALIZED') {
        setTerminalType('active')
        setPhase('terminal')
      } else {
        // EXPIRED | CANCELLED | FAILED
        setTerminalType('unrecoverable')
        setPhase('terminal')
      }
    } catch {
      setPhase('lookup')
      setLookupError('No encontramos un contrato con ese ID. Verifica el dato e inténtalo de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleEmailVerification(code: string) {
    if (!contract) return
    setIsProcessing(true)
    setProcessError(null)
    try {
      const updated = await verifyContractEmail(contract.id, { code })
      setContract(updated)
      setPhase('payment')
    } catch {
      setProcessError('El código es incorrecto o ha expirado. Solicita uno nuevo con el enlace de abajo.')
    } finally {
      setIsProcessing(false)
    }
  }

  async function handleResend() {
    if (!contract) return
    setIsResending(true)
    try {
      await resendContractVerificationEmail(contract.id)
      toast.success('Código reenviado. Revisa tu bandeja de entrada.')
    } catch {
      toast.error('No se pudo reenviar el código. Inténtalo de nuevo más tarde.')
    } finally {
      setIsResending(false)
    }
  }

  async function handlePayment() {
    if (!contract) return
    setIsProcessing(true)
    setProcessError(null)
    try {
      if (contract.status !== 'READY_TO_ACTIVATE') {
        await mockApprovePayment(contract.id)
      }
      await activateBillingContract(contract.id)
      toast.success('¡Cuenta activada exitosamente!')
      setPhase('done')
    } catch {
      setProcessError('No se pudo completar la activación. Por favor, inténtalo de nuevo.')
    } finally {
      setIsProcessing(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 font-bold text-slate-900 text-lg focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
          >
            <svg className="w-6 h-6 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
            </svg>
            <span>KeyGo</span>
          </Link>
          <Link to="/login" className="text-sm text-slate-500 hover:text-indigo-600 transition-colors">
            ¿Ya tienes cuenta?{' '}
            <span className="font-semibold text-indigo-600">Iniciar sesión</span>
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center py-10 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-10">

            {(phase === 'lookup' || phase === 'loading') && (
              <LookupForm
                inputId={inputId}
                onChange={setInputId}
                onSubmit={handleLookup}
                isLoading={isLoading}
                error={lookupError}
              />
            )}

            {phase === 'verify-email' && contract && (
              <EmailVerificationStep
                email={contract.contractor_email}
                isSubmitting={isProcessing}
                error={processError}
                onSubmit={handleEmailVerification}
                onResend={handleResend}
                isResending={isResending}
              />
            )}

            {phase === 'payment' && (
              <PaymentView
                isProcessing={isProcessing}
                error={processError}
                onConfirm={handlePayment}
              />
            )}

            {phase === 'done' && contract && (
              <DoneView email={contract.contractor_email} />
            )}

            {phase === 'terminal' && (
              <TerminalView type={terminalType} />
            )}

          </div>
        </div>
      </main>

      <AppFooter />
    </div>
  )
}
