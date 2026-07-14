import { QueryClientProvider } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { LocalizationProvider } from '../shared/i18n/LocalizationProvider'
import { createQueryClient } from './queryClient'

interface AppProvidersProps {
  children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  const [queryClient] = useState(createQueryClient)

  return (
    <LocalizationProvider>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </LocalizationProvider>
  )
}
