import { apiRequest } from '../../../shared/api/request'
import { healthSchema, type HealthResponse } from './healthSchemas'

export type { HealthResponse } from './healthSchemas'

export function fetchHealth(signal?: AbortSignal): Promise<HealthResponse> {
  return apiRequest('/health', (value) => healthSchema.parse(value), { signal })
}
