import { Link } from 'react-router-dom'

interface SuccessStepProps {
  email: string
  planName: string
}

export function SuccessStep({ email, planName }: SuccessStepProps) {
  return (
    <div className="flex flex-col items-center gap-6 py-8 text-center">
      {/* Icon */}
      <div className="relative">
        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center" aria-hidden="true">
          <svg className="w-10 h-10 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>

      <div>
        <h2 className="text-3xl font-extrabold text-slate-900">¡Cuenta activada!</h2>
        <p className="mt-2 text-slate-500 max-w-sm mx-auto">
          Tu suscripción al plan{' '}
          <span className="font-semibold text-indigo-700">{planName}</span>{' '}
          ha sido activada exitosamente.
        </p>
      </div>

      <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-5 max-w-sm w-full text-left space-y-2.5">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-0.5">Correo de acceso</p>
          <p className="font-semibold text-slate-800">{email}</p>
        </div>
        <p className="text-sm text-slate-600 pt-1">
          Recibirás un correo con tus credenciales de acceso en breve. Usa el botón de abajo para iniciar sesión.
        </p>
      </div>

      <Link
        to="/login"
        className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-8 py-3 rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
      >
        Ir a iniciar sesión →
      </Link>

      <Link
        to="/"
        className="text-sm text-slate-400 hover:text-indigo-600 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
      >
        ← Volver al inicio
      </Link>
    </div>
  )
}
