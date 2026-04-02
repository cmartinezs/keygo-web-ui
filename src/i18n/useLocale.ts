import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { LOCALE_LABELS, LOCALE_STORAGE_KEY, SUPPORTED_LOCALES } from './constants'
import { i18n } from './config'
import { normalizeLocale, resolveDeviceLocale } from './localeUtils'

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
    localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale)
    await i18n.changeLanguage(nextLocale)
  }

  async function resetToDeviceLocale() {
    localStorage.removeItem(LOCALE_STORAGE_KEY)
    await i18n.changeLanguage(resolveDeviceLocale())
  }

  return {
    locale,
    setLocale,
    resetToDeviceLocale,
    supportedLocales,
    isAutoDetected: localStorage.getItem(LOCALE_STORAGE_KEY) === null,
  }
}
