import { Icon } from '../../../shared/components/Icon'
import styles from '../../../styles/ui.module.css'

interface ChatErrorNoticeProps {
  message: string
  traceId?: string
  onRetry: () => void
}

export function ChatErrorNotice({
  message,
  traceId,
  onRetry,
}: ChatErrorNoticeProps) {
  return (
    <div className={styles.chatError} role="alert">
      <div className={styles.chatErrorIcon}>
        <Icon name="warning" size={18} />
      </div>
      <div>
        <strong>Request not completed</strong>
        <p>{message}</p>
        {traceId && <code>Trace: {traceId}</code>}
      </div>
      <button type="button" onClick={onRetry}>
        <Icon name="refresh" size={15} />
        Retry
      </button>
    </div>
  )
}
