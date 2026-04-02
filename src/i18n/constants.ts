export const LOCALE_STORAGE_KEY = 'keygo-locale'

export const LOCALE_SOURCE_STORAGE_KEY = 'keygo-locale-source'

export const MANUAL_LOCALE_SOURCE = 'manual'

export const SUPPORTED_LOCALES = ['es-CL', 'en-US'] as const

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]

export const DEFAULT_LOCALE: SupportedLocale = 'es-CL'

export const LOCALE_LABELS: Record<SupportedLocale, string> = {
  'es-CL': 'Espanol (Chile)',
  'en-US': 'English (United States)',
}
