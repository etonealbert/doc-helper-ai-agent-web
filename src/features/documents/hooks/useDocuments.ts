import { useQuery } from '@tanstack/react-query'
import { fetchDocuments } from '../api/documentsApi'

export function useDocuments() {
  const query = useQuery({
    queryKey: ['documents'],
    queryFn: ({ signal }) => fetchDocuments(signal),
  })

  return {
    data: query.data ?? null,
    error: query.isError,
    isLoading: query.isPending,
    retry: query.refetch,
  }
}
