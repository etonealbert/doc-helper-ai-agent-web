import { humanizeIdentifier } from '../../../shared/lib/format'
import type { Classification } from '../model/types'
import styles from '../../../styles/ui.module.css'

export function ClassificationBadge({
  classification,
}: {
  classification: Classification
}) {
  return (
    <span
      className={`${styles.classificationBadge} ${styles[`classification_${classification}`]}`}
    >
      <span aria-hidden="true" />
      {humanizeIdentifier(classification)}
    </span>
  )
}
