import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { AlertCircle, ChevronLeft, ArrowRight, Loader2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { registerUser } from '../registrationApi';
import { platformCheckEmail, platformAuthorize } from '@/features/auth/api';
import { generateCodeVerifier, generateCodeChallenge } from '@/shared/lib/auth/pkce';
import type { RegisterRequest } from '@/shared/types/user';
import { AppSelfRegisterPasswordFields } from './AppSelfRegisterPasswordFields';
import { NETWORK_REQUEST_TIMEOUT_MS } from '@/shared/lib/config/network';

export interface AppSelfRegisterFormDraft {
  first_name: string;
  last_name: string;
  email: string;
}

interface AppSelfRegisterFormStepProps {
  tenantSlug: string;
  clientId: string;
  tenantName: string;
  appName: string;
  onNext: (email: string, registrationId: string) => void;
  onBack: () => void;
  defaultValues?: AppSelfRegisterFormDraft;
  onValuesChange?: (draft: AppSelfRegisterFormDraft) => void;
}

const INPUT_BASE =
  'w-full rounded-lg border px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500';
const inputCls = (hasError: boolean) =>
  `${INPUT_BASE} ${hasError ? 'border-red-400 bg-red-50' : 'border-slate-300 bg-white'}`;

function createSchema(t: (key: string) => string) {
  return z
    .object({
      first_name: z
        .string()
        .min(1, t('appSelfRegister.steps.form.validation.nameRequired'))
        .max(100),
      last_name: z
        .string()
        .min(1, t('appSelfRegister.steps.form.validation.lastNameRequired'))
        .max(100),
      email: z.string().email(t('appSelfRegister.steps.form.validation.emailInvalid')),
      password: z
        .string()
        .min(12, t('appSelfRegister.steps.form.validation.passwordMinLength'))
        .regex(/[A-Z]/, t('appSelfRegister.steps.form.validation.passwordUppercase'))
        .regex(/[a-z]/, t('appSelfRegister.steps.form.validation.passwordLowercase'))
        .regex(/[0-9]/, t('appSelfRegister.steps.form.validation.passwordNumber'))
        .regex(/[!@#$%^&*]/, t('appSelfRegister.steps.form.validation.passwordSpecial')),
      confirm_password: z
        .string()
        .min(1, t('appSelfRegister.steps.form.validation.confirmPasswordRequired')),
    })
    .refine((values) => values.password === values.confirm_password, {
      message: t('appSelfRegister.steps.form.validation.passwordsMismatch'),
      path: ['confirm_password'],
    });
}

type FormData = z.infer<ReturnType<typeof createSchema>>;

export function AppSelfRegisterFormStep({
  tenantSlug,
  clientId,
  tenantName,
  appName,
  onNext,
  onBack,
  defaultValues,
  onValuesChange,
}: AppSelfRegisterFormStepProps) {
  const { t } = useTranslation();
  const schema = createSchema(t);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      first_name: defaultValues?.first_name ?? '',
      last_name: defaultValues?.last_name ?? '',
      email: defaultValues?.email ?? '',
      password: '',
      confirm_password: '',
    },
  });

  const { register, handleSubmit, formState, control, watch, setError } = form;
  const { errors } = formState;
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const passwordValue = useWatch({ control, name: 'password', defaultValue: '' });
  const confirmPasswordValue = useWatch({ control, name: 'confirm_password', defaultValue: '' });

  useEffect(() => {
    if (!onValuesChange) return;
    const subscription = watch((values) => {
      onValuesChange({
        first_name: values.first_name ?? '',
        last_name: values.last_name ?? '',
        email: values.email ?? '',
      });
    });
    return () => subscription.unsubscribe();
  }, [watch, onValuesChange]);

  async function initializePlatformSession() {
    const verifier = generateCodeVerifier();
    const challenge = await generateCodeChallenge(verifier);
    await platformAuthorize(
      { codeChallenge: challenge, state: '' },
      { timeoutMs: NETWORK_REQUEST_TIMEOUT_MS },
    );
  }

  async function checkEmailWithRetry(email: string) {
    try {
      return await platformCheckEmail({ email }, { timeoutMs: NETWORK_REQUEST_TIMEOUT_MS });
    } catch (error) {
      const isAuthError =
        axios.isAxiosError(error) &&
        error.response?.data?.failure?.code === 'AUTHENTICATION_REQUIRED';

      if (!isAuthError) {
        throw error;
      }

      const toastId = toast.loading(t('appSelfRegister.messages.restoringSession'), {
        duration: Infinity,
      });

      try {
        await initializePlatformSession();
        toast.success(t('appSelfRegister.messages.sessionRestored'), { id: toastId });
      } catch (sessionError) {
        toast.error(t('appSelfRegister.messages.sessionRestoreFailed'), { id: toastId });
        throw sessionError;
      }

      return platformCheckEmail({ email }, { timeoutMs: NETWORK_REQUEST_TIMEOUT_MS });
    }
  }

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      setIsCheckingEmail(true);
      try {
        const emailStatus = await checkEmailWithRetry(data.email);

        if (emailStatus === 'found') {
          setError('email', {
            message: t('appSelfRegister.steps.form.validation.emailAlreadyExists'),
          });
          return Promise.reject(new Error('EMAIL_EXISTS'));
        }

        const payload: RegisterRequest = {
          email: data.email,
          password: data.password,
          first_name: data.first_name,
          last_name: data.last_name,
        };
        return registerUser(tenantSlug, clientId, payload);
      } finally {
        setIsCheckingEmail(false);
      }
    },
    onSuccess: (data, variables) => {
      onNext(variables.email, data.id);
    },
  });

  const onSubmit = handleSubmit((data) => {
    mutation.mutate(data);
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          {t('appSelfRegister.steps.form.title')}
        </h2>
        <p className="mt-2 text-slate-500 text-base">
          {t('appSelfRegister.steps.form.description', { appName, tenantName })}
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="first_name" className="text-sm font-medium text-slate-700">
              {t('appSelfRegister.steps.form.firstName')}{' '}
              <span aria-hidden="true" className="text-red-500">
                *
              </span>
            </label>
            <input
              {...register('first_name')}
              id="first_name"
              placeholder={t('appSelfRegister.steps.form.firstNamePlaceholder')}
              disabled={mutation.isPending}
              className={inputCls(!!errors.first_name)}
            />
            {errors.first_name && (
              <p className="text-xs text-red-600" role="alert">
                {errors.first_name.message}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="last_name" className="text-sm font-medium text-slate-700">
              {t('appSelfRegister.steps.form.lastName')}{' '}
              <span aria-hidden="true" className="text-red-500">
                *
              </span>
            </label>
            <input
              {...register('last_name')}
              id="last_name"
              placeholder={t('appSelfRegister.steps.form.lastNamePlaceholder')}
              disabled={mutation.isPending}
              className={inputCls(!!errors.last_name)}
            />
            {errors.last_name && (
              <p className="text-xs text-red-600" role="alert">
                {errors.last_name.message}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium text-slate-700">
            {t('appSelfRegister.steps.form.email')}{' '}
            <span aria-hidden="true" className="text-red-500">
              *
            </span>
          </label>
          <input
            {...register('email')}
            id="email"
            type="email"
            placeholder={t('appSelfRegister.steps.form.emailPlaceholder')}
            disabled={mutation.isPending}
            className={inputCls(!!errors.email)}
          />
          {errors.email && (
            <p className="text-xs text-red-600" role="alert">
              {errors.email.message}
            </p>
          )}
        </div>

        <AppSelfRegisterPasswordFields
          passwordRegister={register('password')}
          confirmRegister={register('confirm_password')}
          passwordValue={passwordValue}
          confirmValue={confirmPasswordValue}
          passwordError={errors.password?.message}
          confirmError={errors.confirm_password?.message}
          disabled={mutation.isPending}
        />

        {mutation.isError && mutation.error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />
            <p className="text-sm text-red-600">
              {axios.isAxiosError(mutation.error) && mutation.error.response?.data?.failure?.message
                ? mutation.error.response.data.failure.message
                : t('appSelfRegister.steps.form.registerError')}
            </p>
          </div>
        )}

        <div className="flex gap-3 justify-between pt-2">
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
            disabled={mutation.isPending || isCheckingEmail}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-semibold px-8 py-3 rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
          >
            {isCheckingEmail || mutation.isPending
              ? t('appSelfRegister.actions.registering')
              : t('appSelfRegister.actions.continue')}
            {isCheckingEmail || mutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            ) : (
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
