import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, type RenderOptions } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'
import { LocalizationProvider } from '../shared/i18n/LocalizationProvider'
import type { Locale } from '../shared/i18n/messages'

export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
  locale: Locale = 'en',
) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <LocalizationProvider initialLocale={locale}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </LocalizationProvider>
    )
  }

  return { ...render(ui, { wrapper: Wrapper, ...options }), queryClient }
}
