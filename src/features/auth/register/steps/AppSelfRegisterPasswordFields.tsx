import { useTranslation } from 'react-i18next';
import type { UseFormRegisterReturn } from 'react-hook-form';
import { PasswordRepeatForm } from '@/shared/ui/PasswordRepeatForm';
import type { PasswordRequirement } from '@/shared/ui/PasswordRequirements';

interface AppSelfRegisterPasswordFieldsProps {
  passwordRegister: UseFormRegisterReturn;
  confirmRegister: UseFormRegisterReturn;
  passwordValue: string;
  confirmValue: string;
  passwordError?: string;
  confirmError?: string;
  disabled?: boolean;
}

export function AppSelfRegisterPasswordFields({
  passwordRegister,
  confirmRegister,
  passwordValue,
  confirmValue,
  passwordError,
  confirmError,
  disabled,
}: AppSelfRegisterPasswordFieldsProps) {
  const { t } = useTranslation();

  const criteria: PasswordRequirement[] = [
    {
      key: 'min',
      ok: passwordValue.length >= 12,
      label: t('appSelfRegister.steps.form.validation.passwordMinLength'),
    },
    {
      key: 'upper',
      ok: /[A-Z]/.test(passwordValue),
      label: t('appSelfRegister.steps.form.validation.passwordUppercase'),
    },
    {
      key: 'lower',
      ok: /[a-z]/.test(passwordValue),
      label: t('appSelfRegister.steps.form.validation.passwordLowercase'),
    },
    {
      key: 'digit',
      ok: /[0-9]/.test(passwordValue),
      label: t('appSelfRegister.steps.form.validation.passwordNumber'),
    },
    {
      key: 'special',
      ok: /[!@#$%^&*]/.test(passwordValue),
      label: t('appSelfRegister.steps.form.validation.passwordSpecial'),
    },
  ];

  return (
    <PasswordRepeatForm
      variant="light"
      required
      passwordRegister={passwordRegister}
      confirmRegister={confirmRegister}
      passwordValue={passwordValue}
      confirmValue={confirmValue}
      passwordError={passwordError}
      confirmError={confirmError}
      criteria={criteria}
      disabled={disabled}
      passwordId="password"
      confirmId="confirm-password"
      passwordPlaceholder="••••••••"
      confirmPlaceholder="••••••••"
      labels={{
        password: t('appSelfRegister.steps.form.password'),
        confirmPassword: t('appSelfRegister.steps.form.confirmPassword'),
        showPassword: t('auth.showPassword'),
        hidePassword: t('auth.hidePassword'),
        passwordsMatch: t('appSelfRegister.steps.form.validation.passwordsMatch'),
        passwordsMismatch: t('appSelfRegister.steps.form.validation.passwordsMismatch'),
      }}
    />
  );
}
