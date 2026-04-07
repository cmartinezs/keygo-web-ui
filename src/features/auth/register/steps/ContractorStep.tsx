import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { IconChevronLeft, IconArrowRight } from '@/shared/ui/icons/definitions'

// ── Schemas ───────────────────────────────────────────────────────────────────

function createBusinessSchema(t: (key: string) => string) {
  const basePersonalSchema = z.object({
    firstName: z.string().min(2, t('subscribe.steps.contractor.validation.firstNameRequired')),
    lastName: z.string().min(2, t('subscribe.steps.contractor.validation.lastNameRequired')),
    email: z.string().email(t('subscribe.steps.contractor.validation.emailInvalid')),
  })

  const companySchema = z.object({
    companyName: z.string().min(2, t('subscribe.steps.contractor.validation.companyNameRequired')).optional().or(z.literal('')),
    companyTaxId: z.string().optional(),
    companyAddress: z.string().optional(),
  })

  return basePersonalSchema.merge(companySchema)
}

export type ContractorFormValues = {
  firstName: string
  lastName: string
  email: string
  companyName?: string
  companyTaxId?: string
  companyAddress?: string
}

// ── Field helpers ─────────────────────────────────────────────────────────────

interface FieldProps {
  id: string
  label: string
  error?: string
  optional?: boolean
  children: React.ReactNode
}

function Field({ id, label, error, optional, children }: FieldProps) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-slate-700">
        {label}{' '}
        {optional ? (
          <span className="text-slate-400 font-normal">({t('subscribe.common.optional')})</span>
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
  const { t } = useTranslation()
  const schema = useMemo(() => createBusinessSchema(t), [t])

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
        <h2 className="text-2xl font-bold text-slate-900">{t('subscribe.steps.contractor.title')}</h2>
        <p className="mt-1 text-slate-500 text-sm">
          {t('subscribe.steps.contractor.description')}
        </p>
      </div>

      <div className="space-y-4">
        {/* Personal info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field id="firstName" label={t('subscribe.steps.contractor.fields.firstName')} error={errors.firstName?.message}>
            <input
              id="firstName"
              type="text"
              autoComplete="given-name"
              placeholder={t('subscribe.steps.contractor.placeholders.firstName')}
              className={inputCls(!!errors.firstName)}
              {...register('firstName')}
            />
          </Field>

          <Field id="lastName" label={t('subscribe.steps.contractor.fields.lastName')} error={errors.lastName?.message}>
            <input
              id="lastName"
              type="text"
              autoComplete="family-name"
              placeholder={t('subscribe.steps.contractor.placeholders.lastName')}
              className={inputCls(!!errors.lastName)}
              {...register('lastName')}
            />
          </Field>
        </div>

        <Field id="email" label={t('subscribe.steps.contractor.fields.email')} error={errors.email?.message}>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder={t('subscribe.steps.contractor.placeholders.email')}
            className={inputCls(!!errors.email)}
            {...register('email')}
          />
        </Field>

        {/* Company info (optional) */}
        <>
            <div className="border-t border-slate-100 pt-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
                {t('subscribe.steps.contractor.companySection')}
              </p>
            </div>

            <Field id="companyName" label={t('subscribe.steps.contractor.fields.companyName')} optional error={errors.companyName?.message}>
              <input
                id="companyName"
                type="text"
                autoComplete="organization"
                placeholder={t('subscribe.steps.contractor.placeholders.companyName')}
                className={inputCls(!!errors.companyName)}
                {...register('companyName')}
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field id="companyTaxId" label={t('subscribe.steps.contractor.fields.companyTaxId')} optional error={errors.companyTaxId?.message}>
                <input
                  id="companyTaxId"
                  type="text"
                  autoComplete="off"
                  placeholder={t('subscribe.steps.contractor.placeholders.companyTaxId')}
                  className={inputCls(!!errors.companyTaxId)}
                  {...register('companyTaxId')}
                />
              </Field>

              <Field id="companyAddress" label={t('subscribe.steps.contractor.fields.companyAddress')} optional error={errors.companyAddress?.message}>
                <input
                  id="companyAddress"
                  type="text"
                  autoComplete="street-address"
                  placeholder={t('subscribe.steps.contractor.placeholders.companyAddress')}
                  className={inputCls(!!errors.companyAddress)}
                  {...register('companyAddress')}
                />
              </Field>
            </div>
          </>
      </div>

      <div className="flex justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center justify-center gap-2 border border-slate-300 text-slate-600 font-semibold px-6 py-3 rounded-xl hover:bg-slate-50 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <IconChevronLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
          {t('subscribe.actions.back')}
        </button>
        <button
          type="submit"
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-8 py-3 rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
        >
          {t('subscribe.actions.continue')}
          <IconArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
        </button>
      </div>
    </form>
  )
}
