import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useIsFetching, useIsMutating } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { resetTraceId } from '@/shared/lib/traceId';
import LandingPage from '@/features/public/landing/LandingPage';
import DeveloperDocsPage from '@/features/public/docs/DeveloperDocsPage';
import LoginPage from '@/features/auth/login/LoginPage';
import ForgotPasswordPage from '@/features/auth/login/ForgotPasswordPage';
import RecoverPasswordPage from '@/features/auth/login/RecoverPasswordPage';
import ResetPasswordPage from '@/features/auth/login/ResetPasswordPage';
import LogoutPage from '@/features/auth/login/LogoutPage';
import NewContractPage from '@/features/auth/register/NewContractPage';
import AppSelfRegisterPage from '@/features/auth/register/AppSelfRegisterPage';
import DashboardHomePage from '@/features/console/dashboard/DashboardHomePage';
import FeaturePlaceholderPage from '@/features/console/dashboard/FeaturePlaceholderPage';
import TenantUsersPage from '@/features/console/users/TenantUsersPage';
import TenantAppsPage from '@/features/console/apps/TenantAppsPage';
import TenantMembershipsPage from '@/features/console/memberships/TenantMembershipsPage';
import UserMyAccessPage from '@/features/account/access/UserMyAccessPage';
import UserActivityPage from '@/features/account/activity/UserActivityPage';
import PlatformStatsPage from '@/features/ops/stats/PlatformStatsPage';
import UserProfilePage from '@/features/account/profile/UserProfilePage';
import AccountSettingsPage from '@/features/account/settings/AccountSettingsPage';
import AccountSessionsPage from '@/features/account/sessions/AccountSessionsPage';
import FaqCenterPage from '@/features/console/dashboard/FaqCenterPage';
import { AuthGuard, RoleGuard } from '@/app/guards/roleGuard';
import { useTokenStore } from '@/shared/lib/auth/tokenStore';
import AdminLayout from '@/app/layouts/AdminLayout';
import TenantsPage from '@/features/ops/tenants/TenantsPage';
import TenantDetailPage from '@/features/ops/tenants/TenantDetailPage';
import TenantCreatePage from '@/features/ops/tenants/TenantCreatePage';
import PlatformUsersPage from '@/features/ops/platform-users/PlatformUsersPage';
import PlatformUserDetailPage from '@/features/ops/platform-users/PlatformUserDetailPage';
import PlatformUserCreatePage from '@/features/ops/platform-users/PlatformUserCreatePage';
import PlatformBillingPage from '@/features/ops/billing/PlatformBillingPage';
import ConsoleBillingPage from '@/features/console/billing/ConsoleBillingPage';
import { BlockingErrorModal } from '@/shared/ui/BlockingErrorModal';
import { GlobalLoaderOverlay } from '@/shared/ui/GlobalLoaderOverlay';
import { AppErrorBoundary } from '@/shared/ui/AppErrorBoundary';
import { DevConsole } from '@/shared/ui/DevConsole';
import { useBlockingErrorStore } from '@/shared/lib/auth/blockingErrorStore';
import { useThemeStore } from '@/shared/hooks/useTheme';
import { useCurrentUser } from '@/shared/hooks/useCurrentUser';
import { env } from '@/shared/lib/config/env';

const SLOW_REQUEST_THRESHOLD_MS = 5000;
const ROUTE_SETTLING_WINDOW_MS = 1200;

export default function App() {
  const { t } = useTranslation();
  const location = useLocation();
  const accessToken = useTokenStore((state) => state.accessToken);
  const currentUser = useCurrentUser();
  // Show DevConsole in all non-prod environments; in prod only for ADMIN users.
  const showDevConsole = !env.PROD || currentUser?.roles.includes('keygo_admin') === true;
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();
  const themePreference = useThemeStore((state) => state.preference);
  const hasBlockingError = useBlockingErrorStore((state) => Boolean(state.error));
  const isNetworkBusy = isFetching > 0 || isMutating > 0;
  const [isRouteSettling, setIsRouteSettling] = useState(true);
  const [isSlowNetwork, setIsSlowNetwork] = useState(false);
  const isHighContrast = themePreference === 'high-contrast';

  useEffect(() => {
    resetTraceId();
  }, [location.pathname]);

  useEffect(() => {
    const openSettleFrame = window.requestAnimationFrame(() => {
      setIsRouteSettling(true);
    });
    const settleTimer = window.setTimeout(() => {
      setIsRouteSettling(false);
    }, ROUTE_SETTLING_WINDOW_MS);
    return () => {
      window.cancelAnimationFrame(openSettleFrame);
      window.clearTimeout(settleTimer);
    };
  }, [location.pathname]);

  useEffect(() => {
    if (!isNetworkBusy) {
      const resetSlowFrame = window.requestAnimationFrame(() => {
        setIsSlowNetwork(false);
      });
      return () => window.cancelAnimationFrame(resetSlowFrame);
    }

    const slowTimer = window.setTimeout(() => {
      setIsSlowNetwork(true);
    }, SLOW_REQUEST_THRESHOLD_MS);

    return () => {
      window.clearTimeout(slowTimer);
    };
  }, [isNetworkBusy]);

  const shouldShowGlobalLoader = !hasBlockingError && isRouteSettling && isSlowNetwork;

  return (
    <AppErrorBoundary
      title={t('appErrorBoundary.title')}
      description={t('appErrorBoundary.description')}
      reloadLabel={t('appErrorBoundary.reloadAction')}
      safeExitLabel={t('appErrorBoundary.safeExitAction')}
      debugTitle={t('appErrorBoundary.debugTitle')}
      debugStackTitle={t('appErrorBoundary.debugStackTitle')}
      debugRuntimeStackTitle={t('appErrorBoundary.debugRuntimeStackTitle')}
      debugSourceTitle={t('appErrorBoundary.debugSourceTitle')}
      debugSourceUnavailable={t('appErrorBoundary.debugSourceUnavailable')}
      debugCopyStackLabel={t('appErrorBoundary.debugCopyStackLabel')}
      debugCopySuccess={t('appErrorBoundary.debugCopySuccess')}
      debugCopyError={t('appErrorBoundary.debugCopyError')}
    >
      <>
        <Routes>
          {/* Public */}
          <Route
            path="/"
            element={accessToken ? <Navigate to="/dashboard" replace /> : <LandingPage />}
          />
          <Route path="/developers" element={<DeveloperDocsPage />} />
          <Route
            path="/login"
            element={accessToken ? <Navigate to="/dashboard" replace /> : <LoginPage />}
          />
          <Route
            path="/forgot-password"
            element={accessToken ? <Navigate to="/dashboard" replace /> : <ForgotPasswordPage />}
          />
          <Route
            path="/recover-password"
            element={accessToken ? <Navigate to="/dashboard" replace /> : <RecoverPasswordPage />}
          />
          <Route
            path="/reset-password"
            element={accessToken ? <Navigate to="/dashboard" replace /> : <ResetPasswordPage />}
          />
          <Route path="/logout" element={<LogoutPage />} />
          <Route path="/subscribe" element={<NewContractPage />} />
          <Route path="/subscribe/resume" element={<Navigate to="/subscribe?resume=1" replace />} />
          <Route path="/register" element={<AppSelfRegisterPage />} />
          <Route path="/verify-email" element={<AppSelfRegisterPage />} />
          <Route path="/home" element={<Navigate to="/dashboard" replace />} />
          <Route path="/admin/*" element={<Navigate to="/dashboard" replace />} />

          {/* Unified dashboard route for all authenticated roles */}
          <Route
            path="/dashboard"
            element={
              <AuthGuard>
                <AdminLayout />
              </AuthGuard>
            }
          >
            <Route index element={<DashboardHomePage />} />

            {/* Account sections (all authenticated roles) */}
            <Route path="account" element={<UserProfilePage />} />
            <Route path="account/settings" element={<AccountSettingsPage />} />
            <Route path="account/sessions" element={<AccountSessionsPage />} />
            <Route path="faq" element={<FaqCenterPage />} />
            <Route path="account/faq" element={<Navigate to="/dashboard/faq" replace />} />

            {/* Tenant directory: global admin sees all, account admin sees associated tenants */}
            <Route
              element={
                <RoleGuard roles={['keygo_admin', 'keygo_account_admin']} redirectTo="/dashboard" />
              }
            >
              <Route path="tenants" element={<TenantsPage />}>
                <Route path=":slug" element={<TenantDetailPage />} />
              </Route>
            </Route>

            {/* Admin-only sections */}
            <Route element={<RoleGuard roles={['keygo_admin']} redirectTo="/dashboard" />}>
              <Route path="tenants/new" element={<TenantCreatePage />} />
              <Route path="platform-users" element={<PlatformUsersPage />}>
                <Route path="new" element={<PlatformUserCreatePage />} />
                <Route path=":userId" element={<PlatformUserDetailPage />} />
              </Route>
              <Route path="platform-billing" element={<PlatformBillingPage />} />
              <Route path="feature/api" element={<PlatformStatsPage />} />
            </Route>

            {/* Legacy routes: módulos ya implementados fuera de placeholder */}
            <Route path="feature/apps" element={<Navigate to="/dashboard/tenant/apps" replace />} />
            <Route
              path="feature/users"
              element={<Navigate to="/dashboard/tenant/users" replace />}
            />
            <Route
              path="feature/access"
              element={<Navigate to="/dashboard/tenant/memberships" replace />}
            />
            {/* Legacy route: sesiones ahora usa módulo real de cuenta */}
            <Route
              path="feature/sessions"
              element={<Navigate to="/dashboard/account/sessions" replace />}
            />

            <Route path="feature/:featureId" element={<FeaturePlaceholderPage />} />

            {/* Admin tenant sections */}
            <Route
              element={
                <RoleGuard roles={['keygo_admin', 'keygo_account_admin']} redirectTo="/dashboard" />
              }
            >
              <Route path="tenant/users" element={<TenantUsersPage />} />
              <Route path="tenant/apps" element={<TenantAppsPage />} />
              <Route path="tenant/memberships" element={<TenantMembershipsPage />} />
              <Route path="tenant/billing" element={<ConsoleBillingPage />} />
            </Route>

            {/* User tenant sections */}
            <Route element={<RoleGuard roles={['keygo_user']} redirectTo="/dashboard" />}>
              <Route path="user/my-access" element={<UserMyAccessPage />} />
              <Route path="user/activity" element={<UserActivityPage />} />
              <Route
                path="user/sessions"
                element={<Navigate to="/dashboard/account/sessions" replace />}
              />
              <Route path="user/profile" element={<Navigate to="/dashboard/account" replace />} />
            </Route>

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        <Toaster
          position="bottom-right"
          theme={isHighContrast ? 'light' : 'dark'}
          richColors
          toastOptions={{
            classNames: {
              toast: isHighContrast
                ? 'bg-black border-2 border-white text-white text-sm'
                : 'bg-slate-800 border border-white/10 text-slate-100 text-sm',
            },
          }}
        />
        <GlobalLoaderOverlay
          active={shouldShowGlobalLoader}
          skipDelays
          title={t('common.loading')}
          description={t('common.slowLoading')}
        />
        <BlockingErrorModal />
        {showDevConsole && <DevConsole />}
      </>
    </AppErrorBoundary>
  );
}
