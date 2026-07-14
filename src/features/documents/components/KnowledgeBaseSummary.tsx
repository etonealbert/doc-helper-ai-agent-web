import { Icon } from '../../../shared/components/Icon'
import { useLocalization } from '../../../shared/i18n/localizationContext'
import { useDocuments } from '../hooks/useDocuments'
import styles from '../../../styles/ui.module.css'

export function KnowledgeBaseSummary() {
  const { data, error, isLoading, retry } = useDocuments()
  const { locale, messages } = useLocalization()
  const numberFormat = new Intl.NumberFormat(locale)

  return (
    <section className={styles.railSection} aria-labelledby="knowledge-title">
      <div className={styles.railHeading}>
        <span className={styles.railIcon}>
          <Icon name="database" size={17} />
        </span>
        <div>
          <p className={styles.eyebrow}>{messages.documents.grounding}</p>
          <h2 id="knowledge-title">{messages.documents.knowledgeBase}</h2>
        </div>
      </div>

      {isLoading && (
        <div className={styles.skeletonGroup} aria-live="polite">
          <span>{messages.documents.loading}</span>
          <div className={styles.skeleton} />
          <div className={styles.skeletonShort} />
        </div>
      )}

      {error && !isLoading && (
        <div className={styles.inlineError} role="status">
          <p>{messages.documents.unavailable}</p>
          <button type="button" onClick={() => void retry()}>
            <Icon name="refresh" size={15} />
            {messages.documents.retry}
          </button>
        </div>
      )}

      {data && !isLoading && (
        <>
          <div className={styles.knowledgeStats}>
            <div>
              <strong>{numberFormat.format(data.totalDocuments)}</strong>
              <span>
                {messages.documents.documentCountLabel(data.totalDocuments)}
              </span>
            </div>
            <div>
              <strong>{numberFormat.format(data.totalChunks)}</strong>
              <span>
                {messages.documents.chunkCountLabel(data.totalChunks)}
              </span>
            </div>
          </div>
          <ul className={styles.documentList}>
            {data.documents.map((document) => (
              <li key={document.source}>
                <Icon name="document" size={15} />
                <span title={document.source}>{document.source}</span>
                <small>{numberFormat.format(document.chunks)}</small>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
