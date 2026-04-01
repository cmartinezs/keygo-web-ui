import { useEffect, useRef, useState } from 'react'

interface GlobalLoaderOverlayProps {
  active: boolean
  title?: string
  description?: string
  skipDelays?: boolean
  zIndexClassName?: string
}

const SHOW_DELAY_MS = 450
const MIN_VISIBLE_MS = 800

/**
 * Fullscreen loader for long-running operations.
 * Uses delay + minimum visible time to avoid visual flicker on fast requests.
 */
export function GlobalLoaderOverlay({
  active,
  title = 'Estamos preparando tu experiencia',
  description = 'Esto puede tardar unos segundos segun tu conexion.',
  skipDelays = false,
  zIndexClassName = 'z-40',
}: GlobalLoaderOverlayProps) {
  const [isVisible, setIsVisible] = useState(false)
  const shownAtRef = useRef<number | null>(null)
  const showTimerRef = useRef<number | null>(null)
  const hideTimerRef = useRef<number | null>(null)

  useEffect(() => {
    if (showTimerRef.current !== null) {
      window.clearTimeout(showTimerRef.current)
      showTimerRef.current = null
    }
    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current)
      hideTimerRef.current = null
    }

    if (active) {
      if (isVisible) return
      const delay = skipDelays ? 0 : SHOW_DELAY_MS
      showTimerRef.current = window.setTimeout(() => {
        shownAtRef.current = Date.now()
        setIsVisible(true)
      }, delay)
      return
    }

    if (!isVisible) return
    const elapsed = shownAtRef.current ? Date.now() - shownAtRef.current : 0
    const remaining = skipDelays ? 0 : Math.max(0, MIN_VISIBLE_MS - elapsed)
    hideTimerRef.current = window.setTimeout(() => {
      shownAtRef.current = null
      setIsVisible(false)
    }, remaining)
  }, [active, isVisible, skipDelays])

  useEffect(() => {
    return () => {
      if (showTimerRef.current !== null) window.clearTimeout(showTimerRef.current)
      if (hideTimerRef.current !== null) window.clearTimeout(hideTimerRef.current)
    }
  }, [])

  if (!isVisible) return null

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={`fixed inset-0 ${zIndexClassName} flex items-center justify-center px-6`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.24),_transparent_55%),linear-gradient(180deg,_rgba(2,6,23,0.7),_rgba(2,6,23,0.95))] backdrop-blur-sm" />

      <section className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-white/20 bg-slate-900/90 p-7 text-slate-100 shadow-2xl">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-amber-400/20 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-52 w-52 rounded-full bg-cyan-300/10 blur-3xl" aria-hidden="true" />

        <div className="relative flex items-center gap-4">
          <div className="relative h-12 w-12 shrink-0">
            <div className="absolute inset-0 rounded-full border-2 border-amber-300/20" aria-hidden="true" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-amber-300 border-r-amber-200 animate-spin" aria-hidden="true" />
            <div className="absolute inset-2 rounded-full bg-amber-300/20 animate-pulse" aria-hidden="true" />
          </div>

          <div>
            <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
            <p className="mt-1 text-sm text-slate-300 leading-relaxed">{description}</p>
          </div>
        </div>
      </section>
    </div>
  )
}