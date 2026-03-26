import { Link } from 'react-router-dom'

interface SuccessStepProps {
  email: string
  planName: string
}

export function SuccessStep({ email, planName }: SuccessStepProps) {
  return (
    <div className="flex flex-col items-center gap-6 py-8 text-center">
      {/* Icon */}
      <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center" aria-hidden="true">
        <svg className="w-8 h-8 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-slate-900">¡Solicitud recibida!</h2>
        <p className="mt-2 text-slate-500 max-w-sm mx-auto">
          Hemos registrado tu solicitud para el plan <span className="font-semibold text-indigo-700">{planName}</span>.
        </p>
      </div>

      <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-5 max-w-sm w-full">
        <p className="text-sm text-slate-600">
          Recibirás un correo de confirmación en{' '}
          <span className="font-semibold text-slate-800">{email}</span>{' '}
          con los próximos pasos para activar tu cuenta.
        </p>
      </div>

      <div className="flex flex-col gap-2 text-sm text-slate-500 max-w-sm">
        <p>¿No has recibido nada en 10 minutos? Revisa tu carpeta de spam o contáctanos en{' '}
          <a href="mailto:soporte@keygo.io" className="text-indigo-600 hover:underline font-medium">soporte@keygo.io</a>.
        </p>
      </div>

      <Link
        to="/"
        className="mt-2 inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
      >
        ← Volver al inicio
      </Link>
    </div>
  )
}
