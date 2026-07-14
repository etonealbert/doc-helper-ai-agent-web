import { afterEach, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

it('retains the cause of an invalid API base URL', async () => {
  vi.stubEnv('VITE_API_BASE_URL', 'not-a-url')

  await expect(import('./config')).rejects.toMatchObject({
    message: expect.stringContaining('Invalid VITE_API_BASE_URL'),
    cause: expect.any(TypeError),
  })
})
