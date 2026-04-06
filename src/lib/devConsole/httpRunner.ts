import { useTokenStore } from '@/auth/tokenStore'
import { env } from '@/config/env'
import { useDevConsoleStore } from './store'
import type { OutputInput } from './store'

// ── Types ─────────────────────────────────────────────────────────────────────

type PushFn = (line: OutputInput) => void

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export interface HttpParams {
  method: HttpMethod
  url: string
  body?: string    // raw JSON string (optional)
  headers?: string // "Key: Value, Key2: Value2" (optional)
}

// ── HTTP executor ─────────────────────────────────────────────────────────────

/**
 * Executes an ad-hoc HTTP request from the DevConsole, injects the current
 * Bearer token, logs the entry to the global httpLog, and pushes formatted
 * output to the active console tab.
 */
export async function executeHttpRequest(params: HttpParams, push: PushFn): Promise<void> {
  const { method, url, body, headers } = params

  // Resolve relative paths against the configured backend base URL
  const fullUrl = url.startsWith('/') ? `${env.KEYGO_BASE}${url}` : url

  // ── Build request headers ─────────────────────────────────────────────────
  const reqHeaders: Record<string, string> = {}

  if (body && !['GET', 'DELETE'].includes(method)) {
    reqHeaders['Content-Type'] = 'application/json'
  }

  // Inject access token from Zustand store (outside React — safe to use getState)
  const token = useTokenStore.getState().accessToken
  if (token) {
    reqHeaders['Authorization'] = `Bearer ${token}`
  }

  // Parse extra headers: "Key: Value, Key2: Value2"
  if (headers?.trim()) {
    for (const part of headers.split(',')) {
      const colonIdx = part.indexOf(':')
      if (colonIdx !== -1) {
        const key = part.slice(0, colonIdx).trim()
        const val = part.slice(colonIdx + 1).trim()
        if (key) reqHeaders[key] = val
      }
    }
  }

  // ── Log entry to httpLog ──────────────────────────────────────────────────
  const store    = useDevConsoleStore.getState()
  const entryId  = `http-run-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
  const startMs  = Date.now()

  let parsedBody: unknown = undefined
  if (body) {
    try { parsedBody = JSON.parse(body) } catch { parsedBody = body }
  }

  store.logRequest({
    id:          entryId,
    timestamp:   new Date(),
    method,
    url:         fullUrl,
    requestBody: parsedBody,
    _startMs:    startMs,
  })

  // ── Execute ───────────────────────────────────────────────────────────────
  push({ type: 'info', text: `  ↗ ${method} ${fullUrl}` })

  const fetchBody = body && !['GET', 'DELETE'].includes(method) ? body : undefined

  try {
    const response = await fetch(fullUrl, { method, headers: reqHeaders, body: fetchBody })
    const duration    = Date.now() - startMs
    const contentType = response.headers.get('content-type') ?? ''

    let responseBody: unknown
    if (contentType.includes('application/json')) {
      try { responseBody = await response.json() } catch { responseBody = null }
    } else {
      responseBody = await response.text()
    }

    store.finalizeRequest(entryId, { status: response.status, duration, responseBody })

    push({
      type: response.ok ? 'info' : 'error',
      text: `  ↙ ${response.status} ${response.statusText} (${duration}ms)`,
    })

    const bodyStr  = typeof responseBody === 'string'
      ? responseBody
      : JSON.stringify(responseBody, null, 2)
    const maxLen   = 2000
    const display  = bodyStr.length > maxLen
      ? bodyStr.slice(0, maxLen) + `\n  … (truncado, ${bodyStr.length} chars total)`
      : bodyStr

    push({ type: 'output', text: display })

  } catch (err) {
    const duration = Date.now() - startMs
    const msg      = err instanceof Error ? err.message : String(err)
    store.finalizeRequest(entryId, { duration, error: msg })
    push({ type: 'error', text: `  ✗ Error de red (${duration}ms): ${msg}` })
  }
}
