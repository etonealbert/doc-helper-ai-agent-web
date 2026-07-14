import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { API_BASE } from '../../../test/handlers'
import { healthFixture } from '../../../test/fixtures'
import { server } from '../../../test/server'
import { fetchHealth } from './healthApi'

describe('fetchHealth', () => {
  it('returns validated health data', async () => {
    await expect(fetchHealth()).resolves.toEqual(healthFixture)
  })

  it('rejects an empty health field', async () => {
    server.use(
      http.get(`${API_BASE}/health`, () =>
        HttpResponse.json({ ...healthFixture, service: '' }),
      ),
    )

    await expect(fetchHealth()).rejects.toMatchObject({
      kind: 'invalid_response',
    })
  })
})
