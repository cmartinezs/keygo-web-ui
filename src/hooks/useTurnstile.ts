import { useEffect, useRef, useState } from 'react'

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: TurnstileRenderOptions) => string
      remove: (widgetId: string) => void
      reset: (widgetId: string) => void
    }
  }
}

interface TurnstileRenderOptions {
  sitekey: string
  callback: (token: string) => void
  'error-callback'?: () => void
  'expired-callback'?: () => void
  theme?: 'light' | 'dark' | 'auto'
  size?: 'normal' | 'compact' | 'invisible'
}

const TURNSTILE_API_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined

/**
 * Cloudflare Turnstile CAPTCHA integration.
 *
 * Only activates when VITE_TURNSTILE_SITE_KEY env var is set.
 * Renders the interactive widget into `containerRef`.
 * The returned `token` must be sent to the backend for server-side verification.
 *
 * Get a free site key at: https://dash.cloudflare.com/?to=/:account/turnstile
 */
export function useTurnstile(containerRef: React.RefObject<HTMLDivElement | null>) {
  const [token, setToken] = useState<string | null>(null)
  const [hasError, setHasError] = useState(false)
  const widgetIdRef = useRef<string | null>(null)
  const enabled = Boolean(SITE_KEY)

  useEffect(() => {
    if (!enabled || !containerRef.current) return
    let destroyed = false

    function renderWidget() {
      if (destroyed || !containerRef.current || !window.turnstile) return
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: SITE_KEY!,
        callback: (t) => {
          setToken(t)
          setHasError(false)
        },
        'error-callback': () => {
          setHasError(true)
          setToken(null)
        },
        'expired-callback': () => setToken(null),
        theme: 'auto',
        size: 'normal',
      })
    }

    if (window.turnstile) {
      renderWidget()
    } else {
      const existing = document.getElementById('cf-turnstile-script')
      if (existing) {
        existing.addEventListener('load', renderWidget, { once: true })
      } else {
        const script = document.createElement('script')
        script.id = 'cf-turnstile-script'
        script.src = `${TURNSTILE_API_URL}?render=explicit`
        script.async = true
        script.addEventListener('load', renderWidget, { once: true })
        document.head.appendChild(script)
      }
    }

    return () => {
      destroyed = true
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current)
        widgetIdRef.current = null
      }
      setToken(null)
      setHasError(false)
    }
  }, [enabled]) // containerRef is a stable ref object

  function reset() {
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current)
    }
    setToken(null)
    setHasError(false)
  }

  return { token, hasError, enabled, reset }
}
