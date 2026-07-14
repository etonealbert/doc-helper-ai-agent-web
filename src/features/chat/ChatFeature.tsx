import { useEffect, useRef, useState, type ReactNode } from 'react'
import { appConfig } from '../../app/config'
import { Icon } from '../../shared/components/Icon'
import { useLocalization } from '../../shared/i18n/localizationContext'
import { ChatComposer } from './components/ChatComposer'
import { ChatErrorNotice } from './components/ChatErrorNotice'
import { ChatMessage } from './components/ChatMessage'
import { useChat } from './hooks/useChat'
import styles from '../../styles/ui.module.css'

interface ChatFeatureProps {
  knowledgeBaseSummary: ReactNode
}

export function ChatFeature({ knowledgeBaseSummary }: ChatFeatureProps) {
  const { messages: copy } = useLocalization()
  const { messages, isPending, error, sessionId, submit, clear, retry } =
    useChat()
  const [draft, setDraft] = useState('')
  const viewportRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const stickToBottom = useRef(true)
  const assistantAnnouncement =
    isPending || error
      ? undefined
      : messages.findLast(
          (message) => message.role === 'assistant' && !message.isWelcome,
        )

  useEffect(() => {
    if (!stickToBottom.current) return
    const viewport = viewportRef.current
    if (!viewport) return
    viewport.scrollTo({
      top: viewport.scrollHeight,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'auto'
        : 'smooth',
    })
  }, [messages, isPending, error])

  const submitDraft = () => {
    const message = draft.trim()
    if (!message || isPending) return
    stickToBottom.current = true
    setDraft('')
    void submit(message)
  }

  const selectPrompt = (prompt: string) => {
    setDraft(prompt)
    window.requestAnimationFrame(() => inputRef.current?.focus())
  }

  const clearConversation = () => {
    clear()
    setDraft('')
    stickToBottom.current = true
    window.requestAnimationFrame(() => inputRef.current?.focus())
  }

  return (
    <div className={styles.workspace}>
      <section className={styles.chatPanel} aria-labelledby="chat-title">
        <div
          className={styles.visuallyHidden}
          data-testid="assistant-announcement"
          aria-live="polite"
          aria-atomic="true"
          lang={assistantAnnouncement?.locale}
        >
          {assistantAnnouncement?.content ?? ''}
        </div>
        <header className={styles.chatHeader}>
          <div>
            <div className={styles.chatTitleLine}>
              <span className={styles.liveDot} aria-hidden="true" />
              <h1 id="chat-title">{copy.chat.title}</h1>
            </div>
            <p>{copy.chat.subtitle}</p>
          </div>
          <button
            className={styles.clearButton}
            type="button"
            onClick={clearConversation}
            disabled={messages.length === 1 && !error && !draft}
            aria-label={copy.chat.clearLabel}
          >
            <Icon name="trash" size={16} />
            <span>{copy.chat.clear}</span>
          </button>
        </header>

        <div
          className={styles.messageViewport}
          ref={viewportRef}
          onScroll={(event) => {
            const element = event.currentTarget
            stickToBottom.current =
              element.scrollHeight - element.scrollTop - element.clientHeight <
              96
          }}
        >
          <div className={styles.messageList}>
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}

            {isPending && (
              <div
                className={`${styles.messageRow} ${styles.messageAssistant}`}
                aria-hidden="true"
              >
                <div className={styles.avatar}>
                  <Icon name="sparkles" size={16} />
                </div>
                <div className={styles.messageStack}>
                  <span className={styles.speakerLabel}>Doc Helper</span>
                  <div className={styles.pendingBubble}>
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              </div>
            )}

            {error && (
              <ChatErrorNotice
                message={error.message}
                traceId={error.traceId}
                onRetry={() => void retry()}
              />
            )}
          </div>
        </div>

        <ChatComposer
          value={draft}
          isPending={isPending}
          maxLength={appConfig.messageMaxLength}
          inputRef={inputRef}
          onChange={setDraft}
          onSubmit={submitDraft}
        />
      </section>

      <aside className={styles.sideRail} aria-label={copy.chat.contextLabel}>
        <section className={styles.railSection} aria-labelledby="prompts-title">
          <div className={styles.railHeading}>
            <span className={styles.railIcon}>
              <Icon name="arrow" size={17} />
            </span>
            <div>
              <p className={styles.eyebrow}>{copy.chat.tryRoute}</p>
              <h2 id="prompts-title">{copy.chat.starterPromptsTitle}</h2>
            </div>
          </div>
          <div className={styles.promptList}>
            {copy.chat.starterPrompts.map((prompt) => (
              <button
                key={prompt.label}
                type="button"
                onClick={() => selectPrompt(prompt.label)}
              >
                <span>
                  <small className={prompt.safety ? styles.safetyLabel : ''}>
                    {prompt.type}
                  </small>
                  {prompt.label}
                </span>
                <Icon name="chevron" size={15} />
              </button>
            ))}
          </div>
        </section>

        {knowledgeBaseSummary}

        <section className={styles.railSection} aria-labelledby="session-title">
          <div className={styles.railHeading}>
            <span className={styles.railIcon}>
              <Icon name="shield" size={17} />
            </span>
            <div>
              <p className={styles.eyebrow}>{copy.chat.privacy}</p>
              <h2 id="session-title">{copy.chat.ephemeralSession}</h2>
            </div>
          </div>
          <p className={styles.sessionCopy}>{copy.chat.sessionCopy}</p>
          <div className={styles.sessionId}>
            <span>{copy.chat.session}</span>
            <code title={sessionId}>{sessionId.slice(0, 18)}...</code>
          </div>
        </section>
      </aside>
    </div>
  )
}
