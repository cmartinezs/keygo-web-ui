import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

// ── Schemas ───────────────────────────────────────────────────────────────────

const basePersonalSchema = z.object({
  firstName: z.string().min(2, 'El nombre es requerido'),
  lastName: z.string().min(2, 'Los apellidos son requeridos'),
  email: z.string().email('Introduce un correo electrónico válido'),
})

const companySchema = z.object({
  companyName: z.string().min(2, 'El nombre de la empresa es requerido (mín. 2 caracteres)').optional().or(z.literal('')),
  companyTaxId: z.string().optional(),
  companyAddress: z.string().optional(),
})

const businessSchema = basePersonalSchema.merge(companySchema)

export type ContractorFormValues = z.infer<typeof businessSchema>

// ── Field helpers ─────────────────────────────────────────────────────────────

interface FieldProps {
  id: string
  label: string
  error?: string
  optional?: boolean
  children: React.ReactNode
}

function Field({ id, label, error, optional, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-slate-700">
        {label}{' '}
        {optional ? (
          <span className="text-slate-400 font-normal">(opcional)</span>
        ) : (
          <span aria-hidden="true" className="text-red-500">*</span>
        )}
      </label>
      {children}
      {error && <p className="text-xs text-red-600" role="alert">{error}</p>}
    </div>
  )
}

const INPUT_BASE = 'w-full rounded-lg border px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500'
const inputCls = (hasError: boolean) =>
  `${INPUT_BASE} ${hasError ? 'border-red-400 bg-red-50' : 'border-slate-300 bg-white'}`

// ── Props ─────────────────────────────────────────────────────────────────────

interface ContractorStepProps {
  defaultValues: Partial<ContractorFormValues>
  onBack: () => void
  onNext: (data: ContractorFormValues) => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ContractorStep({ defaultValues, onBack, onNext }: ContractorStepProps) {
  const schema = businessSchema

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ContractorFormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  })

  return (
    <form onSubmit={handleSubmit((data) => onNext(data as ContractorFormValues))} className="flex flex-col gap-6" noValidate>
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900">Tus datos</h2>
        <p className="mt-1 text-slate-500 text-sm">
          Información del titular de la cuenta y, si aplica, de la empresa.
        </p>
      </div>

      <div className="space-y-4">
        {/* Personal info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field id="firstName" label="Nombre" error={errors.firstName?.message}>
            <input
              id="firstName"
              type="text"
              autoComplete="given-name"
              placeholder="Carlos"
              className={inputCls(!!errors.firstName)}
              {...register('firstName')}
            />
          </Field>

          <Field id="lastName" label="Apellidos" error={errors.lastName?.message}>
            <input
              id="lastName"
              type="text"
              autoComplete="family-name"
              placeholder="García López"
              className={inputCls(!!errors.lastName)}
              {...register('lastName')}
            />
          </Field>
        </div>

        <Field id="email" label="Correo electrónico" error={errors.email?.message}>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="tu@email.com"
            className={inputCls(!!errors.email)}
            {...register('email')}
          />
        </Field>

        {/* Company info (optional) */}
        <>
            <div className="border-t border-slate-100 pt-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
                Datos de la empresa
              </p>
            </div>

            <Field id="companyName" label="Nombre de la empresa" optional error={errors.companyName?.message}>
              <input
                id="companyName"
                type="text"
                autoComplete="organization"
                placeholder="Acme Corp S.A."
                className={inputCls(!!errors.companyName)}
                {...register('companyName')}
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field id="companyTaxId" label="RFC / NIF / Tax ID" optional error={errors.companyTaxId?.message}>
                <input
                  id="companyTaxId"
                  type="text"
                  autoComplete="off"
                  placeholder="RFC123456XYZ"
                  className={inputCls(!!errors.companyTaxId)}
                  {...register('companyTaxId')}
                />
              </Field>

              <Field id="companyAddress" label="Dirección fiscal" optional error={errors.companyAddress?.message}>
                <input
                  id="companyAddress"
                  type="text"
                  autoComplete="street-address"
                  placeholder="Av. Reforma 300, CDMX"
                  className={inputCls(!!errors.companyAddress)}
                  {...register('companyAddress')}
                />
              </Field>
            </div>
          </>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 sm:flex-none border border-slate-300 text-slate-600 font-semibold px-6 py-3 rounded-xl hover:bg-slate-50 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          ← Atrás
        </button>
        <button
          type="submit"
          className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-8 py-3 rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
        >
          Continuar →
        </button>
      </div>
    </form>
  )
}
