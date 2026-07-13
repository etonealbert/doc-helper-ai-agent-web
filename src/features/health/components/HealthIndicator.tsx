import { Icon } from '../../../shared/components/Icon'
import type { HealthResponse } from '../api/healthApi'
import type { HealthState } from '../hooks/useHealth'
import styles from '../../../styles/ui.module.css'

const labels: Record<HealthState, string> = {
  checking: 'Checking API',
  online: 'API online',
  degraded: 'API degraded',
  unavailable: 'API unavailable',
}

interface HealthIndicatorProps {
  health: HealthResponse | null
  status: HealthState
  onRefresh: () => void
}

export function HealthIndicator({
  health,
  status,
  onRefresh,
}: HealthIndicatorProps) {
  return (
    <button
      className={`${styles.healthIndicator} ${styles[`health_${status}`]}`}
      type="button"
      onClick={onRefresh}
      aria-label={`${labels[status]}. Check again.`}
      title={health ? `${health.service} v${health.version}` : labels[status]}
    >
      <span className={styles.healthDot} aria-hidden="true" />
      <span>{labels[status]}</span>
      <Icon name="refresh" size={14} />
    </button>
  )
}