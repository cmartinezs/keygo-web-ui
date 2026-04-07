import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { LOCALE_LABELS, SUPPORTED_LOCALES } from './constants'
import { i18n } from './config'
import {
  clearStoredManualLocale,
  getStoredManualLocale,
  normalizeLocale,
  persistManualLocale,
  resolveDeviceLocale,
} from './localeUtils'

interface LocaleOption {
  value: string
  label: string
}

export function useLocale() {
  const { i18n: i18next } = useTranslation()
  const locale = normalizeLocale(i18next.resolvedLanguage ?? i18next.language)

  useEffect(() => {
    if (typeof document !== 'undefined' && locale) {
      document.documentElement.lang = locale
    }
  }, [locale])

  const supportedLocales = useMemo<LocaleOption[]>(() => {
    return SUPPORTED_LOCALES.map((value) => ({
      value,
      label: LOCALE_LABELS[value],
    }))
  }, [])

  async function setLocale(nextLocale: string) {
    if (!SUPPORTED_LOCALES.includes(nextLocale as (typeof SUPPORTED_LOCALES)[number])) return
    persistManualLocale(nextLocale as (typeof SUPPORTED_LOCALES)[number])
    await i18n.changeLanguage(nextLocale)
  }

  async function resetToDeviceLocale() {
    clearStoredManualLocale()
    await i18n.changeLanguage(resolveDeviceLocale())
  }

  return {
    locale,
    setLocale,
    resetToDeviceLocale,
    supportedLocales,
    isAutoDetected: getStoredManualLocale() === null,
  }
}
