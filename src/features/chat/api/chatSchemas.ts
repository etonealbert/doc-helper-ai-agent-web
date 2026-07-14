import { z } from 'zod'
import { supportedLocales } from '../../../shared/i18n/messages'
import {
  classifications,
  toolStatuses,
  type ChatResponse,
} from '../model/types'

const toolActionSchema = z.object({
  tool: z.string(),
  status: z.enum(toolStatuses),
  result: z
    .record(z.string(), z.unknown())
    .optional()
    .transform((result) => result ?? null),
})

export const chatResponseSchema = z
  .object({
    message: z.string(),
    classification: z.enum(classifications),
    actions: z.array(toolActionSchema).default([]),
    requires_human: z.boolean().default(false),
    sources: z.array(z.string()).default([]),
    trace_id: z.string(),
    locale: z.enum(supportedLocales),
  })
  .transform(({ requires_human, trace_id, ...response }): ChatResponse => ({
    ...response,
    requiresHuman: requires_human,
    traceId: trace_id,
  }))
