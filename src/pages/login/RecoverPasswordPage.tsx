import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { recoverPassword } from '@/api/account'
import { TENANT } from '@/api/client'
import { getAppApiError } from '@/api/errorNormalizer'
import { NETWORK_REQUEST_TIMEOUT_MS } from '@/config/network'
import { isRequestTimeout, notifyMutationTimeout } from '@/lib/network/recovery'

function buildSchema(t: ReturnType<typeof useTranslation>['t']) {
  return z
    .object({
      recovery_token: z.string().min(1, t('authRecovery.errors.tokenRequired')),
      new_password: z.string().min(8, t('authRecovery.errors.passwordMin')),
      confirm_password: z.string().min(1, t('authRecovery.errors.confirmPasswordRequired')),
    })
    .refine((values) => values.new_password === values.confirm_password, {
      message: t('authRecovery.errors.passwordsMismatch'),
      path: ['confirm_password'],
    })
}

type RecoverPasswordForm = {
  recovery_token: string
  new_password: string
  confirm_password: string
}

export default function RecoverPasswordPage() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const tokenFromQuery = searchParams.get('token') ?? ''
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isRecovered, setIsRecovered] = useState(false)

  const schema = useMemo(() => buildSchema(t), [t])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RecoverPasswordForm>({
    resolver: zodResolver(schema),
    defaultValues: { recovery_token: tokenFromQuery, new_password: '', confirm_password: '' },
  })

  const mutation = useMutation({
    mutationFn: (values: RecoverPasswordForm) =>
      recoverPassword(
        TENANT,
        {
          recovery_token: values.recovery_token,
          new_password: values.new_password,
        },
        { timeoutMs: NETWORK_REQUEST_TIMEOUT_MS },
      ),
    onSuccess: () => {
      setIsRecovered(true)
      toast.success(t('authRecovery.recover.successToast'))
    },
    onError: (error) => {
      if (isRequestTimeout(error)) {
        notifyMutationTimeout(t('authRecovery.recover.timeoutAction'))
        return
      }

      toast.error(getAppApiError(error).clientMessage)
    },
  })

  function onSubmit(values: RecoverPasswordForm) {
    mutation.mutate(values)
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 px-4 py-10">
      <section
        className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-800/70 p-8 shadow-2xl backdrop-blur"
        aria-labelledby="recover-password-title"
      >
        <h1 id="recover-password-title" className="text-2xl font-bold text-white">
          {t('authRecovery.recover.title')}
        </h1>
        <p className="mt-2 text-sm text-slate-300">{t('authRecovery.recover.subtitle')}</p>

        {isRecovered ? (
          <div className="mt-6 space-y-4">
            <p role="status" aria-live="polite" className="rounded-lg border border-emerald-500/30 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-300">
              {t('authRecovery.recover.successMessage')}
            </p>
            <Link
              to="/login"
              className="block rounded-lg bg-indigo-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
            >
              {t('authRecovery.recover.goToLogin')}
            </Link>
          </div>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div>
              <label htmlFor="recover-token" className="mb-1 block text-sm font-medium text-slate-200">
                {t('authRecovery.recover.tokenLabel')}
              </label>
              <input
                id="recover-token"
                type="text"
                autoComplete="off"
                className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus-visible:ring-2 focus-visible:ring-indigo-500"
                aria-invalid={Boolean(errors.recovery_token)}
                aria-describedby={errors.recovery_token ? 'recover-token-error' : undefined}
                {...register('recovery_token')}
              />
              {errors.recovery_token && (
                <p id="recover-token-error" role="alert" className="mt-1 text-xs text-red-400">
                  {errors.recovery_token.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="recover-new-password" className="mb-1 block text-sm font-medium text-slate-200">
                {t('authRecovery.newPasswordLabel')}
              </label>
              <div className="relative">
                <input
                  id="recover-new-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-4 py-2.5 pr-12 text-sm text-white placeholder-slate-500 outline-none transition focus-visible:ring-2 focus-visible:ring-indigo-500"
                  aria-invalid={Boolean(errors.new_password)}
                  aria-describedby={errors.new_password ? 'recover-new-password-error' : undefined}
                  {...register('new_password')}
                />
                <button
                  type="button"
                  aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute inset-y-0 right-0 z-10 flex w-11 items-center justify-center rounded-r-lg border-l border-white/10 bg-slate-900/60 text-slate-300 transition-colors hover:bg-slate-800/80 hover:text-white focus-visible:ring-2 focus-visible:ring-indigo-400"
                >
                  {showPassword ? t('authRecovery.hide') : t('authRecovery.show')}
                </button>
              </div>
              {errors.new_password && (
                <p id="recover-new-password-error" role="alert" className="mt-1 text-xs text-red-400">
                  {errors.new_password.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="recover-confirm-password" className="mb-1 block text-sm font-medium text-slate-200">
                {t('authRecovery.confirmPasswordLabel')}
              </label>
              <div className="relative">
                <input
                  id="recover-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-4 py-2.5 pr-12 text-sm text-white placeholder-slate-500 outline-none transition focus-visible:ring-2 focus-visible:ring-indigo-500"
                  aria-invalid={Boolean(errors.confirm_password)}
                  aria-describedby={errors.confirm_password ? 'recover-confirm-password-error' : undefined}
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
                <p id="recover-confirm-password-error" role="alert" className="mt-1 text-xs text-red-400">
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
              {mutation.isPending ? t('authRecovery.recover.submitting') : t('authRecovery.recover.submit')}
            </button>

            <div className="flex justify-between pt-1 text-sm">
              <Link to="/forgot-password" className="text-slate-300 underline-offset-2 hover:text-white hover:underline">
                {t('authRecovery.recover.needToken')}
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
