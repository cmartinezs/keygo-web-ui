import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createTenant, TENANT_QUERY_KEYS } from '@/api/tenants'
import { toast } from 'sonner'

// ── Validation schema ─────────────────────────────────────────────────────────

const schema = z.object({
  name: z
    .string()
    .min(1, 'El nombre es requerido.')
    .max(255, 'El nombre no puede superar 255 caracteres.'),
  owner_email: z
    .string()
    .min(1, 'El email del propietario es requerido.')
    .email('Ingresa un email válido.'),
})

type FormValues = z.infer<typeof schema>

// ── Field component ───────────────────────────────────────────────────────────

interface FieldProps {
  label: string
  hint?: string
  error?: string
  children: React.ReactNode
}

function Field({ label, hint, error, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
      {children}
      {hint && !error && (
        <span className="text-xs text-slate-400 dark:text-slate-500">{hint}</span>
      )}
      {error && <span className="text-xs text-red-600 dark:text-red-400">{error}</span>}
    </div>
  )
}

// ── Input class helper ────────────────────────────────────────────────────────

const inputClass = (hasError: boolean) =>
  `w-full bg-white dark:bg-slate-800 border rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none transition-colors focus:ring-2 ${
    hasError
      ? 'border-red-400 dark:border-red-500 focus:ring-red-500/30'
      : 'border-slate-300 dark:border-white/10 focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-indigo-500/20'
  }`

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TenantCreatePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const mutation = useMutation({
    mutationFn: createTenant,
    onSuccess: (data) => {
      toast.success(`Tenant "${data.name}" creado correctamente.`)
      queryClient.invalidateQueries({ queryKey: TENANT_QUERY_KEYS.all })
      navigate(`../${data.slug}`, { relative: 'path' })
    },
    onError: (err: Error) => {
      toast.error(err.message ?? 'Error al crear el tenant. Intenta de nuevo.')
    },
  })

  const onSubmit = (values: FormValues) => mutation.mutate(values)
  const isBusy = isSubmitting || mutation.isPending

  return (
    <div className="p-6 max-w-lg space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/admin/tenants')}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
          aria-label="Volver a la lista"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Nuevo Tenant</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            Crea una nueva organización en la plataforma KeyGo.
          </p>
        </div>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-6 space-y-5"
        noValidate
      >
        <Field
          label="Nombre de la organización"
          hint="El slug del tenant se genera automáticamente a partir del nombre."
          error={errors.name?.message}
        >
          <input
            type="text"
            placeholder="Ej: Acme Corporation"
            autoFocus
            {...register('name')}
            className={inputClass(!!errors.name)}
          />
        </Field>

        <Field
          label="Email del propietario"
          hint="Se usará como contacto principal y para el primer acceso."
          error={errors.owner_email?.message}
        >
          <input
            type="email"
            placeholder="propietario@empresa.com"
            {...register('owner_email')}
            className={inputClass(!!errors.owner_email)}
          />
        </Field>

        {/* Info note */}
        <div className="flex items-start gap-2.5 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-lg p-3">
          <svg className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
          </svg>
          <p className="text-xs text-indigo-700 dark:text-indigo-300">
            El slug del tenant (usado en URLs y APIs) se derivará automáticamente del nombre.
            Podrás configurar usuarios y aplicaciones una vez creado.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={() => navigate('/admin/tenants')}
            disabled={isBusy}
            className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isBusy}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors disabled:cursor-not-allowed"
          >
            {isBusy && (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {isBusy ? 'Creando…' : 'Crear tenant'}
          </button>
        </div>
      </form>
    </div>
  )
}
