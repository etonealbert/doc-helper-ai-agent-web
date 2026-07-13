import { apiRequest } from '../../../shared/api/request'
import {
  expectRecord,
  expectString,
} from '../../../shared/api/validation'

export interface HealthResponse {
  status: string
  service: string
  version: string
}

function validateHealth(value: unknown): HealthResponse {
  const record = expectRecord(value, 'Health response')
  return {
    status: expectString(record.status, 'Health status'),
    service: expectString(record.service, 'Health service'),
    version: expectString(record.version, 'Health version'),
  }
}

export function fetchHealth(signal?: AbortSignal): Promise<HealthResponse> {
  return apiRequest('/health', validateHealth, { signal })
}