import { Icon } from '../../../shared/components/Icon'
import {
  formatStructuredData,
  humanizeIdentifier,
} from '../../../shared/lib/format'
import type { ToolAction } from '../model/types'
import styles from '../../../styles/ui.module.css'

export function ToolActionCard({ action }: { action: ToolAction }) {
  const formattedResult = formatStructuredData(action.result)
  const succeeded = action.status.toLowerCase() === 'success'

  return (
    <details className={styles.toolAction}>
      <summary>
        <span
          className={`${styles.toolStatusIcon} ${succeeded ? styles.toolSuccess : styles.toolNeutral}`}
        >
          <Icon name={succeeded ? 'check' : 'activity'} size={14} />
        </span>
        <span className={styles.toolName}>
          {humanizeIdentifier(action.tool)}
        </span>
        <span className={styles.toolStatus}>
          {humanizeIdentifier(action.status)}
        </span>
        <Icon className={styles.disclosureIcon} name="chevron" size={15} />
      </summary>
      <div className={styles.toolResult}>
        <p>Safe result preview</p>
        <pre>{formattedResult}</pre>
      </div>
    </details>
  )
}