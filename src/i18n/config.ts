import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import { DEFAULT_LOCALE, LOCALE_STORAGE_KEY, SUPPORTED_LOCALES } from './constants'
import { resolveDeviceLocale } from './localeUtils'
import esCL from './locales/es-CL.json'
import enUS from './locales/en-US.json'

const resources = {
  'es-CL': { translation: esCL },
  'en-US': { translation: enUS },
}

if (!i18n.isInitialized) {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources,
      fallbackLng: DEFAULT_LOCALE,
      supportedLngs: [...SUPPORTED_LOCALES],
      lng: resolveDeviceLocale(),
      load: 'currentOnly',
      interpolation: {
        escapeValue: false,
      },
      detection: {
        order: ['localStorage', 'navigator'],
        caches: ['localStorage'],
        lookupLocalStorage: LOCALE_STORAGE_KEY,
      },
      returnNull: false,
    })
}

export { i18n }
