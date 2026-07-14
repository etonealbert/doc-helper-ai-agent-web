import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { API_BASE } from '../../../test/handlers'
import { documentsFixture } from '../../../test/fixtures'
import { server } from '../../../test/server'
import { fetchDocuments } from './documentsApi'

describe('fetchDocuments', () => {
  it('converts aggregate keys to camel case', async () => {
    await expect(fetchDocuments()).resolves.toEqual({
      documents: [{ source: 'pricing.md', chunks: 4 }],
      totalDocuments: 1,
      totalChunks: 4,
    })
  })

  it('defaults an empty deployed response', async () => {
    server.use(
      http.get(`${API_BASE}/api/documents`, () => HttpResponse.json({})),
    )

    await expect(fetchDocuments()).resolves.toEqual({
      documents: [],
      totalDocuments: 0,
      totalChunks: 0,
    })
  })

  it('rejects a negative count', async () => {
    server.use(
      http.get(`${API_BASE}/api/documents`, () =>
        HttpResponse.json({ ...documentsFixture, total_chunks: -1 }),
      ),
    )

    await expect(fetchDocuments()).rejects.toMatchObject({
      kind: 'invalid_response',
    })
  })

  it('rejects a fractional count', async () => {
    server.use(
      http.get(`${API_BASE}/api/documents`, () =>
        HttpResponse.json({ ...documentsFixture, total_chunks: 1.5 }),
      ),
    )

    await expect(fetchDocuments()).rejects.toMatchObject({
      kind: 'invalid_response',
    })
  })
})
