export type ApiErrorKind =
  | 'validation'
  | 'rate_limit'
  | 'service_unavailable'
  | 'server'
  | 'network'
  | 'timeout'
  | 'invalid_response'

interface ApiErrorOptions {
  status?: number
  code?: string
  traceId?: string
  kind: ApiErrorKind
  cause?: unknown
}

export class ApiError extends Error {
  readonly status?: number
  readonly code?: string
  readonly traceId?: string
  readonly kind: ApiErrorKind

  constructor(message: string, options: ApiErrorOptions) {
    super(message, { cause: options.cause })
    this.name = 'ApiError'
    this.status = options.status
    this.code = options.code
    this.traceId = options.traceId
    this.kind = options.kind
  }
}

export function getSafeErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return 'We could not reach the assistant. Check your connection and try again.'
  }

  switch (error.kind) {
    case 'validation':
      return 'The request could not be processed. Review your message and try again.'
    case 'rate_limit':
      return 'The assistant is receiving many requests. Please wait a moment and retry.'
    case 'service_unavailable':
      return error.code === 'crm_unavailable'
        ? 'The scheduling service is temporarily unavailable. No appointment or callback was created.'
        : 'A supporting service is temporarily unavailable. Please try again shortly.'
    case 'server':
      return 'The assistant encountered a server error. Please try again.'
    case 'timeout':
      return 'The request took too long. No action has been confirmed; please retry.'
    case 'invalid_response':
      return 'The assistant returned an unexpected response. Please try again.'
    case 'network':
      return 'We could not reach the assistant. Check your connection and try again.'
  }
}
