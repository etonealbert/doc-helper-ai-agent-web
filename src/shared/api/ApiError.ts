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

export function getSafeErrorMessage(
  error: unknown,
  locale: Locale = 'en',
): string {
  const copy = messages[locale].errors
  if (!(error instanceof ApiError)) {
    return copy.network
  }

  switch (error.kind) {
    case 'validation':
      return copy.validation
    case 'rate_limit':
      return copy.rateLimit
    case 'service_unavailable':
      return error.code === 'crm_unavailable'
        ? copy.crmUnavailable
        : copy.serviceUnavailable
    case 'server':
      return copy.server
    case 'timeout':
      return copy.timeout
    case 'invalid_response':
      return copy.invalidResponse
    case 'network':
      return copy.network
  }
}
import { messages, type Locale } from '../i18n/messages'
