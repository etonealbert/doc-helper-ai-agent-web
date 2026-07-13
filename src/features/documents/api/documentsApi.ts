import { apiRequest } from '../../../shared/api/request'
import {
  expectArray,
  expectNumber,
  expectRecord,
  expectString,
} from '../../../shared/api/validation'

export interface KnowledgeDocument {
  source: string
  chunks: number
}

export interface DocumentsResponse {
  documents: KnowledgeDocument[]
  totalDocuments: number
  totalChunks: number
}

function validateDocuments(value: unknown): DocumentsResponse {
  const record = expectRecord(value, 'Documents response')
  const documents = expectArray(record.documents, 'Documents').map(
    (document, index) => {
      const item = expectRecord(document, `Document ${index + 1}`)
      return {
        source: expectString(item.source, `Document ${index + 1} source`),
        chunks: expectNumber(item.chunks, `Document ${index + 1} chunks`),
      }
    },
  )

  return {
    documents,
    totalDocuments: expectNumber(record.total_documents, 'Total documents'),
    totalChunks: expectNumber(record.total_chunks, 'Total chunks'),
  }
}

export function fetchDocuments(
  signal?: AbortSignal,
): Promise<DocumentsResponse> {
  return apiRequest('/api/documents', validateDocuments, { signal })
}