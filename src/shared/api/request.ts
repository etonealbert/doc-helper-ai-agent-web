import { appConfig } from '../../app/config'
import { ApiError, type ApiErrorKind } from './ApiError'

interface RequestOptions extends Omit<RequestInit, 'signal'> {
  signal?: AbortSignal
  timeoutMs?: number
}

type Validator<T> = (value: unknown) => T

interface ErrorEnvelope {
  message?: string
  code?: string
  traceId?: string
}

function readString(
  record: Record<string, unknown>,
  ...keys: string[]
): string | undefined {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string' && value.trim()) return value
  }
  return undefined
}

function parseErrorEnvelope(value: unknown): ErrorEnvelope {
  if (!value || typeof value !== 'object') return {}

  const root = value as Record<string, unknown>
  const detail =
    root.detail && typeof root.detail === 'object'
      ? (root.detail as Record<string, unknown>)
      : {}

  return {
    message:
      readString(detail, 'message', 'error', 'detail') ??
      readString(root, 'message', 'error', 'detail'),
    code:
      readString(detail, 'code', 'error_code') ??
      readString(root, 'code', 'error_code'),
    traceId:
      readString(detail, 'trace_id', 'traceId') ??
      readString(root, 'trace_id', 'traceId'),
  }
}

function errorKindForStatus(status: number): ApiErrorKind {
  if (status === 422) return 'validation'
  if (status === 429) return 'rate_limit'
  if (status === 503) return 'service_unavailable'
  return status >= 500 ? 'server' : 'validation'
}

async function parseJson(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text) return null

  try {
    return JSON.parse(text) as unknown
  } catch (cause) {
    throw new ApiError('The server returned invalid JSON.', {
      status: response.status,
      kind: 'invalid_response',
      cause,
    })
  }
}

export async function apiRequest<T>(
  path: string,
  validate: Validator<T>,
  options: RequestOptions = {},
): Promise<T> {
  const controller = new AbortController()
  const timeoutMs = options.timeoutMs ?? appConfig.requestTimeoutMs
  let didTimeout = false
  const timeoutId = window.setTimeout(() => {
    if (controller.signal.aborted) return
    didTimeout = true
    controller.abort()
  }, timeoutMs)
  const abortFromCaller = () => controller.abort(options.signal?.reason)
  if (options.signal?.aborted) {
    controller.abort(options.signal.reason)
  } else {
    options.signal?.addEventListener('abort', abortFromCaller, { once: true })
  }

  try {
    const response = await fetch(`${appConfig.apiBaseUrl}${path}`, {
      ...options,
      headers: {
        Accept: 'application/json',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
      signal: controller.signal,
    })
    const body = await parseJson(response)

    if (!response.ok) {
      const envelope = parseErrorEnvelope(body)
      throw new ApiError(
        envelope.message || `Request failed (${response.status}).`,
        {
          status: response.status,
          code: envelope.code,
          traceId:
            envelope.traceId ?? response.headers.get('X-Trace-Id') ?? undefined,
          kind: errorKindForStatus(response.status),
        },
      )
    }

    try {
      return validate(body)
    } catch (cause) {
      if (cause instanceof ApiError) throw cause
      throw new ApiError('The response did not match the expected format.', {
        status: response.status,
        traceId: response.headers.get('X-Trace-Id') ?? undefined,
        kind: 'invalid_response',
        cause,
      })
    }
  } catch (cause) {
    if (cause instanceof ApiError) throw cause
    if (controller.signal.aborted) {
      throw new ApiError('The request was aborted.', {
        kind: didTimeout ? 'timeout' : 'network',
        cause,
      })
    }
    throw new ApiError('Network request failed.', { kind: 'network', cause })
  } finally {
    window.clearTimeout(timeoutId)
    options.signal?.removeEventListener('abort', abortFromCaller)
  }
}
