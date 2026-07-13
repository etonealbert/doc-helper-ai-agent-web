import { Icon } from '../../../shared/components/Icon'
import type { ConversationMessage } from '../model/types'
import { ClassificationBadge } from './ClassificationBadge'
import { EscalationNotice } from './EscalationNotice'
import { SourcesList } from './SourcesList'
import { ToolActionCard } from './ToolActionCard'
import { TraceId } from './TraceId'
import styles from '../../../styles/ui.module.css'

export function ChatMessage({ message }: { message: ConversationMessage }) {
  const isUser = message.role === 'user'
  const response = message.response

  return (
    <article
      className={`${styles.messageRow} ${isUser ? styles.messageUser : styles.messageAssistant}`}
      aria-label={`${isUser ? 'You' : 'Assistant'} message`}
    >
      <div className={styles.avatar} aria-hidden="true">
        {isUser ? 'Y' : <Icon name="sparkles" size={16} />}
      </div>
      <div className={styles.messageStack}>
        <span className={styles.speakerLabel}>
          {isUser ? 'You' : 'Doc Helper'}
        </span>
        <div
          className={`${styles.messageBubble} ${message.isWelcome ? styles.welcomeBubble : ''}`}
        >
          <p className={styles.messageText}>{message.content}</p>

          {response && (
            <div className={styles.responseDetails}>
              <ClassificationBadge classification={response.classification} />
              <EscalationNotice
                classification={response.classification}
                requiresHuman={response.requiresHuman}
              />

              {response.actions.length > 0 && (
                <div className={styles.actionsList}>
                  <span className={styles.metaLabel}>Agent actions</span>
                  {response.actions.map((action, index) => (
                    <ToolActionCard
                      action={action}
                      key={`${action.tool}-${index}`}
                    />
                  ))}
                </div>
              )}

              <div className={styles.responseFooter}>
                <SourcesList sources={response.sources} />
                <TraceId traceId={response.traceId} />
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}