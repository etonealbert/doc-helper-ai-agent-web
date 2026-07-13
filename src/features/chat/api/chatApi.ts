import { apiRequest } from '../../../shared/api/request'
import {
  expectArray,
  expectBoolean,
  expectRecord,
  expectString,
} from '../../../shared/api/validation'
import {
  classifications,
  type ChatResponse,
  type Classification,
  type ToolAction,
} from '../model/types'

interface ChatRequest {
  message: string
  userId: string
  sessionId: string
  signal?: AbortSignal
}

function validateClassification(value: unknown): Classification {
  const classification = expectString(value, 'Classification')
  if (!classifications.includes(classification as Classification)) {
    throw new TypeError('Classification is not supported.')
  }
  return classification as Classification
}

function validateAction(value: unknown, index: number): ToolAction {
  const action = expectRecord(value, `Action ${index + 1}`)
  return {
    tool: expectString(action.tool, `Action ${index + 1} tool`),
    status: expectString(action.status, `Action ${index + 1} status`),
    result: action.result ?? null,
  }
}

function validateChatResponse(value: unknown): ChatResponse {
  const record = expectRecord(value, 'Chat response')
  return {
    message: expectString(record.message, 'Chat message'),
    classification: validateClassification(record.classification),
    actions: expectArray(record.actions, 'Chat actions').map(validateAction),
    requiresHuman: expectBoolean(
      record.requires_human,
      'Human escalation state',
    ),
    sources: expectArray(record.sources, 'Chat sources').map((source, index) =>
      expectString(source, `Source ${index + 1}`),
    ),
    traceId: expectString(record.trace_id, 'Trace ID'),
  }
}

export function sendChat({
  message,
  userId,
  sessionId,
  signal,
}: ChatRequest): Promise<ChatResponse> {
  return apiRequest('/api/chat', validateChatResponse, {
    method: 'POST',
    body: JSON.stringify({
      message,
      user_id: userId,
      session_id: sessionId,
    }),
    signal,
  })
}