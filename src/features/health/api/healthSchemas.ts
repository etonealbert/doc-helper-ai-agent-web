import { z } from 'zod'

export const healthSchema = z.object({
  status: z.string().min(1),
  service: z.string().min(1),
  version: z.string().min(1),
})

export type HealthResponse = z.infer<typeof healthSchema>
