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

export interface ToolAction {
  tool: string
  status: string
  result: unknown
}

export interface ChatResponse {
  message: string
  classification: Classification
  actions: ToolAction[]
  requiresHuman: boolean
  sources: string[]
  traceId: string
}

export interface ConversationMessage {
  id: string
  role: 'assistant' | 'user'
  content: string
  response?: ChatResponse
  isWelcome?: boolean
}