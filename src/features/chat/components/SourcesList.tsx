import { Icon } from '../../../shared/components/Icon'
import styles from '../../../styles/ui.module.css'

export function SourcesList({ sources }: { sources: string[] }) {
  if (!sources.length) return null

  return (
    <div className={styles.sources} aria-label="Answer sources">
      <span className={styles.metaLabel}>Sources</span>
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
