import { apiRequest } from '../../../shared/api/request'
import type { Locale } from '../../../shared/i18n/messages'
import type { ChatResponse } from '../model/types'
import { chatResponseSchema } from './chatSchemas'

interface ChatRequest {
  message: string
  userId: string
  sessionId: string
  locale: Locale
  signal?: AbortSignal
}

export function sendChat({
  message,
  userId,
  sessionId,
  locale,
  signal,
}: ChatRequest): Promise<ChatResponse> {
  return apiRequest('/api/chat', (value) => chatResponseSchema.parse(value), {
    method: 'POST',
    body: JSON.stringify({
      message,
      user_id: userId,
      session_id: sessionId,
      locale,
    }),
    signal,
  })
}
