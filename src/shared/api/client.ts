import axios from 'axios'
import { useTokenStore } from '@/shared/lib/auth/tokenStore'
import { env } from '@/shared/lib/config/env'
import {
  normalizeApiError,
  type AxiosErrorWithAppApiError,
} from './errorNormalizer'
import { useDevConsoleStore } from '@/shared/lib/devConsole/store'
import { getTraceId } from '@/shared/lib/traceId'
import { i18n } from '@/shared/lib/i18n/config'
import { normalizeLocale } from '@/shared/lib/i18n/localeUtils'

// ── Axios config type augmentation for DevConsole tracking ─────────────────────
declare module 'axios' {
  interface InternalAxiosRequestConfig {
    _devConsoleId?: string
    _devConsoleStart?: number
  }
}

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

// Inject X-Trace-ID for request correlation (shared per page/route).
function attachTraceId(config: import('axios').InternalAxiosRequestConfig) {
  config.headers['X-Trace-ID'] = getTraceId()
  return config
}

// Inject Accept-Language based on the active i18n locale (e.g. es-CL, en-US).
function attachAcceptLanguage(config: import('axios').InternalAxiosRequestConfig) {
  const locale = normalizeLocale(i18n.resolvedLanguage ?? i18n.language)
  config.headers['Accept-Language'] = locale
  return config
}

apiClient.interceptors.request.use(attachTraceId)
apiClient.interceptors.request.use(attachAcceptLanguage)
authClient.interceptors.request.use(attachTraceId)
authClient.interceptors.request.use(attachAcceptLanguage)

function onRejectedWithNormalizedError(error: unknown): Promise<never> {
  const appApiError = normalizeApiError(error)

  // Push structured diagnostics to the DevConsole output for server-side errors so
  // operators can inspect detail / exception / layer / trace_id without opening DevTools.
  if (appApiError.origin === 'SERVER_PROCESSING' || (appApiError.httpStatus !== undefined && appApiError.httpStatus >= 500)) {
    const store = useDevConsoleStore.getState()
    store.push({ type: 'error', text: `[API ${appApiError.httpStatus ?? '5xx'}] ${appApiError.code ?? 'ERROR'} — ${appApiError.clientMessage}` })
    if (appApiError.traceId)   store.push({ type: 'output', text: `  trace_id  ${appApiError.traceId}` })
    if (appApiError.exception) store.push({ type: 'output', text: `  exception ${appApiError.exception}` })
    if (appApiError.detail)    store.push({ type: 'output', text: `  detail    ${appApiError.detail}` })
  }

  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosErrorWithAppApiError
    axiosError.appApiError = appApiError
    return Promise.reject(axiosError)
  }

  return Promise.reject(appApiError)
}

apiClient.interceptors.response.use((response) => response, onRejectedWithNormalizedError)
authClient.interceptors.response.use((response) => response, onRejectedWithNormalizedError)

// ── DevConsole HTTP logging interceptors ───────────────────────────────────────
// Captures request/response pairs and routes them to the DevConsole store.
// These interceptors are placed last so they observe the already-enriched config.

let _devSeq = 0

function attachDevConsoleRequest(config: import('axios').InternalAxiosRequestConfig) {
  const id      = `req-${Date.now()}-${++_devSeq}`
  const startMs = performance.now()

  config._devConsoleId    = id
  config._devConsoleStart = startMs

  // Sanitize: never log Authorization header value
  const safeHeaders: Record<string, string> = {}
  if (config.headers) {
    for (const [k] of Object.entries(config.headers.toJSON ? config.headers.toJSON() : config.headers)) {
      safeHeaders[k] = k.toLowerCase() === 'authorization' ? '[redacted]' : String(config.headers[k] ?? '')
    }
  }

  useDevConsoleStore.getState().logRequest({
    id,
    timestamp:   new Date(),
    method:      (config.method ?? 'GET').toUpperCase(),
    url:         (config.baseURL ?? '') + (config.url ?? ''),
    requestBody: config.data as unknown,
    _startMs:    startMs,
  })

  return config
}

apiClient.interceptors.request.use(attachDevConsoleRequest)
authClient.interceptors.request.use(attachDevConsoleRequest)

function finalizeDevConsoleSuccess(response: import('axios').AxiosResponse) {
  const id    = response.config._devConsoleId
  const start = response.config._devConsoleStart
  if (id) {
    useDevConsoleStore.getState().finalizeRequest(id, {
      status:       response.status,
      duration:     start !== undefined ? performance.now() - start : undefined,
      responseBody: response.data as unknown,
    })
  }
  return response
}

function finalizeDevConsoleError(error: unknown) {
  if (axios.isAxiosError(error) && error.config) {
    const id    = error.config._devConsoleId
    const start = error.config._devConsoleStart
    if (id) {
      useDevConsoleStore.getState().finalizeRequest(id, {
        status:       error.response?.status,
        duration:     start !== undefined ? performance.now() - start : undefined,
        responseBody: error.response?.data as unknown,
        error:        error.message,
      })
    }
  }
  return Promise.reject(error)
}

apiClient.interceptors.response.use(finalizeDevConsoleSuccess, finalizeDevConsoleError)
authClient.interceptors.response.use(finalizeDevConsoleSuccess, finalizeDevConsoleError)

