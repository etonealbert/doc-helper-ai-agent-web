const DEFAULT_API_BASE_URL = 'https://api.albertlukmanovlabs.lol'
const DEFAULT_REPOSITORY_URL =
  'https://github.com/etonealbert/doc-helper-ai-agent-web'

function normalizeUrl(value: string): string {
  const candidate = value.trim().replace(/\/+$/, '')

  try {
    const url = new URL(candidate)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw new Error('Only HTTP and HTTPS URLs are supported.')
    }
    return url.toString().replace(/\/$/, '')
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`Invalid VITE_API_BASE_URL: ${reason}`)
  }
}

export const appConfig = {
  apiBaseUrl: normalizeUrl(
    import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL,
  ),
  appEnvironment: import.meta.env.VITE_APP_ENV || 'local',
  repositoryUrl:
    import.meta.env.VITE_GITHUB_REPOSITORY_URL || DEFAULT_REPOSITORY_URL,
  requestTimeoutMs: 25_000,
  messageMaxLength: 2_000,
} as const