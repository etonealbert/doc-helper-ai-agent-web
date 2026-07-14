import { useLocalization } from '../i18n/localizationContext'
import type { Locale } from '../i18n/messages'
import styles from '../../styles/ui.module.css'

export function LanguageSwitcher() {
  const { locale, messages, setLocale } = useLocalization()

  const options: Array<{
    locale: Locale
    shortLabel: string
    label: string
    title: string
  }> = [
    {
      locale: 'es',
      shortLabel: 'ES',
      label: messages.language.spanish,
      title: messages.language.switchToSpanish,
    },
    {
      locale: 'en',
      shortLabel: 'EN',
      label: messages.language.english,
      title: messages.language.switchToEnglish,
    },
  ]

  return (
    <div
      className={styles.languageSwitcher}
      role="group"
      aria-label={messages.language.groupLabel}
    >
      {options.map((option) => (
        <button
          key={option.locale}
          type="button"
          aria-label={option.label}
          aria-pressed={locale === option.locale}
          title={option.title}
          onClick={() => setLocale(option.locale)}
        >
          <span className={styles.languageName}>{option.label}</span>
          <span className={styles.languageNameShort} aria-hidden="true">
            {option.shortLabel}
          </span>
        </button>
      ))}
    </div>
  )
}
