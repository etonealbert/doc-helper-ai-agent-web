import { Icon } from '../../../shared/components/Icon'
import { useDocuments } from '../hooks/useDocuments'
import styles from '../../../styles/ui.module.css'

export function KnowledgeBaseSummary() {
  const { data, error, isLoading, retry } = useDocuments()

  return (
    <section className={styles.railSection} aria-labelledby="knowledge-title">
      <div className={styles.railHeading}>
        <span className={styles.railIcon}>
          <Icon name="database" size={17} />
        </span>
        <div>
          <p className={styles.eyebrow}>Grounding</p>
          <h2 id="knowledge-title">Knowledge base</h2>
        </div>
      </div>

      {isLoading && (
        <div className={styles.skeletonGroup} aria-live="polite">
          <span>Loading documents</span>
          <div className={styles.skeleton} />
          <div className={styles.skeletonShort} />
        </div>
      )}

      {error && !isLoading && (
        <div className={styles.inlineError} role="status">
          <p>Document metadata is unavailable.</p>
          <button type="button" onClick={() => void retry()}>
            <Icon name="refresh" size={15} />
            Retry
          </button>
        </div>
      )}

      {data && !isLoading && (
        <>
          <div className={styles.knowledgeStats}>
            <div>
              <strong>{data.totalDocuments}</strong>
              <span>documents</span>
            </div>
            <div>
              <strong>{data.totalChunks}</strong>
              <span>searchable chunks</span>
            </div>
          </div>
          <ul className={styles.documentList}>
            {data.documents.map((document) => (
              <li key={document.source}>
                <Icon name="document" size={15} />
                <span title={document.source}>{document.source}</span>
                <small>{document.chunks}</small>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
