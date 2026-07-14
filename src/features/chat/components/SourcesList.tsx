import { Icon } from '../../../shared/components/Icon'
import { useLocalization } from '../../../shared/i18n/localizationContext'
import styles from '../../../styles/ui.module.css'

export function SourcesList({ sources }: { sources: string[] }) {
  const { messages } = useLocalization()
  if (!sources.length) return null

  return (
    <div className={styles.sources} aria-label={messages.chat.answerSources}>
      <span className={styles.metaLabel}>{messages.chat.sources}</span>
      <ul>
        {sources.map((source) => (
          <li key={source}>
            <Icon name="document" size={13} />
            {source}
          </li>
        ))}
      </ul>
    </div>
  )
}
