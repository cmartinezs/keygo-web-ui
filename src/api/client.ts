import axios from 'axios'
import { useTokenStore } from '@/auth/tokenStore'

export const KEYGO_BASE = import.meta.env.VITE_KEYGO_BASE ?? 'http://localhost:8080/keygo-server'
export const API_V1 = `${KEYGO_BASE}/api/v1`
export const TENANT = import.meta.env.VITE_TENANT_SLUG ?? 'keygo'
export const CLIENT_ID = import.meta.env.VITE_CLIENT_ID ?? 'key-go-ui'
export const REDIRECT_URI = import.meta.env.VITE_REDIRECT_URI ?? 'http://localhost:5173/callback'

export const tenantUrl = (slug: string) => `${API_V1}/tenants/${slug}`
export const appUrl = (slug: string, clientId: string) => `${tenantUrl(slug)}/apps/${clientId}`
export const keygoUrl = tenantUrl(TENANT)

/** Axios instance with credentials for auth endpoints (needs JSESSIONID cookie). */
export const authClient = axios.create({ withCredentials: true })

/** Axios instance for authenticated API calls (injects Bearer token via interceptor). */
export const apiClient = axios.create()

// Attach Authorization: Bearer <accessToken> from Zustand store (outside React — uses getState).
apiClient.interceptors.request.use((config) => {
  const token = useTokenStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
