import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useTokenStore } from '@/shared/lib/auth/tokenStore'
import { useBlockingErrorStore } from '@/shared/lib/auth/blockingErrorStore'

/**
 * Clears in-memory session and blocking UI state, then redirects to login.
 * This route can be used as a safe fallback when current session context is inconsistent.
 */
export default function LogoutPage() {
  const clearTokens = useTokenStore((state) => state.clearTokens)
  const clearBlockingError = useBlockingErrorStore((state) => state.clearError)

  useEffect(() => {
    clearBlockingError()
    clearTokens()
  }, [clearBlockingError, clearTokens])

  return <Navigate to="/login" replace />
}
