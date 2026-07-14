import { useEffect, useState, type ReactNode } from 'react'
import { LocalizationContext } from './localizationContext'
import { defaultLocale, messages, type Locale } from './messages'

interface LocalizationProviderProps {
  children: ReactNode
  initialLocale?: Locale
}

export function LocalizationProvider({
  children,
  initialLocale = defaultLocale,
}: LocalizationProviderProps) {
  const [locale, setLocale] = useState<Locale>(initialLocale)
  const copy = messages[locale]

  useEffect(() => {
    const root = document.documentElement
    const description = document.querySelector<HTMLMetaElement>(
      'meta[name="description"]',
    )
    const previousLanguage = root.lang
    const previousTitle = document.title
    const previousDescription = description?.content

    root.lang = locale
    document.title = copy.metadata.title
    if (description) description.content = copy.metadata.description

    return () => {
      root.lang = previousLanguage
      document.title = previousTitle
      if (description && previousDescription !== undefined) {
        description.content = previousDescription
      }
    }
  }, [copy.metadata.description, copy.metadata.title, locale])

  return (
    <LocalizationContext.Provider value={{ locale, messages: copy, setLocale }}>
      {children}
    </LocalizationContext.Provider>
  )
}
