import i18n from 'i18next'
import { initReactI18next, useTranslation } from 'react-i18next'
import { en } from './locales/en'
import { vi } from './locales/vi'

export const LOCALES = ['en', 'vi'] as const
export type Locale = (typeof LOCALES)[number]

const STORAGE_KEY = 'lang'

function isLocale(value: unknown): value is Locale {
  return LOCALES.includes(value as Locale)
}

/**
 * `?lang=` wins, then the viewer's last choice, then English. The browser's own
 * language is deliberately ignored so English stays the default for everyone.
 */
function initialLocale(): Locale {
  const fromUrl = new URLSearchParams(window.location.search).get('lang')
  if (isLocale(fromUrl)) return fromUrl
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (isLocale(stored)) return stored
  } catch {
    // Storage can be blocked (private mode, sandboxed preview); fall through.
  }
  return 'en'
}

function applyLocale(locale: string) {
  document.documentElement.lang = locale
  document.title = i18n.t('meta.title')
  try {
    window.localStorage.setItem(STORAGE_KEY, locale)
  } catch {
    // Not persisting is fine; the page still renders in the chosen language.
  }
}

void i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, vi: { translation: vi } },
  lng: initialLocale(),
  fallbackLng: 'en',
  supportedLngs: LOCALES,
  interpolation: { escapeValue: false },
  initAsync: false,
})

applyLocale(i18n.language)
i18n.on('languageChanged', applyLocale)

/** The active locale, narrowed to the two this site ships. */
export function useLocale(): Locale {
  const { i18n: instance } = useTranslation()
  return instance.resolvedLanguage === 'vi' ? 'vi' : 'en'
}

export default i18n
