import { useLocalization } from '../../../shared/i18n/localizationContext'
import type { Classification } from '../model/types'
import styles from '../../../styles/ui.module.css'

export function ClassificationBadge({
  classification,
}: {
  classification: Classification
}) {
  const { messages } = useLocalization()

  return (
    <span
      className={`${styles.classificationBadge} ${styles[`classification_${classification}`]}`}
    >
      <span aria-hidden="true" />
      {messages.chat.classifications[classification]}
    </span>
  )
}
