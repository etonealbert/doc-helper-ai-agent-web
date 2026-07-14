import { z } from 'zod'

const knowledgeDocumentSchema = z.object({
  source: z.string().min(1),
  chunks: z.number().int().nonnegative(),
})

export const documentsSchema = z
  .object({
    documents: z.array(knowledgeDocumentSchema).default([]),
    total_documents: z.number().int().nonnegative().default(0),
    total_chunks: z.number().int().nonnegative().default(0),
  })
  .transform(({ total_documents, total_chunks, ...response }) => ({
    ...response,
    totalDocuments: total_documents,
    totalChunks: total_chunks,
  }))

export type DocumentsResponse = z.infer<typeof documentsSchema>
export type KnowledgeDocument = DocumentsResponse['documents'][number]
