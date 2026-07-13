import { useCallback, useEffect, useState } from 'react'
import { fetchHealth, type HealthResponse } from '../api/healthApi'

export type HealthState = 'checking' | 'online' | 'degraded' | 'unavailable'

export function useHealth() {
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [status, setStatus] = useState<HealthState>('checking')

  const checkHealth = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetchHealth(signal)
      setHealth(response)
      setStatus(response.status.toLowerCase() === 'ok' ? 'online' : 'degraded')
    } catch {
      if (!signal?.aborted) setStatus('unavailable')
    }
  }, [])

  useEffect(() => {
    let controller = new AbortController()
    void checkHealth(controller.signal)

    const intervalId = window.setInterval(() => {
      controller.abort()
      controller = new AbortController()
      void checkHealth(controller.signal)
    }, 45_000)

    return () => {
      controller.abort()
      window.clearInterval(intervalId)
    }
  }, [checkHealth])

  return { health, status, refresh: checkHealth }
}