import { Icon } from '../../../shared/components/Icon'
import { useLocalization } from '../../../shared/i18n/localizationContext'
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
  const { messages } = useLocalization()

  return (
    <div className={styles.chatError} role="alert">
      <div className={styles.chatErrorIcon}>
        <Icon name="warning" size={18} />
      </div>
      <div>
        <strong>{messages.chat.requestNotCompleted}</strong>
        <p>{message}</p>
        {traceId && (
          <code>
            {messages.chat.trace}: {traceId}
          </code>
        )}
      </div>
      <button type="button" onClick={onRetry}>
        <Icon name="refresh" size={15} />
        {messages.chat.retry}
      </button>
    </div>
  )
}
