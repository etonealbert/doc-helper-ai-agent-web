const SENSITIVE_KEY_PATTERN =
  /authorization|cookie|password|secret|token|email|phone|patient|ssn/i

export function humanizeIdentifier(value: string): string {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

export function sanitizeStructuredData(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitizeStructuredData)
  if (!value || typeof value !== 'object') return value

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !SENSITIVE_KEY_PATTERN.test(key))
      .map(([key, item]) => [key, sanitizeStructuredData(item)]),
  )
}

export function formatStructuredData(value: unknown): string {
  const safeValue = sanitizeStructuredData(value)
  if (safeValue === null || safeValue === undefined) return 'No result details'
  if (typeof safeValue === 'string') return safeValue
  if (typeof safeValue === 'number' || typeof safeValue === 'boolean') {
    return String(safeValue)
  }
  return JSON.stringify(safeValue, null, 2)
}

export function compactTraceId(value: string): string {
  if (value.length <= 18) return value
  return `${value.slice(0, 8)}...${value.slice(-6)}`
}