import { useEffect } from 'react'
import { create } from 'zustand'

export type ThemePreference = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'keygo-theme'

function getSystemIsDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function applyTheme(preference: ThemePreference): void {
  const dark = preference === 'dark' || (preference === 'system' && getSystemIsDark())
  document.documentElement.classList.toggle('dark', dark)
}

// Read persisted preference synchronously — safe because localStorage is sync
const storedPreference = (localStorage.getItem(STORAGE_KEY) as ThemePreference | null) ?? 'system'

// ── Zustand store ─────────────────────────────────────────────────────────────

interface ThemeStore {
  preference: ThemePreference
  setPreference: (p: ThemePreference) => void
}

export const useThemeStore = create<ThemeStore>()((set) => ({
  preference: storedPreference,
  setPreference: (preference) => {
    localStorage.setItem(STORAGE_KEY, preference)
    applyTheme(preference)
    set({ preference })
  },
}))

// ── Public hook ───────────────────────────────────────────────────────────────

/**
 * Returns the current theme preference and a function to cycle through
 * system → light → dark → system.
 * Also wires up a system-preference listener when in 'system' mode.
 */
export function useTheme() {
  const { preference, setPreference } = useThemeStore()

  // Keep in sync with OS changes when preference is 'system'
  useEffect(() => {
    if (preference !== 'system') return
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => applyTheme('system')
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [preference])

  function cycleTheme(): void {
    const next: ThemePreference =
      preference === 'system' ? 'light' : preference === 'light' ? 'dark' : 'system'
    setPreference(next)
  }

  return { preference, setPreference, cycleTheme }
}
