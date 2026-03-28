import { useEffect, useRef } from 'react'
import { useTurnstile } from '@/hooks/useTurnstile'

interface TurnstileWidgetProps {
  /** Called whenever the CAPTCHA token changes (valid token or null on expiry/error). */
  onTokenChange: (token: string | null) => void
  className?: string
}

/**
 * Renders a Cloudflare Turnstile CAPTCHA widget.
 * Returns null when VITE_TURNSTILE_SITE_KEY is not configured (no-op).
 *
 * Usage:
 *   const [captchaToken, setCaptchaToken] = useState<string | null>(null)
 *   <TurnstileWidget onTokenChange={setCaptchaToken} />
 *   // Disable submit if: Boolean(import.meta.env.VITE_TURNSTILE_SITE_KEY) && !captchaToken
 */
export function TurnstileWidget({ onTokenChange, className }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const { token, hasError, enabled } = useTurnstile(containerRef)

  // Use a ref to avoid stale-closure issues with onTokenChange
  const callbackRef = useRef(onTokenChange)
  useEffect(() => {
    callbackRef.current = onTokenChange
  })

  useEffect(() => {
    callbackRef.current(token)
  }, [token])

  if (!enabled) return null

  return (
    <div>
      <div ref={containerRef} className={className} />
      {hasError && (
        <p className="mt-1.5 text-xs text-red-500" role="alert">
          Error al cargar la verificación de seguridad. Por favor, recarga la página.
        </p>
      )}
    </div>
  )
}
