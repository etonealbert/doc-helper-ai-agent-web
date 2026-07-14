import { delay, http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { API_BASE } from '../../test/handlers'
import { server } from '../../test/server'
import { ApiError, getSafeErrorMessage } from './ApiError'
import { apiRequest } from './request'

async function captureRequestError(path: string): Promise<unknown> {
  try {
    await apiRequest(path, String)
    return undefined
  } catch (cause) {
    return cause
  }
}

describe('apiRequest', () => {
  it('preserves root code with a nested detail message', async () => {
    server.use(
      http.get(`${API_BASE}/mixed-error`, () =>
        HttpResponse.json(
          {
            code: 'crm_unavailable',
            detail: { message: 'CRM is unavailable.' },
          },
          { status: 503, headers: { 'X-Trace-Id': 'trace-error' } },
        ),
      ),
    )

    await expect(apiRequest('/mixed-error', String)).rejects.toMatchObject({
      message: 'CRM is unavailable.',
      code: 'crm_unavailable',
      traceId: 'trace-error',
      kind: 'service_unavailable',
    })
  })

  it('reads the backend root error object', async () => {
    server.use(
      http.get(`${API_BASE}/backend-error`, () =>
        HttpResponse.json(
          {
            error: {
              code: 'crm_unavailable',
              message: 'CRM persistence is unavailable.',
              trace_id: 'trace-backend-error',
            },
          },
          { status: 503 },
        ),
      ),
    )

    await expect(apiRequest('/backend-error', String)).rejects.toMatchObject({
      message: 'CRM persistence is unavailable.',
      code: 'crm_unavailable',
      traceId: 'trace-backend-error',
      kind: 'service_unavailable',
    })
  })

  it('maps 422 responses to a safe validation error', async () => {
    server.use(
      http.get(`${API_BASE}/validation-error`, () =>
        HttpResponse.json(
          { detail: 'backend validation internals' },
          { status: 422 },
        ),
      ),
    )

    const error = await captureRequestError('/validation-error')

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 422, kind: 'validation' })
    expect(getSafeErrorMessage(error)).toBe(
      'The request could not be processed. Review your message and try again.',
    )
    expect(getSafeErrorMessage(error, 'es')).toBe(
      'No se pudo procesar la solicitud. Revisa tu mensaje e inténtalo de nuevo.',
    )
  })

  it('maps 429 responses to a safe rate-limit error', async () => {
    server.use(
      http.get(`${API_BASE}/rate-limit-error`, () =>
        HttpResponse.json(
          { message: 'backend rate-limit internals' },
          { status: 429 },
        ),
      ),
    )

    const error = await captureRequestError('/rate-limit-error')

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 429, kind: 'rate_limit' })
    expect(getSafeErrorMessage(error)).toBe(
      'The assistant is receiving many requests. Please wait a moment and retry.',
    )
  })

  it('maps a generic 5xx response to a safe server error', async () => {
    server.use(
      http.get(`${API_BASE}/server-error`, () =>
        HttpResponse.json(
          { message: 'backend server internals' },
          { status: 502 },
        ),
      ),
    )

    const error = await captureRequestError('/server-error')

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 502, kind: 'server' })
    expect(getSafeErrorMessage(error)).toBe(
      'The assistant encountered a server error. Please try again.',
    )
  })

  it('rejects invalid JSON as an invalid response', async () => {
    server.use(
      http.get(
        `${API_BASE}/invalid-json`,
        () =>
          new HttpResponse('{invalid', {
            headers: { 'Content-Type': 'application/json' },
          }),
      ),
    )

    await expect(apiRequest('/invalid-json', String)).rejects.toMatchObject({
      kind: 'invalid_response',
    })
  })

  it('rejects a request that exceeds its explicit timeout', async () => {
    server.use(
      http.get(`${API_BASE}/slow`, async () => {
        await delay(50)
        return HttpResponse.json('eventually')
      }),
    )

    await expect(
      apiRequest('/slow', String, { timeoutMs: 10 }),
    ).rejects.toMatchObject({ kind: 'timeout' })
  })

  it('propagates a caller signal that is already aborted', async () => {
    server.use(
      http.get(`${API_BASE}/caller-abort`, async () => {
        await delay(50)
        return HttpResponse.json('eventually')
      }),
    )
    const controller = new AbortController()
    controller.abort('caller')

    await expect(
      apiRequest('/caller-abort', String, { signal: controller.signal }),
    ).rejects.toMatchObject({ kind: 'network' })
  })

  it('treats a caller abort reason of timeout as caller cancellation', async () => {
    server.use(
      http.get(`${API_BASE}/caller-timeout-reason`, async () => {
        await delay(50)
        return HttpResponse.json('eventually')
      }),
    )
    const controller = new AbortController()
    controller.abort('timeout')

    await expect(
      apiRequest('/caller-timeout-reason', String, {
        signal: controller.signal,
      }),
    ).rejects.toMatchObject({ kind: 'network' })
  })
})
