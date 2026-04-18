import { useTranslation } from 'react-i18next';
import type { UseFormRegisterReturn } from 'react-hook-form';
import { PasswordRepeatForm } from '@/shared/ui/PasswordRepeatForm';
import type { PasswordRequirement } from '@/shared/ui/PasswordRequirements';

interface ResetPasswordFieldsProps {
  passwordRegister: UseFormRegisterReturn;
  confirmRegister: UseFormRegisterReturn;
  passwordValue: string;
  confirmValue: string;
  passwordError?: string;
  confirmError?: string;
  disabled?: boolean;
}

export function ResetPasswordFields({
  passwordRegister,
  confirmRegister,
  passwordValue,
  confirmValue,
  passwordError,
  confirmError,
  disabled,
}: ResetPasswordFieldsProps) {
  const { t } = useTranslation();

  const criteria: PasswordRequirement[] = [
    { key: 'min', ok: passwordValue.length >= 12, label: t('authRecovery.errors.passwordMin') },
    { key: 'upper', ok: /[A-Z]/.test(passwordValue), label: t('authRecovery.errors.passwordUppercase') },
    { key: 'lower', ok: /[a-z]/.test(passwordValue), label: t('authRecovery.errors.passwordLowercase') },
    { key: 'digit', ok: /\d/.test(passwordValue), label: t('authRecovery.errors.passwordDigit') },
    { key: 'special', ok: /[^A-Za-z0-9]/.test(passwordValue), label: t('authRecovery.errors.passwordSpecial') },
  ];

  return (
    <PasswordRepeatForm
      variant="dark"
      passwordRegister={passwordRegister}
      confirmRegister={confirmRegister}
      passwordValue={passwordValue}
      confirmValue={confirmValue}
      passwordError={passwordError}
      confirmError={confirmError}
      criteria={criteria}
      disabled={disabled}
      passwordId="new-password"
      confirmId="confirm-password"
      passwordAutoComplete="new-password"
      confirmAutoComplete="new-password"
      labels={{
        password: t('authRecovery.newPasswordLabel'),
        confirmPassword: t('authRecovery.confirmPasswordLabel'),
        showPassword: t('auth.showPassword'),
        hidePassword: t('auth.hidePassword'),
        passwordsMatch: t('authRecovery.passwordsMatch'),
        passwordsMismatch: t('authRecovery.errors.passwordsMismatch'),
      }}
    />
  );
}
