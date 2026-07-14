const SENSITIVE_KEY_ALIASES = [
  'authorization',
  'authorization_header',
  'cookie',
  'cookie_header',
  'password',
  'password_hash',
  'password_digest',
  'secret',
  'token',
  'api_key',
  'credential',
  'credentials',
  'email',
  'email_address',
  'phone',
  'phone_number',
  'telephone',
  'telephone_number',
  'mobile',
  'mobile_number',
  'patient',
  'patient_id',
  'patient_identifier',
  'patient_name',
  'ssn',
  'social_security_number',
  'full_name',
  'first_name',
  'last_name',
  'address',
  'address_line_1',
  'address_line_2',
  'street_address',
  'postal_address',
  'date_of_birth',
  'birth_date',
  'dob',
  'medical_record',
  'medical_record_id',
  'medical_record_number',
  'mrn',
] as const

const SENSITIVE_CONTAINER_ALIASES = [
  'patient',
  'medical_record',
  'address_line',
  'contact',
] as const

const SENSITIVE_KEY_QUALIFIERS = ['value', 'payload'] as const

function normalizeStructuredKey(key: string): string {
  return key
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/([a-zA-Z])([0-9])/g, '$1_$2')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase()
}

function isSensitiveKey(key: string): boolean {
  const normalizedKey = normalizeStructuredKey(key)
  return (
    SENSITIVE_KEY_ALIASES.some(
      (alias) =>
        normalizedKey === alias ||
        normalizedKey.endsWith(`_${alias}`) ||
        SENSITIVE_KEY_QUALIFIERS.some(
          (qualifier) =>
            normalizedKey === `${alias}_${qualifier}` ||
            normalizedKey.endsWith(`_${alias}_${qualifier}`),
        ),
    ) ||
    SENSITIVE_CONTAINER_ALIASES.some((alias) =>
      `_${normalizedKey}_`.includes(`_${alias}_`),
    )
  )
}

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
      .filter(([key]) => !isSensitiveKey(key))
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
