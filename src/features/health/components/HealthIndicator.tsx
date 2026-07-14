import { Icon } from '../../../shared/components/Icon'
import { useLocalization } from '../../../shared/i18n/localizationContext'
import type { HealthResponse } from '../api/healthApi'
import type { HealthState } from '../hooks/useHealth'
import styles from '../../../styles/ui.module.css'

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
  const { messages } = useLocalization()
  const labels: Record<HealthState, string> = messages.health

  return (
    <button
      className={`${styles.healthIndicator} ${styles[`health_${status}`]}`}
      type="button"
      onClick={onRefresh}
      aria-label={`${labels[status]}. ${messages.health.checkAgain}.`}
      title={health ? `${health.service} v${health.version}` : labels[status]}
    >
      <span className={styles.healthDot} aria-hidden="true" />
      <span>{labels[status]}</span>
      <Icon name="refresh" size={14} />
    </button>
  )
}
