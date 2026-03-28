import { useCallback, useRef, useState } from 'react'

interface RateLimitState {
  attempts: number
  lockedUntil: number | null
}

/**
 * Progressive lockout schedule:
 *  3 failures → 30 s
 *  5 failures → 5 min
 * 10 failures → 30 min
 */
const LOCKOUT_LEVELS: ReadonlyArray<{ minAttempts: number; durationMs: number }> = [
  { minAttempts: 10, durationMs: 30 * 60 * 1000 },
  { minAttempts: 5, durationMs: 5 * 60 * 1000 },
  { minAttempts: 3, durationMs: 30 * 1000 },
]

function getLockoutMs(attempts: number): number {
  for (const { minAttempts, durationMs } of LOCKOUT_LEVELS) {
    if (attempts >= minAttempts) return durationMs
  }
  return 0
}

function readState(key: string): RateLimitState {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return { attempts: 0, lockedUntil: null }
    return JSON.parse(raw) as RateLimitState
  } catch {
    return { attempts: 0, lockedUntil: null }
  }
}

function computeRemaining(lockedUntil: number | null): number {
  if (!lockedUntil) return 0
  return Math.max(0, Math.ceil((lockedUntil - Date.now()) / 1000))
}

/**
 * Client-side rate limiting with progressive lockout.
 * State persists in localStorage so it survives page refreshes.
 * Store only non-sensitive counters — no tokens or credentials.
 */
export function useRateLimit(formKey: string) {
  const storageKey = `keygo_rl_${formKey}`
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    computeRemaining(readState(storageKey).lockedUntil),
  )
  const [attempts, setAttempts] = useState(() => readState(storageKey).attempts)

  function startCountdown(lockedUntil: number) {
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      const r = computeRemaining(lockedUntil)
      setRemainingSeconds(r)
      if (r <= 0 && intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }, 1000)
  }

  // Kick off countdown on first render if already locked (e.g. after page refresh)
  const mountedRef = useRef(false)
  if (!mountedRef.current) {
    mountedRef.current = true
    const { lockedUntil } = readState(storageKey)
    if (lockedUntil && lockedUntil > Date.now()) startCountdown(lockedUntil)
  }

  const recordFailure = useCallback(() => {
    const state = readState(storageKey)
    const newAttempts = state.attempts + 1
    const lockMs = getLockoutMs(newAttempts)
    const lockedUntil = lockMs > 0 ? Date.now() + lockMs : null
    localStorage.setItem(storageKey, JSON.stringify({ attempts: newAttempts, lockedUntil }))
    setAttempts(newAttempts)
    if (lockedUntil) {
      setRemainingSeconds(Math.ceil(lockMs / 1000))
      startCountdown(lockedUntil)
    }
  }, [storageKey])

  const recordSuccess = useCallback(() => {
    localStorage.removeItem(storageKey)
    setAttempts(0)
    setRemainingSeconds(0)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [storageKey])

  return {
    isLocked: remainingSeconds > 0,
    remainingSeconds,
    attempts,
    recordFailure,
    recordSuccess,
  }
}
