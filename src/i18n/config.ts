import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from './constants'
import { resolveInitialLocale } from './localeUtils'
import esCL from './locales/es-CL.json'
import enUS from './locales/en-US.json'

const resources = {
  'es-CL': { translation: esCL },
  'en-US': { translation: enUS },
}

if (!i18n.isInitialized) {
  i18n
    .use(initReactI18next)
    .init({
      resources,
      fallbackLng: DEFAULT_LOCALE,
      supportedLngs: [...SUPPORTED_LOCALES],
      lng: resolveInitialLocale(),
      load: 'currentOnly',
      interpolation: {
        escapeValue: false,
      },
      returnNull: false,
    })
}

export { i18n }
