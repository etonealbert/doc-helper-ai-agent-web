import { useCallback, useEffect, useState } from 'react'
import {
  fetchDocuments,
  type DocumentsResponse,
} from '../api/documentsApi'

export function useDocuments() {
  const [data, setData] = useState<DocumentsResponse | null>(null)
  const [error, setError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const load = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true)
    setError(false)
    try {
      setData(await fetchDocuments(signal))
    } catch {
      if (!signal?.aborted) setError(true)
    } finally {
      if (!signal?.aborted) setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    void load(controller.signal)
    return () => controller.abort()
  }, [load])

  return { data, error, isLoading, retry: load }
}