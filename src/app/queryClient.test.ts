import { describe, expect, it } from 'vitest'
import { createQueryClient } from './queryClient'

describe('createQueryClient', () => {
  it('uses the production server-state defaults', () => {
    const queryClient = createQueryClient()

    expect(queryClient.getDefaultOptions()).toMatchObject({
      queries: {
        retry: 1,
        staleTime: 30_000,
        refetchOnWindowFocus: false,
      },
      mutations: { retry: false },
    })
  })
})
