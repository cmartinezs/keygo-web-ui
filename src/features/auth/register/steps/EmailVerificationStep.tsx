import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { IconCheckmark, IconRefresh } from '@/shared/ui/icons/definitions';
import { EmailVerificationInput } from '@/shared/ui/EmailVerificationInput';

interface EmailVerificationStepProps {
  email: string;
  isSubmitting: boolean;
  error: string | null;
  onSubmit: (code: string) => void;
  onResend?: () => Promise<void> | void;
  isResending?: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function EmailVerificationStep({
  email,
  isSubmitting,
  error,
  onSubmit,
  onResend,
  isResending,
}: EmailVerificationStepProps) {
  const { t } = useTranslation();
  const [code, setCode] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [isErrorVisible, setIsErrorVisible] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  useEffect(() => {
    if (!error) return;
    const frame = window.requestAnimationFrame(() => {
      setCode('');
      setIsErrorVisible(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [error]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (code.length === 6) onSubmit(code);
  }

  async function handleResend() {
    await onResend?.();
    setCooldown(60);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-6 items-center text-center"
      noValidate
    >
      {/* Icon */}
      <div
        className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center"
        aria-hidden="true"
      >
        <svg
          className="w-8 h-8 text-indigo-600"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
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
        <EmailVerificationInput
          value={code}
          onChange={(value) => {
            setCode(value);
            if (isErrorVisible) setIsErrorVisible(false);
          }}
        />
      </div>

      {error && isErrorVisible && (
        <div
          className="w-full rounded-lg bg-red-50 border border-red-200 p-4 flex gap-3"
          role="alert"
        >
          <svg
            className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <p className="text-sm text-red-700 text-left">{error}</p>
        </div>
      )}

      <p className="text-xs text-slate-400 max-w-sm">{t('subscribe.steps.email.helpText')}</p>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={code.length < 6 || isSubmitting}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-semibold px-8 py-3 rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <svg
                className="h-4 w-4 animate-spin shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
              {t('subscribe.steps.email.verifying')}
            </>
          ) : (
            <>
              <IconCheckmark className="h-4 w-4 shrink-0" aria-hidden="true" />
              {t('subscribe.steps.email.verifyCode')}
            </>
          )}
        </button>
      </div>

      {onResend && (
        <button
          type="button"
          onClick={handleResend}
          disabled={cooldown > 0 || isResending || isSubmitting}
          className="inline-flex items-center justify-center gap-2 text-sm text-indigo-600 hover:text-indigo-500 disabled:text-slate-400 disabled:cursor-not-allowed underline-offset-2 hover:underline transition-colors"
        >
          {isResending ? (
            <>
              <svg
                className="h-4 w-4 animate-spin shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
              {t('subscribe.steps.email.resending')}
            </>
          ) : (
            <>
              <IconRefresh className="h-4 w-4 shrink-0" aria-hidden="true" />
              {cooldown > 0
                ? t('subscribe.steps.email.resendIn', { seconds: cooldown })
                : t('subscribe.steps.email.resend')}
            </>
          )}
        </button>
      )}
    </form>
  );
}
