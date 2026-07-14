import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import App from './App'
import { AppProviders } from './app/providers'
import { spanishChatFixture } from './test/fixtures'
import { API_BASE } from './test/handlers'
import { server } from './test/server'

beforeAll(() => {
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }))
  Object.defineProperty(Element.prototype, 'scrollTo', {
    configurable: true,
    value: vi.fn(),
  })
})

function renderApp() {
  return render(
    <AppProviders>
      <App />
    </AppProviders>,
  )
}

describe('App localization', () => {
  it('starts fully in Spanish and switches to English without resetting the draft or session', async () => {
    const user = userEvent.setup()
    renderApp()

    expect(document.documentElement).toHaveAttribute('lang', 'es')
    expect(document.title).toBe('Doc Helper AI Agent | Demostración del flujo')
    expect(
      screen.getByRole('heading', {
        name: 'Espacio de trabajo del agente',
      }),
    ).toBeVisible()
    expect(screen.getByText('Base de conocimiento')).toBeVisible()
    expect(screen.getByText(/Hola\. Puedo responder preguntas/)).toBeVisible()
    expect(
      await screen.findByRole('button', { name: /API disponible/i }),
    ).toBeVisible()

    const composer = screen.getByRole('textbox', {
      name: 'Enviar un mensaje a Doc Helper AI Agent',
    })
    await user.type(composer, 'Borrador de demostración')
    const sessionId = localStorage.getItem('doc-helper-session-id')

    await user.click(
      screen.getByRole('button', {
        name: 'English',
      }),
    )

    expect(document.documentElement).toHaveAttribute('lang', 'en')
    expect(document.title).toBe('Doc Helper AI Agent | Workflow Demo')
    expect(
      screen.getByRole('heading', { name: 'Agent workspace' }),
    ).toBeVisible()
    expect(
      screen.getByRole('textbox', {
        name: 'Message the Doc Helper AI Agent',
      }),
    ).toHaveValue('Borrador de demostración')
    expect(screen.getByText(/Hello\. I can answer questions/)).toBeVisible()
    expect(localStorage).toHaveLength(1)
    expect(localStorage.getItem('doc-helper-session-id')).toBe(sessionId)
  })

  it('keeps the submission locale and Spanish answer when the interface changes while pending', async () => {
    const user = userEvent.setup()
    let requestBody: { locale?: string } | undefined
    let resolveStarted!: () => void
    let resolveResponse!: () => void
    const started = new Promise<void>((resolve) => {
      resolveStarted = resolve
    })
    const responseReady = new Promise<void>((resolve) => {
      resolveResponse = resolve
    })
    server.use(
      http.post(`${API_BASE}/api/chat`, async ({ request }) => {
        requestBody = (await request.json()) as { locale?: string }
        resolveStarted()
        await responseReady
        return HttpResponse.json(spanishChatFixture)
      }),
    )
    renderApp()

    await user.type(
      screen.getByRole('textbox', {
        name: 'Enviar un mensaje a Doc Helper AI Agent',
      }),
      '¿Cuánto cuesta el blanqueamiento dental?',
    )
    await user.click(screen.getByRole('button', { name: 'Enviar' }))
    await started

    await user.click(
      screen.getByRole('button', {
        name: 'English',
      }),
    )
    resolveResponse()

    const answer = await screen.findByText(spanishChatFixture.message, {
      selector: 'p',
    })
    expect(requestBody?.locale).toBe('es')
    expect(answer).toHaveAttribute('lang', 'es')
    expect(answer).toBeVisible()
    expect(screen.getByText('Pricing Question')).toBeVisible()
    expect(
      screen.getByRole('heading', { name: 'Agent workspace' }),
    ).toBeVisible()
  })
})
