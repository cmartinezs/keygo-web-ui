import { Navigate, Outlet } from 'react-router-dom'
import { useTokenStore } from '@/shared/lib/auth/tokenStore'
import type { AppRole } from '@/shared/types/roles'

interface AuthGuardProps {
  children?: React.ReactNode
}

/** Protects routes that require any authenticated user. Redirects to /login if not authenticated. */
export function AuthGuard({ children }: AuthGuardProps) {
  const accessToken = useTokenStore((s) => s.accessToken)
  if (!accessToken) return <Navigate to="/login" replace />
  return children ? <>{children}</> : <Outlet />
}

interface RoleGuardProps {
  roles: AppRole[]
  redirectTo?: string
  children?: React.ReactNode
}

/** Protects routes that require a specific role. Redirects to /login or `redirectTo` if unauthorized. */
export function RoleGuard({ roles, redirectTo = '/login', children }: RoleGuardProps) {
  const { accessToken, roles: userRoles, activeRole } = useTokenStore()
  if (!accessToken) return <Navigate to="/login" replace />

  if (activeRole) {
    const canAccessWithActiveRole = roles.includes(activeRole) && userRoles.includes(activeRole)
    if (!canAccessWithActiveRole) return <Navigate to={redirectTo} replace />
    return children ? <>{children}</> : <Outlet />
  }

  if (!roles.some((r) => userRoles.includes(r))) return <Navigate to={redirectTo} replace />
  return children ? <>{children}</> : <Outlet />
}
