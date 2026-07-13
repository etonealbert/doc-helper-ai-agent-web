import { Icon } from '../../../shared/components/Icon'
import type { Classification } from '../model/types'
import styles from '../../../styles/ui.module.css'

interface EscalationNoticeProps {
  classification: Classification
  requiresHuman: boolean
}

export function EscalationNotice({
  classification,
  requiresHuman,
}: EscalationNoticeProps) {
  const isUrgent = classification === 'emergency_or_pain'
  if (!requiresHuman && !isUrgent) return null

  return (
    <div className={styles.escalationNotice} role="alert">
      <Icon name="warning" size={20} />
      <div>
        <strong>{isUrgent ? 'Professional help may be needed' : 'Human review recommended'}</strong>
        <p>
          {isUrgent
            ? 'This assistant cannot provide medical advice and has not contacted emergency services. For urgent or life-threatening situations, contact local emergency services or a qualified professional now.'
            : 'This assistant cannot provide medical advice. A callback or ticket is only confirmed when a successful action below explicitly says so.'}
        </p>
      </div>
    </div>
  )
}