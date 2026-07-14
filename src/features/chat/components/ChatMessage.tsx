import { Icon } from '../../../shared/components/Icon'
import { useLocalization } from '../../../shared/i18n/localizationContext'
import type { ConversationMessage } from '../model/types'
import { ClassificationBadge } from './ClassificationBadge'
import { EscalationNotice } from './EscalationNotice'
import { SourcesList } from './SourcesList'
import { ToolActionCard } from './ToolActionCard'
import { TraceId } from './TraceId'
import styles from '../../../styles/ui.module.css'

export function ChatMessage({ message }: { message: ConversationMessage }) {
  const { messages } = useLocalization()
  const isUser = message.role === 'user'
  const response = message.response

  return (
    <article
      className={`${styles.messageRow} ${isUser ? styles.messageUser : styles.messageAssistant}`}
      aria-label={
        isUser
          ? messages.chat.userMessageLabel
          : messages.chat.assistantMessageLabel
      }
    >
      <div className={styles.avatar} aria-hidden="true">
        {isUser ? (
          messages.chat.you.slice(0, 1)
        ) : (
          <Icon name="sparkles" size={16} />
        )}
      </div>
      <div className={styles.messageStack}>
        <span className={styles.speakerLabel}>
          {isUser ? messages.chat.you : 'Doc Helper'}
        </span>
        <div
          className={`${styles.messageBubble} ${message.isWelcome ? styles.welcomeBubble : ''}`}
        >
          <p
            className={styles.messageText}
            lang={isUser ? undefined : message.locale}
          >
            {message.content}
          </p>

          {response && (
            <div className={styles.responseDetails}>
              <ClassificationBadge classification={response.classification} />
              <EscalationNotice
                classification={response.classification}
                requiresHuman={response.requiresHuman}
              />

              {response.actions.length > 0 && (
                <div className={styles.actionsList}>
                  <span className={styles.metaLabel}>
                    {messages.chat.agentActions}
                  </span>
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
