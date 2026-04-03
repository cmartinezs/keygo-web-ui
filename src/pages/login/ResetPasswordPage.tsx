import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { resetPasswordWithTemporaryPassword } from '@/api/account'
import { TENANT } from '@/api/client'
import { getAppApiError } from '@/api/errorNormalizer'
import { NETWORK_REQUEST_TIMEOUT_MS } from '@/config/network'
import { isRequestTimeout, notifyMutationTimeout } from '@/lib/network/recovery'

function buildSchema(t: ReturnType<typeof useTranslation>['t']) {
  return z
    .object({
      email: z.string().email(t('authRecovery.errors.invalidEmail')),
      temporary_password: z.string().min(1, t('authRecovery.errors.temporaryPasswordRequired')),
      new_password: z.string().min(8, t('authRecovery.errors.passwordMin')),
      confirm_password: z.string().min(1, t('authRecovery.errors.confirmPasswordRequired')),
    })
    .refine((values) => values.new_password === values.confirm_password, {
      message: t('authRecovery.errors.passwordsMismatch'),
      path: ['confirm_password'],
    })
}

type ResetTemporaryPasswordForm = {
  email: string
  temporary_password: string
  new_password: string
  confirm_password: string
}

export default function ResetPasswordPage() {
  const { t } = useTranslation()
  const [isReset, setIsReset] = useState(false)
  const [showTemporaryPassword, setShowTemporaryPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const schema = useMemo(() => buildSchema(t), [t])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetTemporaryPasswordForm>({ resolver: zodResolver(schema) })

  const mutation = useMutation({
    mutationFn: (values: ResetTemporaryPasswordForm) =>
      resetPasswordWithTemporaryPassword(
        TENANT,
        {
          email: values.email,
          temporary_password: values.temporary_password,
          new_password: values.new_password,
        },
        { timeoutMs: NETWORK_REQUEST_TIMEOUT_MS },
      ),
    onSuccess: () => {
      setIsReset(true)
      toast.success(t('authRecovery.reset.successToast'))
    },
    onError: (error) => {
      if (isRequestTimeout(error)) {
        notifyMutationTimeout(t('authRecovery.reset.timeoutAction'))
        return
      }

      toast.error(getAppApiError(error).clientMessage)
    },
  })

  function onSubmit(values: ResetTemporaryPasswordForm) {
    mutation.mutate(values)
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 px-4 py-10">
      <section
        className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-800/70 p-8 shadow-2xl backdrop-blur"
        aria-labelledby="reset-password-title"
      >
        <h1 id="reset-password-title" className="text-2xl font-bold text-white">
          {t('authRecovery.reset.title')}
        </h1>
        <p className="mt-2 text-sm text-slate-300">{t('authRecovery.reset.subtitle')}</p>

        {isReset ? (
          <div className="mt-6 space-y-4">
            <p role="status" aria-live="polite" className="rounded-lg border border-emerald-500/30 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-300">
              {t('authRecovery.reset.successMessage')}
            </p>
            <Link
              to="/login"
              className="block rounded-lg bg-indigo-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
            >
              {t('authRecovery.reset.goToLogin')}
            </Link>
          </div>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div>
              <label htmlFor="reset-email" className="mb-1 block text-sm font-medium text-slate-200">
                {t('authRecovery.emailLabel')}
              </label>
              <input
                id="reset-email"
                type="email"
                autoComplete="email"
                className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus-visible:ring-2 focus-visible:ring-indigo-500"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'reset-email-error' : undefined}
                {...register('email')}
              />
              {errors.email && (
                <p id="reset-email-error" role="alert" className="mt-1 text-xs text-red-400">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="temporary-password" className="mb-1 block text-sm font-medium text-slate-200">
                {t('authRecovery.reset.temporaryPasswordLabel')}
              </label>
              <div className="relative">
                <input
                  id="temporary-password"
                  type={showTemporaryPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-4 py-2.5 pr-12 text-sm text-white placeholder-slate-500 outline-none transition focus-visible:ring-2 focus-visible:ring-indigo-500"
                  aria-invalid={Boolean(errors.temporary_password)}
                  aria-describedby={errors.temporary_password ? 'temporary-password-error' : undefined}
                  {...register('temporary_password')}
                />
                <button
                  type="button"
                  aria-label={showTemporaryPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                  aria-pressed={showTemporaryPassword}
                  onClick={() => setShowTemporaryPassword((current) => !current)}
                  className="absolute inset-y-0 right-0 z-10 flex w-11 items-center justify-center rounded-r-lg border-l border-white/10 bg-slate-900/60 text-slate-300 transition-colors hover:bg-slate-800/80 hover:text-white focus-visible:ring-2 focus-visible:ring-indigo-400"
                >
                  {showTemporaryPassword ? t('authRecovery.hide') : t('authRecovery.show')}
                </button>
              </div>
              {errors.temporary_password && (
                <p id="temporary-password-error" role="alert" className="mt-1 text-xs text-red-400">
                  {errors.temporary_password.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="new-password" className="mb-1 block text-sm font-medium text-slate-200">
                {t('authRecovery.newPasswordLabel')}
              </label>
              <div className="relative">
                <input
                  id="new-password"
                  type={showNewPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-4 py-2.5 pr-12 text-sm text-white placeholder-slate-500 outline-none transition focus-visible:ring-2 focus-visible:ring-indigo-500"
                  aria-invalid={Boolean(errors.new_password)}
                  aria-describedby={errors.new_password ? 'new-password-error' : undefined}
                  {...register('new_password')}
                />
                <button
                  type="button"
                  aria-label={showNewPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                  aria-pressed={showNewPassword}
                  onClick={() => setShowNewPassword((current) => !current)}
                  className="absolute inset-y-0 right-0 z-10 flex w-11 items-center justify-center rounded-r-lg border-l border-white/10 bg-slate-900/60 text-slate-300 transition-colors hover:bg-slate-800/80 hover:text-white focus-visible:ring-2 focus-visible:ring-indigo-400"
                >
                  {showNewPassword ? t('authRecovery.hide') : t('authRecovery.show')}
                </button>
              </div>
              {errors.new_password && (
                <p id="new-password-error" role="alert" className="mt-1 text-xs text-red-400">
                  {errors.new_password.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="confirm-password" className="mb-1 block text-sm font-medium text-slate-200">
                {t('authRecovery.confirmPasswordLabel')}
              </label>
              <div className="relative">
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-4 py-2.5 pr-12 text-sm text-white placeholder-slate-500 outline-none transition focus-visible:ring-2 focus-visible:ring-indigo-500"
                  aria-invalid={Boolean(errors.confirm_password)}
                  aria-describedby={errors.confirm_password ? 'confirm-password-error' : undefined}
                  {...register('confirm_password')}
                />
                <button
                  type="button"
                  aria-label={showConfirmPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                  aria-pressed={showConfirmPassword}
                  onClick={() => setShowConfirmPassword((current) => !current)}
                  className="absolute inset-y-0 right-0 z-10 flex w-11 items-center justify-center rounded-r-lg border-l border-white/10 bg-slate-900/60 text-slate-300 transition-colors hover:bg-slate-800/80 hover:text-white focus-visible:ring-2 focus-visible:ring-indigo-400"
                >
                  {showConfirmPassword ? t('authRecovery.hide') : t('authRecovery.show')}
                </button>
              </div>
              {errors.confirm_password && (
                <p id="confirm-password-error" role="alert" className="mt-1 text-xs text-red-400">
                  {errors.confirm_password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={mutation.isPending}
              aria-busy={mutation.isPending}
              className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {mutation.isPending ? t('authRecovery.reset.submitting') : t('authRecovery.reset.submit')}
            </button>

            <div className="flex justify-between pt-1 text-sm">
              <Link to="/forgot-password" className="text-slate-300 underline-offset-2 hover:text-white hover:underline">
                {t('authRecovery.reset.needRecoveryToken')}
              </Link>
              <Link to="/login" className="text-slate-300 underline-offset-2 hover:text-white hover:underline">
                {t('authRecovery.backToLogin')}
              </Link>
            </div>
          </form>
        )}
      </section>
    </main>
  )
}
