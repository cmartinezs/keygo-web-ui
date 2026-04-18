import { useState } from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';
import { Eye, EyeOff } from 'lucide-react';
import { PasswordRequirements, type PasswordRequirement } from './PasswordRequirements';

export type PasswordRepeatVariant = 'dark' | 'light';

export interface PasswordRepeatLabels {
  password: string;
  confirmPassword: string;
  showPassword: string;
  hidePassword: string;
  passwordsMatch: string;
  passwordsMismatch: string;
}

interface PasswordRepeatFormProps {
  passwordRegister: UseFormRegisterReturn;
  confirmRegister: UseFormRegisterReturn;
  passwordValue: string;
  confirmValue: string;
  passwordError?: string;
  confirmError?: string;
  criteria: PasswordRequirement[];
  labels: PasswordRepeatLabels;
  passwordPlaceholder?: string;
  confirmPlaceholder?: string;
  passwordAutoComplete?: string;
  confirmAutoComplete?: string;
  passwordId?: string;
  confirmId?: string;
  disabled?: boolean;
  required?: boolean;
  variant?: PasswordRepeatVariant;
}

type VariantStyles = {
  label: string;
  input: string;
  inputOk: string;
  inputError: string;
  toggle: string;
  errorText: string;
  asterisk: string;
  matchOk: string;
  matchPending: string;
};

const VARIANTS: Record<PasswordRepeatVariant, VariantStyles> = {
  dark: {
    label: 'block text-sm font-medium text-slate-200',
    input:
      'w-full rounded-lg border bg-slate-900/70 px-4 py-2.5 pr-12 text-sm text-white placeholder-slate-500 outline-none transition focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60',
    inputOk: 'border-white/15',
    inputError: 'border-red-500',
    toggle:
      'absolute inset-y-0 right-0 z-10 flex w-11 items-center justify-center rounded-r-lg border-l border-white/10 bg-slate-900/60 text-slate-300 transition-colors hover:bg-slate-800/80 hover:text-white focus-visible:ring-2 focus-visible:ring-indigo-400',
    errorText: 'mt-1 text-xs text-red-400',
    asterisk: 'text-red-400',
    matchOk: 'text-emerald-400',
    matchPending: 'text-slate-400',
  },
  light: {
    label: 'block text-sm font-medium text-slate-700',
    input:
      'w-full rounded-lg border px-3 py-2.5 pr-12 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60',
    inputOk: 'border-slate-300 bg-white',
    inputError: 'border-red-400 bg-red-50',
    toggle:
      'absolute inset-y-0 right-0 z-10 flex w-11 items-center justify-center rounded-r-lg border-l border-slate-200 bg-slate-50 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-indigo-400',
    errorText: 'mt-1 text-xs text-red-600',
    asterisk: 'text-red-500',
    matchOk: 'text-emerald-600',
    matchPending: 'text-slate-400',
  },
};

export function PasswordRepeatForm({
  passwordRegister,
  confirmRegister,
  passwordValue,
  confirmValue,
  passwordError,
  confirmError,
  criteria,
  labels,
  passwordPlaceholder,
  confirmPlaceholder,
  passwordAutoComplete = 'new-password',
  confirmAutoComplete = 'new-password',
  passwordId = 'password',
  confirmId = 'confirm-password',
  disabled,
  required,
  variant = 'light',
}: PasswordRepeatFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const styles = VARIANTS[variant];
  const passwordsMatch = confirmValue.length > 0 && passwordValue === confirmValue;
  const inputClass = (hasError: boolean) =>
    `${styles.input} ${hasError ? styles.inputError : styles.inputOk}`;

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor={passwordId} className={styles.label}>
          {labels.password}
          {required && (
            <>
              {' '}
              <span aria-hidden="true" className={styles.asterisk}>
                *
              </span>
            </>
          )}
        </label>
        <div className="relative">
          <input
            id={passwordId}
            type={showPassword ? 'text' : 'password'}
            autoComplete={passwordAutoComplete}
            placeholder={passwordPlaceholder}
            disabled={disabled}
            aria-invalid={Boolean(passwordError)}
            aria-describedby={passwordError ? `${passwordId}-error` : undefined}
            className={inputClass(Boolean(passwordError))}
            {...passwordRegister}
          />
          <button
            type="button"
            aria-label={showPassword ? labels.hidePassword : labels.showPassword}
            aria-pressed={showPassword}
            onClick={() => setShowPassword((current) => !current)}
            className={styles.toggle}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Eye className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
        {passwordError && (
          <p id={`${passwordId}-error`} role="alert" className={styles.errorText}>
            {passwordError}
          </p>
        )}
        {passwordValue.length > 0 && (
          <PasswordRequirements requirements={criteria} variant={variant} />
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor={confirmId} className={styles.label}>
          {labels.confirmPassword}
          {required && (
            <>
              {' '}
              <span aria-hidden="true" className={styles.asterisk}>
                *
              </span>
            </>
          )}
        </label>
        <div className="relative">
          <input
            id={confirmId}
            type={showConfirm ? 'text' : 'password'}
            autoComplete={confirmAutoComplete}
            placeholder={confirmPlaceholder}
            disabled={disabled}
            aria-invalid={Boolean(confirmError)}
            aria-describedby={confirmError ? `${confirmId}-error` : undefined}
            className={inputClass(Boolean(confirmError))}
            {...confirmRegister}
          />
          <button
            type="button"
            aria-label={showConfirm ? labels.hidePassword : labels.showPassword}
            aria-pressed={showConfirm}
            onClick={() => setShowConfirm((current) => !current)}
            className={styles.toggle}
          >
            {showConfirm ? (
              <EyeOff className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Eye className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
        {confirmError && (
          <p id={`${confirmId}-error`} role="alert" className={styles.errorText}>
            {confirmError}
          </p>
        )}
        {confirmValue.length > 0 && !confirmError && (
          <p
            className={`mt-1 flex items-center gap-1.5 text-xs ${passwordsMatch ? styles.matchOk : styles.matchPending}`}
          >
            {passwordsMatch ? (
              <svg
                className="w-3.5 h-3.5 shrink-0"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg
                className="w-3.5 h-3.5 shrink-0"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            {passwordsMatch ? labels.passwordsMatch : labels.passwordsMismatch}
          </p>
        )}
      </div>
    </div>
  );
}
