import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { AlertCircle, ChevronLeft, ArrowRight } from 'lucide-react';
import axios from 'axios';
import { verifyEmail } from '../registrationApi';
import { EmailVerificationInput } from '@/shared/ui/EmailVerificationInput';

interface AppSelfRegisterConfirmCodeStepProps {
  registrationId: string;
  tenantSlug: string;
  clientId: string;
  onNext: () => void;
  onBack: () => void;
}

export function AppSelfRegisterConfirmCodeStep({
  registrationId,
  tenantSlug,
  clientId,
  onNext,
  onBack,
}: AppSelfRegisterConfirmCodeStepProps) {
  const { t } = useTranslation();
  const [code, setCode] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      verifyEmail(tenantSlug, clientId, {
        registration_id: registrationId,
        code: code,
      }),
    onSuccess: () => {
      onNext();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().length === 6) {
      mutation.mutate();
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          {t('appSelfRegister.steps.confirmCode.title')}
        </h2>
        <p className="mt-2 text-slate-500 text-base">
          {t('appSelfRegister.steps.confirmCode.description')}
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-slate-700">
            {t('appSelfRegister.steps.confirmCode.codeLabel')}{' '}
            <span aria-hidden="true" className="text-red-500">
              *
            </span>
          </span>
          <EmailVerificationInput value={code} onChange={setCode} disabled={mutation.isPending} />
          {mutation.isError && (
            <p className="text-xs text-red-600" role="alert">
              {t('appSelfRegister.steps.confirmCode.invalidCode')}
            </p>
          )}
        </div>

        {mutation.isError && mutation.error && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />
            <p className="text-sm text-red-600">
              {axios.isAxiosError(mutation.error) && mutation.error.response?.data?.failure?.message
                ? mutation.error.response.data.failure.message
                : t('appSelfRegister.steps.confirmCode.error')}
            </p>
          </div>
        )}

        <div className="flex gap-3 justify-between pt-6">
          <button
            type="button"
            onClick={onBack}
            disabled={mutation.isPending}
            className="flex items-center gap-2 border border-slate-300 bg-white hover:bg-slate-50 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed text-slate-900 font-semibold px-8 py-3 rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
          >
            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            {t('appSelfRegister.actions.back')}
          </button>
          <button
            type="submit"
            disabled={code.length !== 6 || mutation.isPending}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-semibold px-8 py-3 rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
          >
            {mutation.isPending
              ? t('appSelfRegister.actions.verifying')
              : t('appSelfRegister.actions.verify')}
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </form>
    </div>
  );
}
