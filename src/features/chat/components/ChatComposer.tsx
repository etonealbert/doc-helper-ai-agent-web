import { useEffect, type KeyboardEvent, type RefObject } from 'react'
import { Icon } from '../../../shared/components/Icon'
import styles from '../../../styles/ui.module.css'

interface ChatComposerProps {
  value: string
  isPending: boolean
  maxLength: number
  inputRef: RefObject<HTMLTextAreaElement | null>
  onChange: (value: string) => void
  onSubmit: () => void
}

export function ChatComposer({
  value,
  isPending,
  maxLength,
  inputRef,
  onChange,
  onSubmit,
}: ChatComposerProps) {
  useEffect(() => {
    const input = inputRef.current
    if (!input) return
    input.style.height = 'auto'
    input.style.height = `${Math.min(input.scrollHeight, 144)}px`
  }, [inputRef, value])

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      event.key === 'Enter' &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault()
      onSubmit()
    }
  }

  const remaining = maxLength - value.length

  return (
    <form
      className={styles.composer}
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit()
      }}
    >
      <label className={styles.visuallyHidden} htmlFor="chat-message">
        Message the Doc Helper AI Agent
      </label>
      <div className={styles.composerFrame}>
        <textarea
          id="chat-message"
          ref={inputRef}
          value={value}
          rows={1}
          maxLength={maxLength}
          disabled={isPending}
          placeholder="Ask about services, pricing, policies, or scheduling..."
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
        />
        <div className={styles.composerFooter}>
          <span className={styles.composerHint}>
            Demo only. Do not enter personal or patient data.
          </span>
          <div className={styles.composerControls}>
            <span
              className={`${styles.characterCount} ${remaining < 120 ? styles.characterCountLow : ''}`}
              aria-label={`${remaining} characters remaining`}
            >
              {value.length}/{maxLength}
            </span>
            <button
              className={styles.sendButton}
              type="submit"
              disabled={isPending || !value.trim()}
            >
              <span>{isPending ? 'Working' : 'Send'}</span>
              <Icon name="send" size={17} />
            </button>
          </div>
        </div>
      </div>
      <span className={styles.visuallyHidden} role="status" aria-live="polite">
        {isPending ? 'The assistant is preparing a response.' : ''}
      </span>
    </form>
  )
}