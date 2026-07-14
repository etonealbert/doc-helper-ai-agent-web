import { useQuery } from '@tanstack/react-query'
import { fetchHealth } from '../api/healthApi'

export type HealthState = 'checking' | 'online' | 'degraded' | 'unavailable'

export function useHealth() {
  const query = useQuery({
    queryKey: ['health'],
    queryFn: ({ signal }) => fetchHealth(signal),
    refetchInterval: 45_000,
  })

  let status: HealthState = 'checking'
  if (query.isError) {
    status = 'unavailable'
  } else if (!query.isPending) {
    status = query.data.status.toLowerCase() === 'ok' ? 'online' : 'degraded'
  }

  return {
    health: query.data ?? null,
    status,
    refresh: query.refetch,
  }
}
