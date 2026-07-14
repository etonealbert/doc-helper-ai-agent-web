import { Icon } from '../../../shared/components/Icon'
import { useLocalization } from '../../../shared/i18n/localizationContext'
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
  const { messages } = useLocalization()
  const isUrgent = classification === 'emergency_or_pain'
  if (!requiresHuman && !isUrgent) return null

  return (
    <div className={styles.escalationNotice} role="alert">
      <Icon name="warning" size={20} />
      <div>
        <strong>
          {isUrgent ? messages.chat.urgentTitle : messages.chat.reviewTitle}
        </strong>
        <p>{isUrgent ? messages.chat.urgentBody : messages.chat.reviewBody}</p>
      </div>
    </div>
  )
}
