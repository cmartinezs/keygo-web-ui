import { useEffect, useRef } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent, ReactNode } from 'react'
import {
  IconAlertTriangle,
  IconChevronLeft,
  IconShield,
  IconX,
} from '@/shared/ui/icons'

export interface CriticalActionConfirmationTexts {
  warningTitle: string
  warningDescription: string
  confirmationHelpText?: string
  confirmationPhrase?: string
  confirmationLabel?: string
  confirmationPlaceholder?: string
  confirmationExactMatchHint?: string
  continueLabel: string
  cancelLabel: string
  passwordTitle?: string
  passwordDescription?: string
  passwordLabel?: string
  passwordBackLabel?: string
  submitLabel: string
}

export interface CriticalActionConfirmationModalProps {
  isOpen: boolean
  step: 'warning' | 'password'
  requirePassword: boolean
  requireTypedConfirmation: boolean
  texts: CriticalActionConfirmationTexts
  confirmationValue: string
  confirmationErrorMessage: string | null
  password: string
  passwordErrorMessage: string | null
  isPending: boolean
  actionIcon?: ReactNode
  onConfirmationChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onClose: () => void
  onBack: () => void
  onContinue: () => void
  onSubmit: () => void
}

export function CriticalActionConfirmationModal({
  isOpen,
  step,
  requirePassword,
  requireTypedConfirmation,
  texts,
  confirmationValue,
  confirmationErrorMessage,
  password,
  passwordErrorMessage,
  isPending,
  actionIcon,
  onConfirmationChange,
  onPasswordChange,
  onClose,
  onBack,
  onContinue,
  onSubmit,
}: CriticalActionConfirmationModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const confirmationInputRef = useRef<HTMLInputElement>(null)
  const passwordInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const frame = requestAnimationFrame(() => {
      if (step === 'password' && requirePassword) {
        passwordInputRef.current?.focus()
        return
      }
      if (requireTypedConfirmation) {
        confirmationInputRef.current?.focus()
        return
      }
      dialogRef.current?.focus()
    })
    return () => cancelAnimationFrame(frame)
  }, [isOpen, requirePassword, requireTypedConfirmation, step])

  useEffect(() => {
    if (!isOpen || isPending) return
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, isPending, onClose])

  function handleKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'Tab') return

    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
    )

    if (!focusable?.length) return

    const first = focusable[0]
    const last = focusable[focusable.length - 1]

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
      return
    }

    if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={(event) => {
        if (!isPending && event.target === event.currentTarget) onClose()
      }}
    >
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="critical-action-dialog-title"
        aria-describedby="critical-action-dialog-description"
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl outline-none dark:bg-slate-900"
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-full bg-amber-100 p-2 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300">
            <IconAlertTriangle className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2
              id="critical-action-dialog-title"
              className="text-lg font-semibold text-slate-900 dark:text-white"
            >
              {step === 'warning' || !requirePassword
                ? texts.warningTitle
                : texts.passwordTitle ?? texts.warningTitle}
            </h2>
            <p
              id="critical-action-dialog-description"
              className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300"
            >
              {step === 'warning' || !requirePassword
                ? texts.warningDescription
                : texts.passwordDescription ?? texts.warningDescription}
            </p>
          </div>
        </div>

        {step === 'warning' && requireTypedConfirmation && texts.confirmationPhrase && (
          <div className="mt-5 space-y-4">
            {texts.confirmationHelpText && (
              <div
                role="status"
                aria-live="polite"
                className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100"
              >
                <p className="font-medium">{texts.confirmationHelpText}</p>
                <p className="mt-2 rounded-md bg-white/80 px-3 py-2 font-mono text-xs dark:bg-slate-950/40">
                  {texts.confirmationPhrase}
                </p>
              </div>
            )}
            <div>
              {texts.confirmationLabel && (
                <label
                  htmlFor="critical-action-confirmation"
                  className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200"
                >
                  {texts.confirmationLabel}
                </label>
              )}
              <input
                ref={confirmationInputRef}
                id="critical-action-confirmation"
                type="text"
                autoComplete="off"
                spellCheck={false}
                value={confirmationValue}
                onChange={(event) => onConfirmationChange(event.target.value)}
                aria-invalid={!!confirmationErrorMessage}
                aria-describedby={
                  confirmationErrorMessage
                    ? 'critical-action-confirmation-help critical-action-confirmation-error'
                    : texts.confirmationExactMatchHint
                      ? 'critical-action-confirmation-help'
                      : undefined
                }
                className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:bg-slate-800 dark:text-white ${
                  confirmationErrorMessage
                    ? 'border-red-400 dark:border-red-500'
                    : 'border-slate-300 dark:border-white/20'
                }`}
                placeholder={texts.confirmationPlaceholder}
              />
              {texts.confirmationExactMatchHint && (
                <p
                  id="critical-action-confirmation-help"
                  className="mt-2 text-xs text-slate-500 dark:text-slate-400"
                >
                  {texts.confirmationExactMatchHint}
                </p>
              )}
              {confirmationErrorMessage && (
                <p
                  id="critical-action-confirmation-error"
                  role="alert"
                  className="mt-2 text-xs text-red-600 dark:text-red-400"
                >
                  {confirmationErrorMessage}
                </p>
              )}
            </div>
          </div>
        )}

        {step === 'password' && requirePassword && (
          <form
            className="mt-5 space-y-4"
            onSubmit={(event) => {
              event.preventDefault()
              onSubmit()
            }}
          >
            <div>
              {texts.passwordLabel && (
                <label
                  htmlFor="critical-action-password"
                  className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200"
                >
                  {texts.passwordLabel}
                </label>
              )}
              <input
                ref={passwordInputRef}
                id="critical-action-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => onPasswordChange(event.target.value)}
                aria-invalid={!!passwordErrorMessage}
                aria-describedby={passwordErrorMessage ? 'critical-action-password-error' : undefined}
                className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:bg-slate-800 dark:text-white ${
                  passwordErrorMessage
                    ? 'border-red-400 dark:border-red-500'
                    : 'border-slate-300 dark:border-white/20'
                }`}
              />
              {passwordErrorMessage && (
                <p
                  id="critical-action-password-error"
                  role="alert"
                  className="mt-2 text-xs text-red-600 dark:text-red-400"
                >
                  {passwordErrorMessage}
                </p>
              )}
            </div>
          </form>
        )}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          {step === 'password' && requirePassword && (
            <button
              type="button"
              onClick={onBack}
              disabled={isPending}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-60 dark:border-white/15 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <IconChevronLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
              {texts.passwordBackLabel ?? texts.cancelLabel}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-60 dark:border-white/15 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <IconX className="h-4 w-4 shrink-0" aria-hidden="true" />
            {texts.cancelLabel}
          </button>
          <button
            type="button"
            onClick={step === 'warning' ? onContinue : onSubmit}
            disabled={isPending || (step === 'password' && requirePassword && password.trim().length === 0)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:opacity-60"
          >
            {isPending ? (
              <span
                className="h-4 w-4 shrink-0 rounded-full border-2 border-white/30 border-t-white animate-spin"
                aria-hidden="true"
              />
            ) : (
              actionIcon ?? <IconShield className="h-4 w-4 shrink-0" aria-hidden="true" />
            )}
            {step === 'warning' ? texts.continueLabel : texts.submitLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
