import i18n from 'i18next'
import type { InitOptions } from 'i18next'
import { initReactI18next } from 'react-i18next'
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from './constants'
import { resolveInitialLocale } from './localeUtils'
import esCL from './locales/es-CL.json'
import enUS from './locales/en-US.json'

const resources = {
  'es-CL': { translation: esCL },
  'en-US': { translation: enUS },
} as const

if (!i18n.isInitialized) {
  const initOptions: InitOptions & { initImmediate?: boolean } = {
    // cast resources into the InitOptions expected shape without using `any`
    resources: resources as unknown as InitOptions['resources'],
    fallbackLng: DEFAULT_LOCALE,
    supportedLngs: [...SUPPORTED_LOCALES] as unknown as InitOptions['supportedLngs'],
    lng: resolveInitialLocale(),
    // initialize synchronously to avoid language 'flash' on first paint
    initImmediate: false,
    load: 'currentOnly',
    interpolation: {
      escapeValue: false,
    },
    returnNull: false,
  }

  i18n.use(initReactI18next).init(initOptions)
}

export { i18n }
