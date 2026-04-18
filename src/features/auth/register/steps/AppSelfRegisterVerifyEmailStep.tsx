import { useEffect, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { AlertCircle, ChevronLeft, ArrowRight } from 'lucide-react'
import { resendVerification } from '../registrationApi'

interface AppSelfRegisterVerifyEmailStepProps {
  email: string
  tenantSlug: string
  clientId: string
  onNext: () => void
  onBack: () => void
}

const VERIFY_TIMEOUT_SEC = 30 * 60 // 30 minutes

export function AppSelfRegisterVerifyEmailStep({
  email,
  tenantSlug,
  clientId,
  onNext,
  onBack,
}: AppSelfRegisterVerifyEmailStepProps) {
  const { t } = useTranslation()
  const [secondsLeft, setSecondsLeft] = useState(VERIFY_TIMEOUT_SEC)

  useEffect(() => {
    if (secondsLeft <= 0) return
    const timer = setInterval(() => setSecondsLeft((prev) => prev - 1), 1000)
    return () => clearInterval(timer)
  }, [secondsLeft])

  const mutation = useMutation({
    mutationFn: () => resendVerification(tenantSlug, clientId, { email }),
  })

  const handleResend = () => {
    mutation.mutate()
    setSecondsLeft(VERIFY_TIMEOUT_SEC)
  }

  const minutes = Math.floor(secondsLeft / 60)
  const seconds = secondsLeft % 60
  const canResend = secondsLeft === 0

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{t('appSelfRegister.steps.verifyEmail.title')}</h2>
        <p className="mt-2 text-slate-500 text-base">
          {t('appSelfRegister.steps.verifyEmail.description', { email })}
        </p>
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <p className="text-sm text-blue-900">
          {t('appSelfRegister.steps.verifyEmail.sentTo')} <strong>{email}</strong>
        </p>
      </div>

      <div className="space-y-3">
        <p className="text-sm text-slate-600">{t('appSelfRegister.steps.verifyEmail.checkSpam')}</p>
        
        {mutation.isError && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />
            <p className="text-sm text-red-600">{t('appSelfRegister.steps.verifyEmail.resendError')}</p>
          </div>
        )}

        {mutation.isSuccess && (
          <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
            <p className="text-sm text-emerald-700">{t('appSelfRegister.steps.verifyEmail.resendSuccess')}</p>
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={handleResend}
            disabled={!canResend || mutation.isPending}
            className="text-indigo-600 hover:text-indigo-700 disabled:text-slate-400 disabled:cursor-not-allowed font-semibold text-sm"
          >
            {t('appSelfRegister.steps.verifyEmail.resendCode')}
          </button>
          {!canResend && (
            <span className="text-sm text-slate-500">
              ({String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')})
            </span>
          )}
        </div>
      </div>

      <div className="flex gap-3 justify-between pt-4">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-900 font-semibold px-8 py-3 rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
        >
          <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          {t('appSelfRegister.actions.back')}
        </button>
        <button
          type="button"
          onClick={onNext}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-8 py-3 rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
        >
          {t('appSelfRegister.actions.continue')}
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
