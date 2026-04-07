import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

interface EmailVerificationStepProps {
  email: string
  isSubmitting: boolean
  error: string | null
  onSubmit: (code: string) => void
  onResend?: () => Promise<void> | void
  isResending?: boolean
}

// ── OTP input: 6 boxes, auto-focus next ──────────────────────────────────────

interface OtpInputProps {
  onComplete: (code: string) => void
  shouldReset: boolean
  onInputChange: () => void
}

function OtpInput({ onComplete, shouldReset, onInputChange }: OtpInputProps) {
  const { t } = useTranslation()
  const [digits, setDigits] = useState<string[]>(Array(6).fill(''))
  const refs = useRef<Array<HTMLInputElement | null>>(Array(6).fill(null))

  useEffect(() => {
    if (!shouldReset) return
    const frame = window.requestAnimationFrame(() => {
      setDigits(Array(6).fill(''))
      refs.current[0]?.focus()
    })
    return () => window.cancelAnimationFrame(frame)
  }, [shouldReset])

  function handleChange(index: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[index] = digit
    setDigits(next)
    onInputChange()

    if (digit && index < 5) {
      refs.current[index + 1]?.focus()
    }

    if (next.every(Boolean)) {
      onComplete(next.join(''))
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus()
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return
    onInputChange()
    const next = Array(6).fill('')
    pasted.split('').forEach((ch, i) => { next[i] = ch })
    setDigits(next)
    refs.current[Math.min(pasted.length, 5)]?.focus()
    if (pasted.length === 6) onComplete(pasted)
  }

  return (
    <div className="flex gap-3 justify-center" onPaste={handlePaste} aria-label={t('subscribe.steps.email.otpAria')}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          aria-label={t('subscribe.steps.email.digitAria', { index: i + 1 })}
          className={`w-11 h-14 text-center text-2xl font-bold rounded-xl border-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
            d ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-slate-300 bg-white text-slate-900'
          }`}
        />
      ))}
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export function EmailVerificationStep({ email, isSubmitting, error, onSubmit, onResend, isResending }: EmailVerificationStepProps) {
  const { t } = useTranslation()
  const [code, setCode] = useState('')
  const [cooldown, setCooldown] = useState(0)
  const [isErrorVisible, setIsErrorVisible] = useState(false)

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  useEffect(() => {
    if (!error) return
    const frame = window.requestAnimationFrame(() => {
      setCode('')
      setIsErrorVisible(true)
    })
    return () => window.cancelAnimationFrame(frame)
  }, [error])

  function handleComplete(otp: string) {
    setCode(otp)
  }

  function handleInputChange() {
    if (isErrorVisible) {
      setIsErrorVisible(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (code.length === 6) onSubmit(code)
  }

  async function handleResend() {
    await onResend?.()
    setCooldown(60)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 items-center text-center" noValidate>
      {/* Icon */}
      <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center" aria-hidden="true">
        <svg className="w-8 h-8 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-slate-900">{t('subscribe.steps.email.title')}</h2>
        <p className="mt-2 text-slate-500 text-sm max-w-sm">
          {t('subscribe.steps.email.descriptionPrefix')}{' '}
          <span className="font-semibold text-slate-700">{email}</span>.
          {` ${t('subscribe.steps.email.descriptionSuffix')}`}
        </p>
      </div>

      <div className="w-full max-w-xs">
        <OtpInput onComplete={handleComplete} shouldReset={Boolean(error)} onInputChange={handleInputChange} />
      </div>

      {error && isErrorVisible && (
        <div className="w-full rounded-lg bg-red-50 border border-red-200 p-4 flex gap-3" role="alert">
          <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <p className="text-sm text-red-700 text-left">{error}</p>
        </div>
      )}

      <p className="text-xs text-slate-400 max-w-sm">
        {t('subscribe.steps.email.helpText')}
      </p>

      <div className="flex justify-end">
      <button
        type="submit"
        disabled={code.length < 6 || isSubmitting}
        className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-semibold px-8 py-3 rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <>
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            {t('subscribe.steps.email.verifying')}
          </>
        ) : (
          <>
            {t('subscribe.steps.email.verifyCode')}
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
          </>
        )}
      </button>
      </div>

      {onResend && (
        <button
          type="button"
          onClick={handleResend}
          disabled={cooldown > 0 || isResending || isSubmitting}
          className="text-sm text-indigo-600 hover:text-indigo-500 disabled:text-slate-400 disabled:cursor-not-allowed underline-offset-2 hover:underline transition-colors"
        >
          {isResending
            ? t('subscribe.steps.email.resending')
            : cooldown > 0
              ? t('subscribe.steps.email.resendIn', { seconds: cooldown })
              : t('subscribe.steps.email.resend')}
        </button>
      )}
    </form>
  )
}
