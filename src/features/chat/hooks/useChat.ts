import { useMutation } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { ApiError, getSafeErrorMessage } from '../../../shared/api/ApiError'
import { usePersistentSession } from '../../../shared/hooks/usePersistentSession'
import { sendChat } from '../api/chatApi'
import type { ChatResponse, ConversationMessage } from '../model/types'

const welcomeMessage: ConversationMessage = {
  id: 'welcome',
  role: 'assistant',
  isWelcome: true,
  content:
    'Hello. I can answer questions from the demonstration knowledge base, explain pricing and policies, or show how appointment and escalation workflows are routed.',
}

interface ChatErrorState {
  message: string
  traceId?: string
  failedMessage: string
}

interface ChatOperation {
  message: string
  userId: string
  sessionId: string
  controller: AbortController
}

interface ChatOperationResponse {
  operation: ChatOperation
  response: ChatResponse
}

interface ChatOperationFailure {
  operation: ChatOperation
  cause: unknown
}

function readOperationValue<T>(operationRef: { current: T | null }) {
  return operationRef.current
}

export function useChat() {
  const [messages, setMessages] = useState<ConversationMessage[]>([
    welcomeMessage,
  ])
  const [error, setError] = useState<ChatErrorState | null>(null)
  const activeRequest = useRef<ChatOperation | null>(null)
  const activeResponse = useRef<ChatOperationResponse | null>(null)
  const activeFailure = useRef<ChatOperationFailure | null>(null)
  const pendingRequest = useRef(false)
  const { sessionId, userId, resetSession } = usePersistentSession()
  const mutation = useMutation({
    mutationFn: async () => {
      const operation = activeRequest.current
      if (!operation) return

      try {
        const response = await sendChat({
          message: operation.message,
          userId: operation.userId,
          sessionId: operation.sessionId,
          signal: operation.controller.signal,
        })
        if (
          activeRequest.current === operation &&
          !operation.controller.signal.aborted
        ) {
          activeResponse.current = { operation, response }
        }
      } catch (cause) {
        if (activeRequest.current === operation) {
          activeFailure.current = { operation, cause }
        }
      }
    },
    retry: false,
    gcTime: 0,
  })
  const resetMutation = mutation.reset

  useEffect(
    () => () => {
      activeRequest.current?.controller.abort()
      activeRequest.current = null
      activeResponse.current = null
      activeFailure.current = null
      pendingRequest.current = false
      resetMutation()
    },
    [resetMutation],
  )

  const execute = async (rawMessage: string, appendUserMessage: boolean) => {
    const message = rawMessage.trim()
    if (!message || pendingRequest.current) return false

    if (appendUserMessage) {
      const userMessage: ConversationMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: message,
      }
      setMessages((current) => [...current, userMessage])
    }
    setError(null)
    pendingRequest.current = true

    const operation: ChatOperation = {
      message,
      userId,
      sessionId,
      controller: new AbortController(),
    }
    activeRequest.current = operation
    activeResponse.current = null
    activeFailure.current = null

    try {
      await mutation.mutateAsync()
      const failed = readOperationValue(activeFailure)
      if (failed?.operation === operation) throw failed.cause

      const completed = readOperationValue(activeResponse)
      if (
        completed?.operation !== operation ||
        operation.controller.signal.aborted
      ) {
        return false
      }
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: completed.response.message,
          response: completed.response,
        },
      ])
      return true
    } catch (cause) {
      if (!operation.controller.signal.aborted) {
        setError({
          message: getSafeErrorMessage(cause),
          traceId: cause instanceof ApiError ? cause.traceId : undefined,
          failedMessage: message,
        })
      }
      return false
    } finally {
      if (activeRequest.current === operation) {
        activeRequest.current = null
        activeResponse.current = null
        activeFailure.current = null
        pendingRequest.current = false
        resetMutation()
      }
    }
  }

  const submit = (message: string) => execute(message, true)

  const clear = () => {
    activeRequest.current?.controller.abort()
    activeRequest.current = null
    activeResponse.current = null
    activeFailure.current = null
    pendingRequest.current = false
    setMessages([welcomeMessage])
    setError(null)
    resetMutation()
    resetSession()
  }

  return {
    messages,
    isPending: mutation.isPending,
    error,
    sessionId,
    submit,
    clear,
    retry: () =>
      error ? execute(error.failedMessage, false) : Promise.resolve(false),
  }
}
