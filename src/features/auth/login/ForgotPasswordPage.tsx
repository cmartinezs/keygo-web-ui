import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { forgotPassword } from '@/features/account/api'
import { TENANT } from '@/shared/api/client'
import { getAppApiError } from '@/shared/api/errorNormalizer'
import { NETWORK_REQUEST_TIMEOUT_MS } from '@/shared/lib/config/network'
import { isRequestTimeout, notifyMutationTimeout } from '@/shared/lib/network/recovery'

function buildSchema(t: ReturnType<typeof useTranslation>['t']) {
  return z.object({
    email: z.string().email(t('authRecovery.errors.invalidEmail')),
  })
}

type ForgotPasswordForm = {
  email: string
}

export default function ForgotPasswordPage() {
  const { t } = useTranslation()
  const [isSubmitted, setIsSubmitted] = useState(false)

  const schema = buildSchema(t)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>({ resolver: zodResolver(schema) })

  const mutation = useMutation({
    mutationFn: (values: ForgotPasswordForm) =>
      forgotPassword(TENANT, { email: values.email }, { timeoutMs: NETWORK_REQUEST_TIMEOUT_MS }),
    onSuccess: () => {
      setIsSubmitted(true)
      toast.success(t('authRecovery.forgot.successToast'))
    },
    onError: (error) => {
      if (isRequestTimeout(error)) {
        notifyMutationTimeout(t('authRecovery.forgot.timeoutAction'))
        return
      }

      toast.error(getAppApiError(error).clientMessage)
    },
  })

  function onSubmit(values: ForgotPasswordForm) {
    mutation.mutate(values)
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 px-4 py-10">
      <section
        className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-800/70 p-8 shadow-2xl backdrop-blur"
        aria-labelledby="forgot-password-title"
      >
        <h1 id="forgot-password-title" className="text-2xl font-bold text-white">
          {t('authRecovery.forgot.title')}
        </h1>
        <p className="mt-2 text-sm text-slate-300">{t('authRecovery.forgot.subtitle')}</p>

        {isSubmitted ? (
          <div className="mt-6 space-y-4">
            <p role="status" aria-live="polite" className="rounded-lg border border-emerald-500/30 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-300">
              {t('authRecovery.forgot.successMessage')}
            </p>
            <div className="flex flex-col gap-3">
              <Link
                to="/recover-password"
                className="rounded-lg bg-indigo-600 px-4 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
              >
                {t('authRecovery.forgot.goToRecover')}
              </Link>
              <Link
                to="/login"
                className="rounded-lg border border-white/20 px-4 py-2.5 text-center text-sm font-medium text-slate-200 transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              >
                {t('authRecovery.backToLogin')}
              </Link>
            </div>
          </div>
        ) : (
          <form className="mt-6 space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div>
              <label htmlFor="forgot-email" className="mb-1 block text-sm font-medium text-slate-200">
                {t('authRecovery.emailLabel')}
              </label>
              <input
                id="forgot-email"
                type="email"
                autoComplete="email"
                className="w-full rounded-lg border border-white/15 bg-slate-900/70 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus-visible:ring-2 focus-visible:ring-indigo-500"
                placeholder="you@example.com"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'forgot-email-error' : undefined}
                {...register('email')}
              />
              {errors.email && (
                <p id="forgot-email-error" role="alert" className="mt-1 text-xs text-red-400">
                  {errors.email.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={mutation.isPending}
              aria-busy={mutation.isPending}
              className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {mutation.isPending ? t('authRecovery.forgot.submitting') : t('authRecovery.forgot.submit')}
            </button>

            <div className="pt-2 text-center">
              <Link
                to="/login"
                className="text-sm text-slate-300 underline-offset-2 transition-colors hover:text-white hover:underline"
              >
                {t('authRecovery.backToLogin')}
              </Link>
            </div>
          </form>
        )}
      </section>
    </main>
  )
}
