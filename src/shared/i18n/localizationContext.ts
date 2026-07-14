import { createContext, useContext } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { Locale, Messages } from './messages'

export interface LocalizationContextValue {
  locale: Locale
  messages: Messages
  setLocale: Dispatch<SetStateAction<Locale>>
}

export const LocalizationContext =
  createContext<LocalizationContextValue | null>(null)

export function useLocalization(): LocalizationContextValue {
  const context = useContext(LocalizationContext)
  if (!context) {
    throw new Error('useLocalization must be used within LocalizationProvider.')
  }
  return context
}
