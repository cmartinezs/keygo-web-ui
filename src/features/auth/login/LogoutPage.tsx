import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useTokenStore } from '@/shared/lib/auth/tokenStore'
import { useBlockingErrorStore } from '@/shared/lib/auth/blockingErrorStore'
import { cancelRefreshTimer } from '@/shared/lib/auth/refresh'
import { revokeToken } from '@/features/auth/api'
import { TENANT } from '@/shared/api/client'

/**
 * Clears in-memory session and blocking UI state, then redirects to login.
 * Revokes the refresh token on the backend (fire-and-forget).
 */
export default function LogoutPage() {
  const clearTokens = useTokenStore((state) => state.clearTokens)
  const clearBlockingError = useBlockingErrorStore((state) => state.clearError)
  const refreshToken = useTokenStore((state) => state.refreshToken)

  useEffect(() => {
    // Fire-and-forget backend revoke — never blocks UI
    if (refreshToken) {
      revokeToken({ tenantSlug: TENANT, token: refreshToken }).catch(() => {})
    }
    cancelRefreshTimer()
    clearBlockingError()
    clearTokens()
  }, [clearBlockingError, clearTokens, refreshToken])

  return <Navigate to="/login" replace />
}
