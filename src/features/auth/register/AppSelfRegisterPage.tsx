import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { LocaleSwitcher } from '@/shared/ui/LocaleSwitcher';
import { AppFooter } from '@/shared/ui/AppFooter';
import { generateCodeChallenge, generateCodeVerifier, generateState } from '@/shared/lib/auth/pkce';
import { platformAuthorize } from '@/features/auth/api';
import { getRegistrationSession, resendVerification, verifyEmail } from './registrationApi';
import { AppSelfRegisterSelectAppStep } from './steps/AppSelfRegisterSelectAppStep';
import {
  AppSelfRegisterFormStep,
  type AppSelfRegisterFormDraft,
} from './steps/AppSelfRegisterFormStep';
import { EmailVerificationStep } from './steps/EmailVerificationStep';
import { AppSelfRegisterSuccessStep } from './steps/AppSelfRegisterSuccessStep';
import { AppSelfRegisterLiveSummary } from './components/AppSelfRegisterLiveSummary';

type FlowStep = 0 | 1 | 2 | 3;

const STEPS = [
  { labelKey: 'appSelfRegister.stepIndicator.selectApp' },
  { labelKey: 'appSelfRegister.stepIndicator.register' },
  { labelKey: 'appSelfRegister.stepIndicator.confirmCode' },
  { labelKey: 'appSelfRegister.stepIndicator.success' },
] as const;

interface StepIndicatorProps {
  current: FlowStep;
  done: boolean;
}

function StepIndicator({ current, done }: StepIndicatorProps) {
  const { t } = useTranslation();
  return (
    <nav
      aria-label={t('appSelfRegister.steps.selectApp.title')}
      className="flex items-center justify-center gap-0 mb-6 max-w-full overflow-hidden"
    >
      {STEPS.map((step, idx) => {
        const isDone = done || idx < current;
        const isActive = !done && idx === current;
        return (
          <div key={step.labelKey} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold transition-colors ${
                  isDone
                    ? 'bg-emerald-500 text-white'
                    : isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                      : 'bg-slate-200 text-slate-500'
                }`}
                aria-current={isActive ? 'step' : undefined}
              >
                {isDone ? (
                  <svg
                    className="w-4 h-4"
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
                  idx + 1
                )}
              </div>
              <span
                className={`text-xs font-medium hidden sm:block ${isActive ? 'text-indigo-700' : isDone ? 'text-emerald-600' : 'text-slate-400'}`}
              >
                {t(step.labelKey)}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className={`w-4 sm:w-16 h-0.5 mx-0.5 sm:mx-1 mb-3 sm:mb-4 ${isDone ? 'bg-emerald-400' : 'bg-slate-200'}`}
                aria-hidden="true"
              />
            )}
          </div>
        );
      })}
    </nav>
  );
}

function StepRail({ current, done }: StepIndicatorProps) {
  const { t } = useTranslation();
  return (
    <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-24">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">{t('appSelfRegister.title')}</h3>
      <nav aria-label={t('appSelfRegister.steps.selectApp.title')} className="space-y-3">
        {STEPS.map((step, idx) => {
          const isDone = done || idx < current;
          const isActive = !done && idx === current;

          return (
            <div key={step.labelKey} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    isDone
                      ? 'bg-emerald-500 text-white'
                      : isActive
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-200 text-slate-500'
                  }`}
                  aria-current={isActive ? 'step' : undefined}
                >
                  {isDone ? (
                    <svg
                      className="w-4 h-4"
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
                    idx + 1
                  )}
                </div>
                {idx < STEPS.length - 1 && (
                  <span
                    className={`w-0.5 h-8 mt-1 ${isDone ? 'bg-emerald-300' : 'bg-slate-200'}`}
                    aria-hidden="true"
                  />
                )}
              </div>
              <p
                className={`pt-1 text-sm ${isActive ? 'font-semibold text-indigo-700' : isDone ? 'text-emerald-700' : 'text-slate-500'}`}
              >
                {t(step.labelKey)}
              </p>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

export default function AppSelfRegisterPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<FlowStep>(0);
  const [done, setDone] = useState(false);
  const [isResuming, setIsResuming] = useState(false);
  const [isResendingCode, setIsResendingCode] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [context, setContext] = useState<{
    tenantSlug: string;
    clientId: string;
    tenantName: string;
    appName: string;
    email: string;
    registrationId?: string;
  } | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [formDraft, setFormDraft] = useState<AppSelfRegisterFormDraft>({
    first_name: '',
    last_name: '',
    email: '',
  });

  const registrationIdParam = searchParams.get('registration_id');
  const clientIdParam = searchParams.get('client_id');

  useEffect(() => {
    async function loadRegistrationSession() {
      if (!registrationIdParam || !clientIdParam) return;

      setIsResuming(true);
      try {
        const session = await getRegistrationSession(registrationIdParam, clientIdParam);
        setContext({
          tenantSlug: session.tenant_slug,
          clientId: session.client_app_id,
          tenantName: session.tenant_name,
          appName: session.client_app_name,
          email: session.email,
          registrationId: registrationIdParam,
        });
        setFormDraft({
          first_name: session.first_name,
          last_name: session.last_name,
          email: session.email,
        });

        if (session.status === 'PENDING') {
          setStep(2);
        } else if (session.status === 'EMAIL_VERIFIED' || session.status === 'ACTIVE') {
          setDone(true);
        } else {
          setStep(1);
        }
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : 'Error al cargar sesión de registro';
        setSessionError(errorMsg);
        toast.error(t('appSelfRegister.errors.sessionLoadFailed'));
      } finally {
        setIsResuming(false);
      }
    }

    loadRegistrationSession();
  }, [registrationIdParam, clientIdParam, t]);

  useEffect(() => {
    if (registrationIdParam || clientIdParam) return;

    async function initializeSession() {
      try {
        const verifier = generateCodeVerifier();
        const challenge = await generateCodeChallenge(verifier);
        const state = generateState();

        await platformAuthorize({ codeChallenge: challenge, state }, { timeoutMs: 10000 });
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Failed to initialize session';
        setSessionError(errorMsg);
        toast.error(t('appSelfRegister.errors.sessionInitFailed'));
      }
    }

    initializeSession();
  }, [registrationIdParam, t]);

  const handleSelectApp = (
    tenantSlug: string,
    clientId: string,
    tenantName: string,
    appName: string,
  ) => {
    setContext({ tenantSlug, clientId, tenantName, appName, email: '' });
    setStep(1);
  };

  const handleRegisterNext = (email: string, registrationId: string) => {
    setContext((prev) => (prev ? { ...prev, email, registrationId } : null));
    setStep(2);
  };

  const handleConfirmCodeNext = () => {
    setDone(true);
  };

  const handleBack = () => {
    if (step > 0) {
      setStep((prev) => (prev - 1) as FlowStep);
    }
  };

  const handleResendVerificationCode = async () => {
    if (!context?.registrationId || !context?.tenantSlug || !context?.clientId) return;
    setIsResendingCode(true);
    try {
      await resendVerification(context.tenantSlug, context.clientId, {
        registration_id: context.registrationId,
      });
      toast.success(t('appSelfRegister.messages.codeResent'));
    } catch (error) {
      toast.error(t('appSelfRegister.errors.resendFailed'));
    } finally {
      setIsResendingCode(false);
    }
  };

  const handleVerifyCode = async (code: string) => {
    if (!context?.registrationId || !context?.tenantSlug || !context?.clientId) return;
    setIsVerifyingCode(true);
    setVerificationError(null);
    try {
      await verifyEmail(context.tenantSlug, context.clientId, {
        registration_id: context.registrationId,
        code: code,
      });
      handleConfirmCodeNext();
    } catch (error) {
      setVerificationError(t('appSelfRegister.steps.confirmCode.invalidCode'));
    } finally {
      setIsVerifyingCode(false);
    }
  };

  if (sessionError) {
    toast.error(t('appSelfRegister.errors.sessionInitFailed'));
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex flex-col">
      <header className="py-4 px-6 border-b border-white/60 bg-white/70 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg"
            aria-label={t('common.appName')}
          >
            <svg
              className="w-6 h-6 text-indigo-600"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"
              />
            </svg>
            <span className="hidden sm:inline font-bold text-slate-900">KeyGo</span>
          </Link>
          <LocaleSwitcher
            compact
            triggerClassName="h-10 border border-slate-300 bg-white px-3 text-slate-700 hover:bg-slate-50 hover:text-slate-900 focus-visible:ring-indigo-500"
            panelClassName="absolute right-0 top-full mt-2 w-full rounded-lg border border-slate-200 bg-white py-1 shadow-xl z-50"
            optionClassName="text-slate-700 hover:bg-slate-100 hover:text-slate-900"
            activeOptionClassName="text-indigo-700 bg-indigo-50 font-semibold"
            selectedValueClassName="hidden sm:inline font-semibold text-slate-900"
          />
        </div>
      </header>

      <main className="flex-1 py-8 px-4 overflow-x-hidden">
        <div className="w-full max-w-7xl mx-auto">
          <div className="grid gap-6 lg:grid-cols-[200px_minmax(0,1fr)_260px] xl:grid-cols-[220px_minmax(0,1fr)_280px]">
            <div className="hidden lg:block">
              <StepRail current={step} done={done} />
            </div>

            <div className="min-w-0 bg-white rounded-2xl shadow-sm border border-slate-100 p-5 sm:p-8">
              <div className="lg:hidden">
                <StepIndicator current={step} done={done} />
              </div>

              {isResuming ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                  <p className="mt-4 text-slate-500 text-base">
                    {t('appSelfRegister.errors.loadingSession')}
                  </p>
                </div>
              ) : (
                <>
                  {step === 0 && !done && (
                    <AppSelfRegisterSelectAppStep
                      onNext={handleSelectApp}
                      initialTenantSlug={context?.tenantSlug}
                      initialClientId={context?.clientId}
                    />
                  )}
                  {step === 1 && context && !done && (
                    <AppSelfRegisterFormStep
                      tenantName={context.tenantName}
                      appName={context.appName}
                      onNext={handleRegisterNext}
                      onBack={handleBack}
                      tenantSlug={context.tenantSlug}
                      clientId={context.clientId}
                      defaultValues={formDraft}
                      onValuesChange={setFormDraft}
                    />
                  )}
                  {step === 2 && context && !done && (
                    <EmailVerificationStep
                      email={context.email}
                      isSubmitting={isVerifyingCode}
                      error={verificationError}
                      onSubmit={handleVerifyCode}
                      onResend={handleResendVerificationCode}
                      isResending={isResendingCode}
                    />
                  )}
                  {done && context && (
                    <AppSelfRegisterSuccessStep
                      tenantName={context.tenantName}
                      appName={context.appName}
                      email={context.email}
                    />
                  )}
                </>
              )}
            </div>

            <div className="hidden lg:block">
              <AppSelfRegisterLiveSummary
                tenantName={context?.tenantName ?? null}
                appName={context?.appName ?? null}
                email={context?.email ?? null}
                currentStepLabel={t(STEPS[step].labelKey)}
                done={done}
              />
            </div>
          </div>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}
