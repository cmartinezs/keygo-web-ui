import {
  DEFAULT_LOCALE,
  LOCALE_SOURCE_STORAGE_KEY,
  LOCALE_STORAGE_KEY,
  MANUAL_LOCALE_SOURCE,
  SUPPORTED_LOCALES,
  type SupportedLocale,
} from './constants'

export function isSupportedLocale(value: string): value is SupportedLocale {
  return SUPPORTED_LOCALES.includes(value as SupportedLocale)
}

export function normalizeLocale(value: string | null | undefined): SupportedLocale {
  if (!value) return DEFAULT_LOCALE
  if (isSupportedLocale(value)) return value

  const lower = value.toLowerCase()
  if (lower.startsWith('es')) return 'es-CL'
  if (lower.startsWith('en')) return 'en-US'
  return DEFAULT_LOCALE
}

export function resolveDeviceLocale(): SupportedLocale {
  if (typeof navigator === 'undefined') return DEFAULT_LOCALE
  const candidate = navigator.languages?.[0] ?? navigator.language
  return normalizeLocale(candidate)
}

export function getStoredManualLocale(): SupportedLocale | null {
  if (typeof localStorage === 'undefined') return null

  const localeSource = localStorage.getItem(LOCALE_SOURCE_STORAGE_KEY)
  const storedLocale = localStorage.getItem(LOCALE_STORAGE_KEY)

  if (localeSource !== MANUAL_LOCALE_SOURCE) {
    if (storedLocale) {
      localStorage.removeItem(LOCALE_STORAGE_KEY)
    }
    if (localeSource) {
      localStorage.removeItem(LOCALE_SOURCE_STORAGE_KEY)
    }
    return null
  }

  if (!storedLocale) return null
  return normalizeLocale(storedLocale)
}

export function persistManualLocale(locale: SupportedLocale) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  localStorage.setItem(LOCALE_SOURCE_STORAGE_KEY, MANUAL_LOCALE_SOURCE)
}

export function clearStoredManualLocale() {
  if (typeof localStorage === 'undefined') return
  localStorage.removeItem(LOCALE_STORAGE_KEY)
  localStorage.removeItem(LOCALE_SOURCE_STORAGE_KEY)
}

export function resolveInitialLocale(): SupportedLocale {
  return getStoredManualLocale() ?? resolveDeviceLocale()
}
