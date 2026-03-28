import { useRef, useState } from 'react'
import type { ChangeEvent } from 'react'

/** Minimum ms a human needs to interact with and fill a form before submitting */
const MIN_INTERACTION_MS = 1500

export interface HoneypotFieldProps {
  value: string
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  tabIndex: -1
  autoComplete: 'off'
  'aria-hidden': true
}

/**
 * Anti-bot hook that combines:
 *  1. Honeypot field — bots fill hidden fields; real users never touch it.
 *  2. Timing check   — submissions faster than MIN_INTERACTION_MS are flagged as bots.
 *
 * On detection, block silently — never reveal the reason to the caller (no error signal to bots).
 */
export function useHoneypot() {
  const mountedAt = useRef(Date.now())
  const [value, setValue] = useState('')

  function validate(): { blocked: boolean; reason: 'honeypot_filled' | 'too_fast' | null } {
    if (value.length > 0) return { blocked: true, reason: 'honeypot_filled' }
    const elapsed = Date.now() - mountedAt.current
    if (elapsed < MIN_INTERACTION_MS) return { blocked: true, reason: 'too_fast' }
    return { blocked: false, reason: null }
  }

  const fieldProps: HoneypotFieldProps = {
    value,
    onChange: (e: ChangeEvent<HTMLInputElement>) => setValue(e.target.value),
    tabIndex: -1,
    autoComplete: 'off',
    'aria-hidden': true,
  }

  return { validate, fieldProps }
}
