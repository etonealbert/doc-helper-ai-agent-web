import { useEffect, useRef, useState } from 'react'
import { ApiError, getSafeErrorMessage } from '../../../shared/api/ApiError'
import { usePersistentSession } from '../../../shared/hooks/usePersistentSession'
import { sendChat } from '../api/chatApi'
import type { ConversationMessage } from '../model/types'

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

export function useChat() {
  const [messages, setMessages] = useState<ConversationMessage[]>([
    welcomeMessage,
  ])
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<ChatErrorState | null>(null)
  const activeRequest = useRef<AbortController | null>(null)
  const pendingRequest = useRef(false)
  const { sessionId, userId, resetSession } = usePersistentSession()

  useEffect(() => () => activeRequest.current?.abort(), [])

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
    setIsPending(true)

    const controller = new AbortController()
    activeRequest.current = controller

    try {
      const response = await sendChat({
        message,
        userId,
        sessionId,
        signal: controller.signal,
      })
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: response.message,
          response,
        },
      ])
      return true
    } catch (cause) {
      if (!controller.signal.aborted) {
        setError({
          message: getSafeErrorMessage(cause),
          traceId: cause instanceof ApiError ? cause.traceId : undefined,
          failedMessage: message,
        })
      }
      return false
    } finally {
      if (activeRequest.current === controller) {
        activeRequest.current = null
        pendingRequest.current = false
        setIsPending(false)
      }
    }
  }

  const submit = (message: string) => execute(message, true)

  const clear = () => {
    activeRequest.current?.abort()
    activeRequest.current = null
    pendingRequest.current = false
    setMessages([welcomeMessage])
    setError(null)
    setIsPending(false)
    resetSession()
  }

  return {
    messages,
    isPending,
    error,
    sessionId,
    submit,
    clear,
    retry: () =>
      error ? execute(error.failedMessage, false) : Promise.resolve(false),
  }
}