import { useMutation } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ApiError, getSafeErrorMessage } from '../../../shared/api/ApiError'
import { usePersistentSession } from '../../../shared/hooks/usePersistentSession'
import { useLocalization } from '../../../shared/i18n/localizationContext'
import type { Locale } from '../../../shared/i18n/messages'
import { sendChat } from '../api/chatApi'
import type { ChatResponse, ConversationMessage } from '../model/types'

const welcomeMessage: ConversationMessage = {
  id: 'welcome',
  role: 'assistant',
  isWelcome: true,
  content: '',
}

interface ChatErrorState {
  cause: unknown
  traceId?: string
  failedMessage: string
  locale: Locale
}

interface ChatOperation {
  message: string
  userId: string
  sessionId: string
  locale: Locale
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
  const { locale, messages: copy } = useLocalization()
  const [messages, setMessages] = useState<ConversationMessage[]>([
    welcomeMessage,
  ])
  const [errorState, setErrorState] = useState<ChatErrorState | null>(null)
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
          locale: operation.locale,
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

  const execute = async (
    rawMessage: string,
    appendUserMessage: boolean,
    operationLocale: Locale,
  ) => {
    const message = rawMessage.trim()
    if (!message || pendingRequest.current) return false

    if (appendUserMessage) {
      const userMessage: ConversationMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: message,
        locale: operationLocale,
      }
      setMessages((current) => [...current, userMessage])
    }
    setErrorState(null)
    pendingRequest.current = true

    const operation: ChatOperation = {
      message,
      userId,
      sessionId,
      locale: operationLocale,
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
          locale: completed.response.locale,
        },
      ])
      return true
    } catch (cause) {
      if (!operation.controller.signal.aborted) {
        setErrorState({
          cause,
          traceId: cause instanceof ApiError ? cause.traceId : undefined,
          failedMessage: message,
          locale: operationLocale,
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

  const submit = (message: string) => execute(message, true, locale)

  const clear = () => {
    activeRequest.current?.controller.abort()
    activeRequest.current = null
    activeResponse.current = null
    activeFailure.current = null
    pendingRequest.current = false
    setMessages([welcomeMessage])
    setErrorState(null)
    resetMutation()
    resetSession()
  }

  const localizedMessages = useMemo(
    () =>
      messages.map((message) =>
        message.isWelcome
          ? { ...message, content: copy.chat.welcome, locale }
          : message,
      ),
    [copy.chat.welcome, locale, messages],
  )
  const error = errorState
    ? {
        message: getSafeErrorMessage(errorState.cause, locale),
        traceId: errorState.traceId,
      }
    : null

  return {
    messages: localizedMessages,
    isPending: mutation.isPending,
    error,
    sessionId,
    submit,
    clear,
    retry: () =>
      errorState
        ? execute(errorState.failedMessage, false, errorState.locale)
        : Promise.resolve(false),
  }
}
