import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { useIsFetching, useIsMutating } from '@tanstack/react-query'
import LandingPage from './pages/landing/LandingPage'
import DeveloperDocsPage from './pages/developers/DeveloperDocsPage'
import LoginPage from './pages/login/LoginPage'
import NewContractPage from './pages/register/NewContractPage'
import UserRegisterPage from './pages/register/UserRegisterPage'
import DashboardHomePage from './pages/dashboard/DashboardHomePage'
import FeaturePlaceholderPage from './pages/dashboard/FeaturePlaceholderPage'
import TenantUsersPage from './pages/dashboard/tenant/TenantUsersPage'
import TenantAppsPage from './pages/dashboard/tenant/TenantAppsPage'
import TenantMembershipsPage from './pages/dashboard/tenant/TenantMembershipsPage'
import UserMyAccessPage from './pages/dashboard/user/UserMyAccessPage'
import UserActivityPage from './pages/dashboard/user/UserActivityPage'
import UserSessionsPage from './pages/dashboard/user/UserSessionsPage'
import UserProfilePage from './pages/dashboard/user/UserProfilePage'
import { AuthGuard, RoleGuard } from './auth/roleGuard'
import AdminLayout from './layouts/AdminLayout'
import TenantsPage from './pages/admin/TenantsPage'
import TenantDetailPage from './pages/admin/TenantDetailPage'
import TenantCreatePage from './pages/admin/TenantCreatePage'
import { BlockingErrorModal } from './components/BlockingErrorModal'
import { GlobalLoaderOverlay } from './components/GlobalLoaderOverlay'
import { useBlockingErrorStore } from './auth/blockingErrorStore'

export default function App() {
  const isFetching = useIsFetching()
  const isMutating = useIsMutating()
  const hasBlockingError = useBlockingErrorStore((state) => Boolean(state.error))
  const isBusy = !hasBlockingError && (isFetching > 0 || isMutating > 0)

  return (
    <>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/developers" element={<DeveloperDocsPage />} />
        <Route path="/login" element={<LoginPage />} />
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
          <Route path="feature/:featureId" element={<FeaturePlaceholderPage />} />

          {/* Admin-only sections */}
          <Route element={<RoleGuard roles={['ADMIN']} redirectTo="/dashboard" />}>
            <Route path="tenants" element={<TenantsPage />}>
              <Route path="new" element={<TenantCreatePage />} />
              <Route path=":slug" element={<TenantDetailPage />} />
            </Route>
          </Route>

          {/* Admin tenant sections */}
          <Route element={<RoleGuard roles={['ADMIN_TENANT']} redirectTo="/dashboard" />}>
            <Route path="tenant/users" element={<TenantUsersPage />} />
            <Route path="tenant/apps" element={<TenantAppsPage />} />
            <Route path="tenant/memberships" element={<TenantMembershipsPage />} />
          </Route>

          {/* User tenant sections */}
          <Route element={<RoleGuard roles={['USER_TENANT']} redirectTo="/dashboard" />}>
            <Route path="user/my-access" element={<UserMyAccessPage />} />
            <Route path="user/activity" element={<UserActivityPage />} />
            <Route path="user/sessions" element={<UserSessionsPage />} />
            <Route path="user/profile" element={<UserProfilePage />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      <Toaster
        position="bottom-right"
        theme="dark"
        richColors
        toastOptions={{
          classNames: {
            toast: 'bg-slate-800 border border-white/10 text-slate-100 text-sm',
          },
        }}
      />
      <GlobalLoaderOverlay
        active={isBusy}
        title="Cargando contenido"
        description="Estamos trayendo la informacion necesaria para esta vista."
      />
      <BlockingErrorModal />
    </>
  )
}

