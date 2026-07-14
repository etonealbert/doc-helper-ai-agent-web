import { useState } from 'react'
import { Icon } from '../../../shared/components/Icon'
import { useLocalization } from '../../../shared/i18n/localizationContext'
import { compactTraceId } from '../../../shared/lib/format'
import styles from '../../../styles/ui.module.css'

export function TraceId({ traceId }: { traceId: string }) {
  const { messages } = useLocalization()
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(traceId)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1_800)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className={styles.trace}>
      <span className={styles.metaLabel}>{messages.chat.trace}</span>
      <code title={traceId}>{compactTraceId(traceId)}</code>
      <button
        type="button"
        onClick={() => void copy()}
        aria-label={
          copied ? messages.chat.traceCopied : messages.chat.copyTrace
        }
      >
        <Icon name={copied ? 'check' : 'copy'} size={14} />
      </button>
      <span className={styles.visuallyHidden} aria-live="polite">
        {copied ? messages.chat.traceCopiedAnnouncement : ''}
      </span>
    </div>
  )
}
