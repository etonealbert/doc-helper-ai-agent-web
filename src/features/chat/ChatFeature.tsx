import { useEffect, useRef, useState } from 'react'
import { appConfig } from '../../app/config'
import { Icon } from '../../shared/components/Icon'
import { KnowledgeBaseSummary } from '../documents/components/KnowledgeBaseSummary'
import { ChatComposer } from './components/ChatComposer'
import { ChatErrorNotice } from './components/ChatErrorNotice'
import { ChatMessage } from './components/ChatMessage'
import { useChat } from './hooks/useChat'
import styles from '../../styles/ui.module.css'

const starterPrompts = [
  { label: 'What are your opening hours?', type: 'General' },
  { label: 'How much does teeth whitening cost?', type: 'Pricing' },
  {
    label: 'I want to book a whitening appointment next Friday.',
    type: 'Appointment',
  },
  { label: 'What is your cancellation policy?', type: 'Policy' },
  {
    label: 'I have severe pain and swelling. What should I do?',
    type: 'Safety demo',
    safety: true,
  },
] as const

export function ChatFeature() {
  const { messages, isPending, error, sessionId, submit, clear, retry } =
    useChat()
  const [draft, setDraft] = useState('')
  const viewportRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const stickToBottom = useRef(true)

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
        <header className={styles.chatHeader}>
          <div>
            <div className={styles.chatTitleLine}>
              <span className={styles.liveDot} aria-hidden="true" />
              <h1 id="chat-title">Agent workspace</h1>
            </div>
            <p>Document-grounded conversation and workflow trace</p>
          </div>
          <button
            className={styles.clearButton}
            type="button"
            onClick={clearConversation}
            disabled={messages.length === 1 && !error && !draft}
          >
            <Icon name="trash" size={16} />
            <span>Clear</span>
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

      <aside className={styles.sideRail} aria-label="Demonstration context">
        <section className={styles.railSection} aria-labelledby="prompts-title">
          <div className={styles.railHeading}>
            <span className={styles.railIcon}>
              <Icon name="arrow" size={17} />
            </span>
            <div>
              <p className={styles.eyebrow}>Try a route</p>
              <h2 id="prompts-title">Starter prompts</h2>
            </div>
          </div>
          <div className={styles.promptList}>
            {starterPrompts.map((prompt) => (
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

        <KnowledgeBaseSummary />

        <section className={styles.railSection} aria-labelledby="session-title">
          <div className={styles.railHeading}>
            <span className={styles.railIcon}>
              <Icon name="shield" size={17} />
            </span>
            <div>
              <p className={styles.eyebrow}>Privacy</p>
              <h2 id="session-title">Ephemeral session</h2>
            </div>
          </div>
          <p className={styles.sessionCopy}>
            Messages stay in this tab and are not saved by the interface. Only a
            pseudonymous session identifier is stored locally.
          </p>
          <div className={styles.sessionId}>
            <span>Session</span>
            <code title={sessionId}>{sessionId.slice(0, 18)}...</code>
          </div>
        </section>
      </aside>
    </div>
  )
}