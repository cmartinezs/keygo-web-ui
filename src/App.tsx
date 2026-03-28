import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import LandingPage from './pages/landing/LandingPage'
import LoginPage from './pages/login/LoginPage'
import NewContractPage from './pages/register/NewContractPage'
import UserRegisterPage from './pages/register/UserRegisterPage'
import { RoleGuard } from './auth/roleGuard'
import AdminLayout from './layouts/AdminLayout'
import AdminDashboardPage from './pages/admin/DashboardPage'
import TenantsPage from './pages/admin/TenantsPage'
import TenantDetailPage from './pages/admin/TenantDetailPage'
import TenantCreatePage from './pages/admin/TenantCreatePage'

export default function App() {
  return (
    <>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/subscribe" element={<NewContractPage />} />
        <Route path="/register" element={<UserRegisterPage />} />

        {/* Admin — role ADMIN */}
        <Route
          path="/admin"
          element={<RoleGuard roles={['ADMIN']}><AdminLayout /></RoleGuard>}
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />

          {/* Tenant management — master-detail layout */}
          <Route path="tenants" element={<TenantsPage />}>
            <Route path="new" element={<TenantCreatePage />} />
            <Route path=":slug" element={<TenantDetailPage />} />
          </Route>
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
    </>
  )
}

