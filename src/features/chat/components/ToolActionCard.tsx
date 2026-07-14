import { Icon } from '../../../shared/components/Icon'
import { useLocalization } from '../../../shared/i18n/localizationContext'
import { formatStructuredData } from '../../../shared/lib/format'
import type { ToolAction } from '../model/types'
import styles from '../../../styles/ui.module.css'

export function ToolActionCard({ action }: { action: ToolAction }) {
  const { messages } = useLocalization()
  const formattedResult = formatStructuredData(
    action.result,
    messages.chat.noResultDetails,
  )
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
          {messages.chat.tools[action.tool] ?? action.tool}
        </span>
        <span className={styles.toolStatus}>
          {messages.chat.toolStatuses[action.status]}
        </span>
        <Icon className={styles.disclosureIcon} name="chevron" size={15} />
      </summary>
      <div className={styles.toolResult}>
        <p>{messages.chat.safeResultPreview}</p>
        <pre>{formattedResult}</pre>
      </div>
    </details>
  )
}
