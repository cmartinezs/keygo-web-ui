import { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from 'sonner'
import { useIsFetching, useIsMutating } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { resetTraceId } from './lib/traceId'
import LandingPage from './pages/landing/LandingPage'
import DeveloperDocsPage from './pages/developers/DeveloperDocsPage'
import LoginPage from './pages/login/LoginPage'
import ForgotPasswordPage from './pages/login/ForgotPasswordPage'
import RecoverPasswordPage from './pages/login/RecoverPasswordPage'
import ResetPasswordPage from './pages/login/ResetPasswordPage'
import LogoutPage from './pages/login/LogoutPage'
import NewContractPage from './pages/register/NewContractPage'
import UserRegisterPage from './pages/register/UserRegisterPage'
import DashboardHomePage from './pages/dashboard/DashboardHomePage'
import FeaturePlaceholderPage from './pages/dashboard/FeaturePlaceholderPage'
import TenantUsersPage from './pages/dashboard/tenant/TenantUsersPage'
import TenantAppsPage from './pages/dashboard/tenant/TenantAppsPage'
import TenantMembershipsPage from './pages/dashboard/tenant/TenantMembershipsPage'
import UserMyAccessPage from './pages/dashboard/user/UserMyAccessPage'
import UserActivityPage from './pages/dashboard/user/UserActivityPage'
import PlatformStatsPage from './pages/admin/PlatformStatsPage'
import UserProfilePage from './pages/dashboard/user/UserProfilePage'
import AccountSettingsPage from './pages/dashboard/account/AccountSettingsPage'
import AccountSessionsPage from './pages/dashboard/account/AccountSessionsPage'
import FaqCenterPage from './pages/dashboard/FaqCenterPage'
import { AuthGuard, RoleGuard } from './auth/roleGuard'
import { useTokenStore } from './auth/tokenStore'
import AdminLayout from './layouts/AdminLayout'
import TenantsPage from './pages/admin/TenantsPage'
import TenantDetailPage from './pages/admin/TenantDetailPage'
import TenantCreatePage from './pages/admin/TenantCreatePage'
import { BlockingErrorModal } from './components/BlockingErrorModal'
import { GlobalLoaderOverlay } from './components/GlobalLoaderOverlay'
import { AppErrorBoundary } from './components/AppErrorBoundary'
import { useBlockingErrorStore } from './auth/blockingErrorStore'
import { useThemeStore } from './hooks/useTheme'

const SLOW_REQUEST_THRESHOLD_MS = 5000
const ROUTE_SETTLING_WINDOW_MS = 1200

export default function App() {
  const { t } = useTranslation()
  const location = useLocation()
  const accessToken = useTokenStore((state) => state.accessToken)
  const isFetching = useIsFetching()
  const isMutating = useIsMutating()
  const themePreference = useThemeStore((state) => state.preference)
  const hasBlockingError = useBlockingErrorStore((state) => Boolean(state.error))
  const isNetworkBusy = isFetching > 0 || isMutating > 0
  const [isRouteSettling, setIsRouteSettling] = useState(true)
  const [isSlowNetwork, setIsSlowNetwork] = useState(false)
  const isHighContrast = themePreference === 'high-contrast'

  useEffect(() => {
    resetTraceId()
  }, [location.pathname])

  useEffect(() => {
    const openSettleFrame = window.requestAnimationFrame(() => {
      setIsRouteSettling(true)
    })
    const settleTimer = window.setTimeout(() => {
      setIsRouteSettling(false)
    }, ROUTE_SETTLING_WINDOW_MS)
    return () => {
      window.cancelAnimationFrame(openSettleFrame)
      window.clearTimeout(settleTimer)
    }
  }, [location.pathname])

  useEffect(() => {
    if (!isNetworkBusy) {
      const resetSlowFrame = window.requestAnimationFrame(() => {
        setIsSlowNetwork(false)
      })
      return () => window.cancelAnimationFrame(resetSlowFrame)
    }

    const slowTimer = window.setTimeout(() => {
      setIsSlowNetwork(true)
    }, SLOW_REQUEST_THRESHOLD_MS)

    return () => {
      window.clearTimeout(slowTimer)
    }
  }, [isNetworkBusy])

  const shouldShowGlobalLoader = !hasBlockingError && isRouteSettling && isSlowNetwork

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
        <Route path="/" element={accessToken ? <Navigate to="/dashboard" replace /> : <LandingPage />} />
        <Route path="/developers" element={<DeveloperDocsPage />} />
        <Route path="/login" element={accessToken ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
        <Route path="/forgot-password" element={accessToken ? <Navigate to="/dashboard" replace /> : <ForgotPasswordPage />} />
        <Route path="/recover-password" element={accessToken ? <Navigate to="/dashboard" replace /> : <RecoverPasswordPage />} />
        <Route path="/reset-password" element={accessToken ? <Navigate to="/dashboard" replace /> : <ResetPasswordPage />} />
        <Route path="/logout" element={<LogoutPage />} />
        <Route path="/subscribe" element={<NewContractPage />} />
        <Route path="/subscribe/resume" element={<Navigate to="/subscribe?resume=1" replace />} />
        <Route path="/register" element={<UserRegisterPage />} />
        <Route path="/home" element={<Navigate to="/dashboard" replace />} />
        <Route path="/admin/*" element={<Navigate to="/dashboard" replace />} />

        {/* Unified dashboard route for all authenticated roles */}
        <Route
          path="/dashboard"
          element={<AuthGuard><AdminLayout /></AuthGuard>}
        >
          <Route index element={<DashboardHomePage />} />

          {/* Account sections (all authenticated roles) */}
          <Route path="account" element={<UserProfilePage />} />
          <Route path="account/settings" element={<AccountSettingsPage />} />
          <Route path="account/sessions" element={<AccountSessionsPage />} />
          <Route path="faq" element={<FaqCenterPage />} />
          <Route path="account/faq" element={<Navigate to="/dashboard/faq" replace />} />

          {/* Admin-only sections */}
          <Route element={<RoleGuard roles={['ADMIN']} redirectTo="/dashboard" />}>
            <Route path="tenants" element={<TenantsPage />}>
              <Route path="new" element={<TenantCreatePage />} />
              <Route path=":slug" element={<TenantDetailPage />} />
            </Route>
            <Route path="feature/api" element={<PlatformStatsPage />} />
          </Route>

          {/* Legacy routes: módulos ya implementados fuera de placeholder */}
          <Route path="feature/apps" element={<Navigate to="/dashboard/tenant/apps" replace />} />
          <Route path="feature/users" element={<Navigate to="/dashboard/tenant/users" replace />} />
          <Route path="feature/access" element={<Navigate to="/dashboard/tenant/memberships" replace />} />
          {/* Legacy route: sesiones ahora usa módulo real de cuenta */}
          <Route path="feature/sessions" element={<Navigate to="/dashboard/account/sessions" replace />} />

          <Route path="feature/:featureId" element={<FeaturePlaceholderPage />} />

          {/* Admin tenant sections */}
          <Route element={<RoleGuard roles={['ADMIN', 'ADMIN_TENANT']} redirectTo="/dashboard" />}>
            <Route path="tenant/users" element={<TenantUsersPage />} />
            <Route path="tenant/apps" element={<TenantAppsPage />} />
            <Route path="tenant/memberships" element={<TenantMembershipsPage />} />
          </Route>

          {/* User tenant sections */}
          <Route element={<RoleGuard roles={['USER_TENANT']} redirectTo="/dashboard" />}>
            <Route path="user/my-access" element={<UserMyAccessPage />} />
            <Route path="user/activity" element={<UserActivityPage />} />
            <Route path="user/sessions" element={<Navigate to="/dashboard/account/sessions" replace />} />
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
      </>
    </AppErrorBoundary>
  )
}

