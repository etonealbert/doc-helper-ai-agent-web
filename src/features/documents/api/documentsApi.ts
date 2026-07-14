import { apiRequest } from '../../../shared/api/request'
import { documentsSchema, type DocumentsResponse } from './documentSchemas'

export type { DocumentsResponse, KnowledgeDocument } from './documentSchemas'

export function fetchDocuments(
  signal?: AbortSignal,
): Promise<DocumentsResponse> {
  return apiRequest('/api/documents', (value) => documentsSchema.parse(value), {
    signal,
  })
}
