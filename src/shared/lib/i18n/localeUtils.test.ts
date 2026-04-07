import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  clearStoredManualLocale,
  getStoredManualLocale,
  persistManualLocale,
  resolveInitialLocale,
} from './localeUtils'

function createStorage() {
  const store = new Map<string, string>()

  return {
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null
    },
    setItem(key: string, value: string) {
      store.set(key, value)
    },
    removeItem(key: string) {
      store.delete(key)
    },
    clear() {
      store.clear()
    },
  }
}

describe('localeUtils', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('uses device locale by default when there is no manual preference', () => {
    vi.stubGlobal('localStorage', createStorage())
    vi.stubGlobal('navigator', { languages: ['en-US'], language: 'en-US' })

    expect(resolveInitialLocale()).toBe('en-US')
  })

  it('prefers stored manual locale over device locale', () => {
    vi.stubGlobal('localStorage', createStorage())
    vi.stubGlobal('navigator', { languages: ['en-US'], language: 'en-US' })

    persistManualLocale('es-CL')

    expect(getStoredManualLocale()).toBe('es-CL')
    expect(resolveInitialLocale()).toBe('es-CL')
  })

  it('ignores stale locale storage when it was not explicitly marked as manual', () => {
    const storage = createStorage()
    vi.stubGlobal('localStorage', storage)
    vi.stubGlobal('navigator', { languages: ['en-US'], language: 'en-US' })

    storage.setItem('keygo-locale', 'es-CL')

    expect(getStoredManualLocale()).toBeNull()
    expect(resolveInitialLocale()).toBe('en-US')
    expect(storage.getItem('keygo-locale')).toBeNull()
  })

  it('clears manual locale storage correctly', () => {
    vi.stubGlobal('localStorage', createStorage())
    vi.stubGlobal('navigator', { languages: ['es-CL'], language: 'es-CL' })

    persistManualLocale('en-US')
    clearStoredManualLocale()

    expect(getStoredManualLocale()).toBeNull()
    expect(resolveInitialLocale()).toBe('es-CL')
  })
})