import { http, HttpResponse } from 'msw'
import {
  chatFixture,
  documentsFixture,
  healthFixture,
  spanishChatFixture,
} from './fixtures'

export const API_BASE = 'https://api.albertlukmanovlabs.lol'

export const handlers = [
  http.get(`${API_BASE}/health`, () => HttpResponse.json(healthFixture)),
  http.get(`${API_BASE}/api/documents`, () =>
    HttpResponse.json(documentsFixture),
  ),
  http.post(`${API_BASE}/api/chat`, async ({ request }) => {
    const body = (await request.json()) as { locale?: string }
    return HttpResponse.json(
      body.locale === 'es' ? spanishChatFixture : chatFixture,
    )
  }),
]
