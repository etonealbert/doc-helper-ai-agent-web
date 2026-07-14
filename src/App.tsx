import { appConfig } from './app/config'
import { ChatFeature } from './features/chat/ChatFeature'
import { KnowledgeBaseSummary } from './features/documents/components/KnowledgeBaseSummary'
import { HealthIndicator } from './features/health/components/HealthIndicator'
import { useHealth } from './features/health/hooks/useHealth'
import { Icon } from './shared/components/Icon'
import { LanguageSwitcher } from './shared/components/LanguageSwitcher'
import { useLocalization } from './shared/i18n/localizationContext'
import styles from './styles/ui.module.css'

function App() {
  const { health, status, refresh } = useHealth()
  const { messages } = useLocalization()

  return (
    <div className={styles.appShell}>
      <header className={styles.topBar}>
        <div className={styles.topBarInner}>
          <a
            className={styles.brand}
            href="#main-content"
            aria-label={messages.app.homeLabel}
          >
            <span className={styles.brandMark}>
              <Icon name="document" size={22} />
              <span aria-hidden="true" />
            </span>
            <span className={styles.brandText}>
              <strong>Doc Helper AI Agent</strong>
              <small>{messages.app.workflowDemo}</small>
            </span>
          </a>
          <div className={styles.headerActions}>
            <span className={styles.demoPill}>
              {messages.app.portfolioDemo}
            </span>
            <LanguageSwitcher />
            <HealthIndicator
              health={health}
              status={status}
              onRefresh={() => void refresh()}
            />
            {appConfig.repositoryUrl && (
              <a
                className={styles.repositoryLink}
                href={appConfig.repositoryUrl}
                target="_blank"
                rel="noreferrer"
                aria-label={messages.app.openRepository}
                title={messages.app.repositoryTitle}
              >
                <Icon name="github" size={18} />
                <span>{messages.app.source}</span>
                <Icon name="external" size={13} />
              </a>
            )}
          </div>
        </div>
      </header>

      <main className={styles.mainContent} id="main-content">
        <section
          className={styles.disclaimer}
          aria-label={messages.app.disclaimerLabel}
        >
          <span className={styles.disclaimerIcon}>
            <Icon name="shield" size={18} />
          </span>
          <p>
            <strong>{messages.app.disclaimerLead}</strong>{' '}
            {messages.app.disclaimerBody}
          </p>
        </section>
        <ChatFeature knowledgeBaseSummary={<KnowledgeBaseSummary />} />
      </main>

      <footer className={styles.footer}>
        <p>{messages.app.footer}</p>
        <span>
          API <code>{appConfig.apiBaseUrl.replace('https://', '')}</code>
        </span>
      </footer>
    </div>
  )
}

export default App
