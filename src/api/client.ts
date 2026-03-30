import axios from 'axios'
import { useTokenStore } from '@/auth/tokenStore'
import { env } from '@/config/env'

export const KEYGO_BASE = env.KEYGO_BASE
export const API_V1 = `${KEYGO_BASE}/api/v1`
export const TENANT = env.TENANT_SLUG
export const CLIENT_ID = env.CLIENT_ID
export const REDIRECT_URI = env.REDIRECT_URI

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
