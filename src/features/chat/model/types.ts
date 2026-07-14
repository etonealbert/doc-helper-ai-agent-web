export const classifications = [
  'appointment_request',
  'pricing_question',
  'document_question',
  'emergency_or_pain',
  'complaint',
  'general_question',
  'human_escalation',
] as const

export type Classification = (typeof classifications)[number]

export const toolStatuses = ['success', 'error', 'skipped'] as const
export type ToolStatus = (typeof toolStatuses)[number]

export interface ToolAction {
  tool: string
  status: ToolStatus
  result: Record<string, unknown> | null
}

export interface ChatResponse {
  message: string
  classification: Classification
  actions: ToolAction[]
  requiresHuman: boolean
  sources: string[]
  traceId: string
  locale: Locale
}

export interface ConversationMessage {
  id: string
  role: 'assistant' | 'user'
  content: string
  response?: ChatResponse
  isWelcome?: boolean
  locale?: Locale
}
import type { Locale } from '../../../shared/i18n/messages'
