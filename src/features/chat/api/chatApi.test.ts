import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { API_BASE } from '../../../test/handlers'
import { chatFixture } from '../../../test/fixtures'
import { server } from '../../../test/server'
import { sendChat } from './chatApi'

const request = {
  message: 'What is the demonstration price?',
  userId: 'web-user-test',
  sessionId: 'session-test',
  locale: 'en' as const,
}

describe('sendChat', () => {
  it('sends the selected locale in the request body', async () => {
    let body: unknown
    server.use(
      http.post(`${API_BASE}/api/chat`, async ({ request }) => {
        body = await request.json()
        return HttpResponse.json(chatFixture)
      }),
    )

    await sendChat(request)

    expect(body).toEqual({
      message: request.message,
      user_id: request.userId,
      session_id: request.sessionId,
      locale: 'en',
    })
  })

  it('converts chat metadata to the frontend model', async () => {
    await expect(sendChat(request)).resolves.toEqual({
      message: chatFixture.message,
      classification: chatFixture.classification,
      actions: chatFixture.actions,
      requiresHuman: false,
      sources: ['pricing.md'],
      traceId: 'trace-demo-001',
      locale: 'en',
    })
  })

  it('defaults omitted chat metadata', async () => {
    server.use(
      http.post(`${API_BASE}/api/chat`, () =>
        HttpResponse.json({
          message: 'A safe demonstration answer.',
          classification: 'general_question',
          trace_id: 'trace-defaults',
          locale: 'en',
        }),
      ),
    )

    await expect(sendChat(request)).resolves.toMatchObject({
      actions: [],
      requiresHuman: false,
      sources: [],
    })
  })

  it('defaults an omitted action result to null', async () => {
    server.use(
      http.post(`${API_BASE}/api/chat`, () =>
        HttpResponse.json({
          ...chatFixture,
          actions: [{ tool: 'answer_with_rag', status: 'success' }],
        }),
      ),
    )

    await expect(sendChat(request)).resolves.toMatchObject({
      actions: [{ tool: 'answer_with_rag', status: 'success', result: null }],
    })
  })

  it('accepts an object action result with arbitrary properties', async () => {
    const result = {
      nested: { values: ['demo', 2, false, null] },
      additional_property: 'preserved',
    }
    server.use(
      http.post(`${API_BASE}/api/chat`, () =>
        HttpResponse.json({
          ...chatFixture,
          actions: [{ tool: 'answer_with_rag', status: 'success', result }],
        }),
      ),
    )

    await expect(sendChat(request)).resolves.toMatchObject({
      actions: [{ result }],
    })
  })

  it.each([
    ['explicit null', null],
    ['an array', []],
    ['a string', 'not-an-object'],
    ['a number', 3],
    ['a boolean', false],
  ])('rejects %s when an action result is present', async (_label, result) => {
    server.use(
      http.post(`${API_BASE}/api/chat`, () =>
        HttpResponse.json({
          ...chatFixture,
          actions: [{ tool: 'answer_with_rag', status: 'success', result }],
        }),
      ),
    )

    await expect(sendChat(request)).rejects.toMatchObject({
      kind: 'invalid_response',
    })
  })

  it('accepts response strings without frontend length restrictions', async () => {
    server.use(
      http.post(`${API_BASE}/api/chat`, () =>
        HttpResponse.json({
          ...chatFixture,
          message: '',
          trace_id: '',
          actions: [{ tool: '', status: 'success', result: {} }],
        }),
      ),
    )

    await expect(sendChat(request)).resolves.toMatchObject({
      message: '',
      traceId: '',
      actions: [{ tool: '' }],
    })
  })

  it('rejects an unsupported action status', async () => {
    server.use(
      http.post(`${API_BASE}/api/chat`, () =>
        HttpResponse.json({
          ...chatFixture,
          actions: [{ tool: 'answer_with_rag', status: 'unknown', result: {} }],
        }),
      ),
    )

    await expect(sendChat(request)).rejects.toMatchObject({
      kind: 'invalid_response',
    })
  })

  it('rejects an unsupported classification', async () => {
    server.use(
      http.post(`${API_BASE}/api/chat`, () =>
        HttpResponse.json({
          ...chatFixture,
          classification: 'unsupported',
        }),
      ),
    )

    await expect(sendChat(request)).rejects.toMatchObject({
      kind: 'invalid_response',
    })
  })

  it('rejects an unsupported response locale', async () => {
    server.use(
      http.post(`${API_BASE}/api/chat`, () =>
        HttpResponse.json({ ...chatFixture, locale: 'fr' }),
      ),
    )

    await expect(sendChat(request)).rejects.toMatchObject({
      kind: 'invalid_response',
    })
  })
})
