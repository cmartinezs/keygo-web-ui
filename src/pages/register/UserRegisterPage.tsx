import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { registerUser } from '@/api/users'

// ── Steps ─────────────────────────────────────────────────────────────────────

const STEPS = [
  { label: 'Tu empresa' },
  { label: 'Tus datos' },
] as const

// ── Step indicator ────────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
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

// ── Step 1 — Company ──────────────────────────────────────────────────────────

const companySchema = z.object({
  tenantSlug: z
    .string()
    .min(1, 'El identificador de empresa es obligatorio')
    .regex(/^[a-z0-9-]+$/, 'Solo letras en minúscula, números y guiones'),
  clientId: z
    .string()
    .min(1, 'El ID de aplicación es obligatorio'),
})

type CompanyValues = z.infer<typeof companySchema>

function CompanyStep({
  defaultValues,
  onNext,
}: {
  defaultValues: Partial<CompanyValues>
  onNext: (data: CompanyValues) => void
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CompanyValues>({
    resolver: zodResolver(companySchema),
    defaultValues,
  })

  return (
    <form onSubmit={handleSubmit(onNext)} noValidate>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Identifica tu empresa</h2>
        <p className="text-slate-500 text-sm max-w-md mx-auto">
          Ingresa el identificador de tu empresa en KeyGo. Si no lo conoces, consulta
          con el administrador de tu organización.
        </p>
      </div>

      <div className="max-w-md mx-auto space-y-5">
        {/* Tenant slug */}
        <div>
          <label htmlFor="tenantSlug" className="block text-sm font-medium text-slate-700 mb-1.5">
            Identificador de empresa <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <input
            id="tenantSlug"
            type="text"
            autoComplete="off"
            placeholder="ej: mi-empresa"
            {...register('tenantSlug')}
            className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 bg-white outline-none transition-colors
              focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
              ${errors.tenantSlug ? 'border-red-400 bg-red-50' : 'border-slate-300 hover:border-slate-400'}`}
          />
          {errors.tenantSlug && (
            <p className="mt-1.5 text-xs text-red-600" role="alert">{errors.tenantSlug.message}</p>
          )}
          <p className="mt-1.5 text-xs text-slate-400">
            Solo minúsculas, números y guiones. Ejemplo: <code className="font-mono bg-slate-100 px-1 rounded">acme-corp</code>
          </p>
        </div>

        {/* Client ID */}
        <div>
          <label htmlFor="clientId" className="block text-sm font-medium text-slate-700 mb-1.5">
            ID de aplicación <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <input
            id="clientId"
            type="text"
            autoComplete="off"
            placeholder="ej: mi-empresa-app"
            {...register('clientId')}
            className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 bg-white outline-none transition-colors
              focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
              ${errors.clientId ? 'border-red-400 bg-red-50' : 'border-slate-300 hover:border-slate-400'}`}
          />
          {errors.clientId && (
            <p className="mt-1.5 text-xs text-red-600" role="alert">{errors.clientId.message}</p>
          )}
          <p className="mt-1.5 text-xs text-slate-400">
            Proporcionado por el administrador de tu organización junto con el identificador de empresa.
          </p>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2.5 px-4 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            Continuar
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* No tenant CTA */}
      <div className="mt-8 pt-6 border-t border-slate-100 text-center">
        <p className="text-sm text-slate-500 mb-3">
          ¿Tu empresa aún no usa KeyGo?
        </p>
        <Link
          to="/subscribe"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Contratar KeyGo para tu organización
        </Link>
      </div>
    </form>
  )
}

// ── Step 2 — Personal data ────────────────────────────────────────────────────

const personalSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  username: z.string().min(1, 'El nombre de usuario es obligatorio').max(100),
  email: z.string().min(1, 'El correo es obligatorio').email('Ingresa un correo válido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  confirmPassword: z.string().min(1, 'Confirma tu contraseña'),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

type PersonalValues = z.infer<typeof personalSchema>

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
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PersonalValues>({ resolver: zodResolver(personalSchema) })

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
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Tus datos personales</h2>
        <p className="text-slate-500 text-sm max-w-md mx-auto">
          Completa tu información. El administrador de tu empresa deberá aprobar
          tu solicitud antes de que puedas acceder.
        </p>
      </div>

      <div className="max-w-md mx-auto space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {field('firstName', 'Nombre', 'text', false, 'Juan')}
          {field('lastName', 'Apellido', 'text', false, 'Pérez')}
        </div>
        {field('username', 'Nombre de usuario', 'text', true, 'juanperez')}
        {field('email', 'Correo corporativo', 'email', true, 'juan@miempresa.com')}
        {field('password', 'Contraseña', 'password', true, 'Mínimo 8 caracteres')}
        {field('confirmPassword', 'Confirmar contraseña', 'password', true, 'Repite la contraseña')}

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
            className="flex-1 border border-slate-300 hover:border-slate-400 text-slate-700 text-sm font-semibold py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50"
          >
            Atrás
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2.5 px-4 rounded-lg transition-colors disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            {isSubmitting ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Registrando…
              </>
            ) : (
              'Crear cuenta'
            )}
          </button>
        </div>
      </div>
    </form>
  )
}

// ── Success state ─────────────────────────────────────────────────────────────

function SuccessState({ email }: { email: string }) {
  const navigate = useNavigate()
  return (
    <div className="text-center py-6 max-w-md mx-auto">
      <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-5">
        <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
        </svg>
      </div>

      <h2 className="text-2xl font-bold text-slate-900 mb-3">¡Solicitud enviada!</h2>

      <p className="text-slate-500 text-sm mb-2">
        Hemos enviado un correo de verificación a{' '}
        <strong className="text-slate-700">{email}</strong>.
      </p>
      <p className="text-slate-500 text-sm mb-6">
        Una vez que verifiques tu correo, el administrador de tu empresa revisará
        y aprobará tu acceso. Recibirás una notificación cuando esté listo.
      </p>

      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-left mb-6">
        <div className="flex items-start gap-2">
          <svg className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <p className="text-xs text-amber-700">
            El enlace de verificación caduca en <strong>30 minutos</strong>. Revisa tu bandeja de spam si no lo encuentras.
          </p>
        </div>
      </div>

      <button
        onClick={() => navigate('/login')}
        className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2.5 px-4 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500"
      >
        Ir al inicio de sesión
      </button>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function UserRegisterPage() {
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
        firstName: data.firstName || undefined,
        lastName: data.lastName || undefined,
      })
      setRegisteredEmail(data.email)
    } catch (err) {
      const msg = err instanceof Error ? err.message : null
      if (msg?.toLowerCase().includes('not found') || msg?.includes('404')) {
        setSubmitError(
          'No se encontró la empresa o la aplicación. Verifica el identificador con tu administrador.',
        )
      } else if (msg?.toLowerCase().includes('duplicate') || msg?.includes('409') || msg?.toLowerCase().includes('conflict')) {
        setSubmitError('Ya existe una cuenta con ese correo o nombre de usuario.')
      } else {
        setSubmitError('Ha ocurrido un error al crear tu cuenta. Inténtalo de nuevo.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex flex-col">
      {/* Top bar */}
      <header className="py-4 px-6 border-b border-white/60 bg-white/70 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg"
            aria-label="Volver al inicio"
          >
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
    </div>
  )
}
