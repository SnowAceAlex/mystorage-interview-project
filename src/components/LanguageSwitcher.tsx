import { useTranslation } from 'react-i18next'
import { LOCALES, useLocale } from '../i18n'

const NAMES = { en: 'English', vi: 'Tiếng Việt' } as const

export default function LanguageSwitcher() {
  const { t, i18n } = useTranslation()
  const active = useLocale()

  return (
    <div className="lang-switch" role="group" aria-label={t('topbar.language')}>
      {LOCALES.map((locale) => (
        <button
          key={locale}
          type="button"
          lang={locale}
          title={NAMES[locale]}
          aria-pressed={locale === active}
          onClick={() => void i18n.changeLanguage(locale)}
        >
          {locale.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
