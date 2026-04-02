import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type SupportedLocale } from './constants'

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
