import { appConfig } from './app/config'
import { ChatFeature } from './features/chat/ChatFeature'
import { KnowledgeBaseSummary } from './features/documents/components/KnowledgeBaseSummary'
import { HealthIndicator } from './features/health/components/HealthIndicator'
import { useHealth } from './features/health/hooks/useHealth'
import { Icon } from './shared/components/Icon'
import styles from './styles/ui.module.css'

function App() {
  const { health, status, refresh } = useHealth()

  return (
    <div className={styles.appShell}>
      <header className={styles.topBar}>
        <div className={styles.topBarInner}>
          <a
            className={styles.brand}
            href="#main-content"
            aria-label="Doc Helper AI Agent home"
          >
            <span className={styles.brandMark}>
              <Icon name="document" size={22} />
              <span aria-hidden="true" />
            </span>
            <span className={styles.brandText}>
              <strong>Doc Helper AI Agent</strong>
              <small>Workflow demonstration</small>
            </span>
          </a>
          <div className={styles.headerActions}>
            <span className={styles.demoPill}>Portfolio demo</span>
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
                aria-label="Open project repository"
                title="Project repository"
              >
                <Icon name="github" size={18} />
                <span>Source</span>
                <Icon name="external" size={13} />
              </a>
            )}
          </div>
        </div>
      </header>

      <main className={styles.mainContent} id="main-content">
        <section
          className={styles.disclaimer}
          aria-label="Demonstration disclaimer"
        >
          <span className={styles.disclaimerIcon}>
            <Icon name="shield" size={18} />
          </span>
          <p>
            <strong>Demonstration environment.</strong> No diagnosis or
            treatment is provided. Do not enter real patient data. For urgent or
            life-threatening situations, contact local emergency services or a
            qualified professional.
          </p>
        </section>
        <ChatFeature knowledgeBaseSummary={<KnowledgeBaseSummary />} />
      </main>

      <footer className={styles.footer}>
        <p>
          Doc Helper AI Agent is an engineering portfolio demonstration, not a
          medical service.
        </p>
        <span>
          API <code>{appConfig.apiBaseUrl.replace('https://', '')}</code>
        </span>
      </footer>
    </div>
  )
}

export default App
