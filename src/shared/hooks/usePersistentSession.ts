import { useState } from 'react'

const SESSION_STORAGE_KEY = 'doc-helper-session-id'

function createId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`
}

function readOrCreateSession(): string {
  try {
    const stored = localStorage.getItem(SESSION_STORAGE_KEY)
    if (stored) return stored
    const created = createId('session')
    localStorage.setItem(SESSION_STORAGE_KEY, created)
    return created
  } catch {
    return createId('session')
  }
}

export function usePersistentSession() {
  const [sessionId, setSessionId] = useState(readOrCreateSession)
  const [userId] = useState(() => createId('web-user'))

  const resetSession = () => {
    const nextSession = createId('session')
    setSessionId(nextSession)
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, nextSession)
    } catch {
      // The in-memory session remains usable when storage is unavailable.
    }
  }

  return { sessionId, userId, resetSession }
}