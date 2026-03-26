import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const COUNTRIES = [
  { value: 'ES', label: 'España' },
  { value: 'MX', label: 'México' },
  { value: 'AR', label: 'Argentina' },
  { value: 'CO', label: 'Colombia' },
  { value: 'CL', label: 'Chile' },
  { value: 'PE', label: 'Perú' },
  { value: 'VE', label: 'Venezuela' },
  { value: 'EC', label: 'Ecuador' },
  { value: 'GT', label: 'Guatemala' },
  { value: 'US', label: 'Estados Unidos' },
  { value: 'GB', label: 'Reino Unido' },
  { value: 'DE', label: 'Alemania' },
  { value: 'FR', label: 'Francia' },
  { value: 'PT', label: 'Portugal' },
  { value: 'BR', label: 'Brasil' },
  { value: 'OTHER', label: 'Otro' },
]

const contractorSchema = z.object({
  organizationName: z.string().min(2, 'El nombre de la organización es requerido (mín. 2 caracteres)'),
  firstName: z.string().min(2, 'El nombre es requerido'),
  lastName: z.string().min(2, 'Los apellidos son requeridos'),
  email: z.string().email('Introduce un correo electrónico válido'),
  phone: z.string().optional(),
  country: z.string().min(1, 'Selecciona un país'),
})

export type ContractorFormValues = z.infer<typeof contractorSchema>

interface ContractorStepProps {
  defaultValues: Partial<ContractorFormValues>
  onBack: () => void
  onNext: (data: ContractorFormValues) => void
}

export function ContractorStep({ defaultValues, onBack, onNext }: ContractorStepProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ContractorFormValues>({
    resolver: zodResolver(contractorSchema),
    defaultValues,
  })

  return (
    <form onSubmit={handleSubmit(onNext)} className="flex flex-col gap-6" noValidate>
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900">Datos del contratante</h2>
        <p className="mt-1 text-slate-500 text-sm">Información de la organización y el responsable del contrato.</p>
      </div>

      <div className="space-y-4">
        {/* Organization name */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="organizationName" className="text-sm font-medium text-slate-700">
            Nombre de la organización <span aria-hidden="true" className="text-red-500">*</span>
          </label>
          <input
            id="organizationName"
            type="text"
            autoComplete="organization"
            placeholder="Acme Corp S.L."
            className={`w-full rounded-lg border px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              errors.organizationName ? 'border-red-400 bg-red-50' : 'border-slate-300 bg-white'
            }`}
            {...register('organizationName')}
          />
          {errors.organizationName && (
            <p className="text-xs text-red-600" role="alert">{errors.organizationName.message}</p>
          )}
        </div>

        {/* First + Last name */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="firstName" className="text-sm font-medium text-slate-700">
              Nombre <span aria-hidden="true" className="text-red-500">*</span>
            </label>
            <input
              id="firstName"
              type="text"
              autoComplete="given-name"
              placeholder="Carlos"
              className={`w-full rounded-lg border px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                errors.firstName ? 'border-red-400 bg-red-50' : 'border-slate-300 bg-white'
              }`}
              {...register('firstName')}
            />
            {errors.firstName && (
              <p className="text-xs text-red-600" role="alert">{errors.firstName.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="lastName" className="text-sm font-medium text-slate-700">
              Apellidos <span aria-hidden="true" className="text-red-500">*</span>
            </label>
            <input
              id="lastName"
              type="text"
              autoComplete="family-name"
              placeholder="García López"
              className={`w-full rounded-lg border px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                errors.lastName ? 'border-red-400 bg-red-50' : 'border-slate-300 bg-white'
              }`}
              {...register('lastName')}
            />
            {errors.lastName && (
              <p className="text-xs text-red-600" role="alert">{errors.lastName.message}</p>
            )}
          </div>
        </div>

        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium text-slate-700">
            Correo electrónico <span aria-hidden="true" className="text-red-500">*</span>
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="carlos@acme.com"
            className={`w-full rounded-lg border px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              errors.email ? 'border-red-400 bg-red-50' : 'border-slate-300 bg-white'
            }`}
            {...register('email')}
          />
          {errors.email && (
            <p className="text-xs text-red-600" role="alert">{errors.email.message}</p>
          )}
        </div>

        {/* Phone + Country */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="phone" className="text-sm font-medium text-slate-700">
              Teléfono <span className="text-slate-400 font-normal">(opcional)</span>
            </label>
            <input
              id="phone"
              type="tel"
              autoComplete="tel"
              placeholder="+34 612 345 678"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              {...register('phone')}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="country" className="text-sm font-medium text-slate-700">
              País <span aria-hidden="true" className="text-red-500">*</span>
            </label>
            <select
              id="country"
              className={`w-full rounded-lg border px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                errors.country ? 'border-red-400 bg-red-50' : 'border-slate-300 bg-white'
              }`}
              {...register('country')}
            >
              <option value="">Selecciona un país</option>
              {COUNTRIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            {errors.country && (
              <p className="text-xs text-red-600" role="alert">{errors.country.message}</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="border border-slate-300 hover:border-slate-400 text-slate-600 font-medium px-6 py-2.5 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-slate-400"
        >
          ← Atrás
        </button>
        <button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-8 py-2.5 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
        >
          Continuar →
        </button>
      </div>
    </form>
  )
}
