// ── ChangePasswordForm ─────────────────────────────────────────────────────────
// Formulario de cambio de contraseña del usuario autenticado.
// Patrón: Container (AccountSettingsPage) → esta función presentadora + hook de forma.
// Hace display del estado y llama a onSubmit. No conoce useMutation directamente.

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { TENANT } from '@/shared/api/client'
import { changePassword } from '@/features/account/api'
import { useCurrentUser } from '@/shared/hooks/useCurrentUser'
import { IconShield } from '@/shared/ui/icons'
import { ServerErrorBanner } from '@/shared/ui/ServerErrorBanner'
import { NETWORK_REQUEST_TIMEOUT_MS } from '@/shared/lib/config/network'
import { getAppApiError, getUserMessage } from '@/shared/api/errorNormalizer'
import { applyFieldErrors } from '@/shared/hooks/useFieldErrors'
import { isRequestTimeout, notifyMutationTimeout } from '@/shared/lib/network/recovery'

function buildSchema(t: ReturnType<typeof useTranslation>['t']) {
  return z
    .object({
      current_password: z.string().min(1, t('accountSecurity.errors.currentPasswordRequired')),
      new_password: z
        .string()
        .min(8, t('accountSecurity.errors.newPasswordMin')),
      confirm_new_password: z
        .string()
        .min(1, t('accountSecurity.errors.confirmPasswordRequired')),
    })
    .refine((d) => d.new_password === d.confirm_new_password, {
      message: t('accountSecurity.errors.passwordsMismatch'),
      path: ['confirm_new_password'],
    })
    .refine((d) => d.new_password !== d.current_password, {
      message: t('accountSecurity.errors.newPasswordSameAsCurrent'),
      path: ['new_password'],
    })
}

type FormValues = {
  current_password: string
  new_password: string
  confirm_new_password: string
}

const inputCls = (hasError: boolean) =>
  `w-full rounded-lg border px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 ${
    hasError
      ? 'border-red-400 dark:border-red-500'
      : 'border-slate-300 dark:border-white/20'
  }`

function PasswordField({
  id,
  label,
  registration,
  error,
  show,
  onToggle,
  showLabel,
  hideLabel,
}: {
  id: string
  label: string
  registration: ReturnType<ReturnType<typeof useForm<FormValues>>['register']>
  error?: string
  show: boolean
  onToggle: () => void
  showLabel: string
  hideLabel: string
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
        {label}
      </label>
      <div className="relative">
        <input
          {...registration}
          id={id}
          type={show ? 'text' : 'password'}
          autoComplete={id === 'current_password' ? 'current-password' : 'new-password'}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`${inputCls(!!error)} pr-10`}
        />
        <button
          type="button"
          aria-label={show ? hideLabel : showLabel}
          aria-pressed={show}
          onClick={onToggle}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
        >
          {show ? (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
            </svg>
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
          )}
        </button>
      </div>
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  )
}

export function ChangePasswordForm() {
  const { t } = useTranslation()
  const user = useCurrentUser()
  const tenantSlug = user?.tenantSlug ?? TENANT

  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const schema = buildSchema(t)

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      changePassword(
        tenantSlug,
        {
          current_password: values.current_password,
          new_password: values.new_password,
          confirm_new_password: values.confirm_new_password,
        },
        { timeoutMs: NETWORK_REQUEST_TIMEOUT_MS },
      ),
    onSuccess: () => {
      reset()
      toast.success(t('accountSecurity.changePasswordSuccess'))
    },
    onError: (err) => {
      if (isRequestTimeout(err)) {
        notifyMutationTimeout('cambio de contrasena')
        return
      }
      const appError = getAppApiError(err)
      toast.error(getUserMessage(appError))
      applyFieldErrors(appError, setError, {
        knownFields: ['current_password', 'new_password', 'confirm_new_password'],
      })
    },
  })

  function onSubmit(values: FormValues) {
    mutation.mutate(values)
  }

  return (
    <article
      aria-labelledby="change-password-heading"
      className="rounded-xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900"
    >
      <h2
        id="change-password-heading"
        className="text-base font-semibold text-slate-900 dark:text-white"
      >
        {t('accountSecurity.changePasswordTitle')}
      </h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        {t('accountSecurity.changePasswordDesc')}
      </p>

      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        aria-label={t('accountSecurity.changePasswordTitle')}
        className="mt-5 space-y-4"
      >
        <PasswordField
          id="current_password"
          label={t('accountSecurity.currentPassword')}
          registration={register('current_password')}
          error={errors.current_password?.message}
          show={showCurrent}
          onToggle={() => setShowCurrent((v) => !v)}
          showLabel={t('accountSecurity.showCurrentPassword')}
          hideLabel={t('accountSecurity.hideCurrentPassword')}
        />
        <PasswordField
          id="new_password"
          label={t('accountSecurity.newPassword')}
          registration={register('new_password')}
          error={errors.new_password?.message}
          show={showNew}
          onToggle={() => setShowNew((v) => !v)}
          showLabel={t('accountSecurity.showNewPassword')}
          hideLabel={t('accountSecurity.hideNewPassword')}
        />
        <PasswordField
          id="confirm_new_password"
          label={t('accountSecurity.confirmPassword')}
          registration={register('confirm_new_password')}
          error={errors.confirm_new_password?.message}
          show={showConfirm}
          onToggle={() => setShowConfirm((v) => !v)}
          showLabel={t('accountSecurity.showConfirmPassword')}
          hideLabel={t('accountSecurity.hideConfirmPassword')}
        />

        {/* Errores del servidor no mapeados a campos específicos */}
        <ServerErrorBanner errors={errors} />

        <button
          type="submit"
          disabled={mutation.isPending}
          aria-busy={mutation.isPending}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:ring-offset-slate-900"
        >
          {mutation.isPending ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" aria-hidden="true" />
          ) : (
            <IconShield className="h-4 w-4 shrink-0" aria-hidden="true" />
          )}
          {mutation.isPending
            ? t('accountSecurity.changePasswordLoading')
            : t('accountSecurity.changePasswordSubmit')}
        </button>
      </form>
    </article>
  )
}
