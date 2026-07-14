import type { QueryClient } from '@tanstack/react-query'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { chatFixture } from '../../test/fixtures'
import { API_BASE } from '../../test/handlers'
import { renderWithProviders } from '../../test/render'
import { server } from '../../test/server'
import { LanguageSwitcher } from '../../shared/components/LanguageSwitcher'
import type { Locale } from '../../shared/i18n/messages'
import { ChatFeature } from './ChatFeature'

vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }))
Object.defineProperty(Element.prototype, 'scrollTo', {
  configurable: true,
  value: vi.fn(),
})

const knowledgeBaseSummary = <div>Knowledge test double</div>

function renderChat(locale: Locale = 'en') {
  return renderWithProviders(
    <ChatFeature knowledgeBaseSummary={knowledgeBaseSummary} />,
    undefined,
    locale,
  )
}

function renderChatWithSwitcher(locale: Locale) {
  return renderWithProviders(
    <>
      <LanguageSwitcher />
      <ChatFeature knowledgeBaseSummary={knowledgeBaseSummary} />
    </>,
    undefined,
    locale,
  )
}

function getComposer() {
  return screen.getByRole('textbox', { name: /message the doc helper/i })
}

function findMessageText(text: string) {
  return screen.findByText(text, { selector: 'p' })
}

interface MutationPrivacyState {
  variables: unknown
  data: unknown
  error: unknown
  failureReason: unknown
}

function observeMutationPrivacy(queryClient: QueryClient) {
  const observations: MutationPrivacyState[][] = []
  const capture = () => {
    observations.push(
      queryClient
        .getMutationCache()
        .getAll()
        .map(({ state }) => ({
          variables: state.variables,
          data: state.data,
          error: state.error,
          failureReason: state.failureReason,
        })),
    )
  }
  const unsubscribe = queryClient.getMutationCache().subscribe(capture)
  capture()

  return { observations, unsubscribe }
}

function serializeMutationPrivacy(observations: MutationPrivacyState[][]) {
  return JSON.stringify(observations, (_key, value: unknown) =>
    value instanceof Error
      ? { message: value.message, ...Object.fromEntries(Object.entries(value)) }
      : value,
  )
}

function expectNoMutationFailureState(observations: MutationPrivacyState[][]) {
  const states = observations.flat()
  expect(states.length).toBeGreaterThan(0)
  for (const state of states) {
    expect(state.variables).toBeUndefined()
    expect(state.data).toBeUndefined()
    expect(state.error).toBeNull()
    expect(state.failureReason).toBeNull()
  }
}

describe('ChatFeature', () => {
  it('does not scroll the transcript while editing the draft', async () => {
    const user = userEvent.setup()
    renderChat()
    const scrollTo = vi.mocked(Element.prototype.scrollTo)
    scrollTo.mockClear()

    await user.type(getComposer(), 'Draft text')

    expect(scrollTo).not.toHaveBeenCalled()
  })

  it('renders and announces the complete assistant response after submission', async () => {
    const user = userEvent.setup()
    renderChat()
    const announcement = screen.getByTestId('assistant-announcement')

    expect(announcement).toBeEmptyDOMElement()

    await user.type(getComposer(), 'What is the demonstration price?')
    await user.click(screen.getByRole('button', { name: /^send$/i }))

    const answer = await findMessageText(chatFixture.message)
    expect(answer).toBeVisible()
    expect(screen.getByTestId('assistant-announcement')).toBe(announcement)
    expect(announcement).toHaveAttribute('aria-live', 'polite')
    expect(announcement).toHaveAttribute('aria-atomic', 'true')
    expect(announcement).toHaveTextContent(chatFixture.message)
    expect(answer.closest('article')).not.toHaveAttribute('aria-live')
    expect(screen.getByText(/Pricing Question/i)).toBeVisible()
    expect(screen.getByText(/Answer With Rag/i)).toBeVisible()
    expect(screen.getByText('pricing.md')).toBeVisible()
    expect(screen.getByText(/trace-demo-001/i)).toBeVisible()
  })

  it('does not submit a duplicate request while a response is pending', async () => {
    const user = userEvent.setup()
    let calls = 0
    let resolveResponse!: () => void
    const responseReady = new Promise<void>((resolve) => {
      resolveResponse = resolve
    })
    server.use(
      http.post(`${API_BASE}/api/chat`, async () => {
        calls += 1
        await responseReady
        return HttpResponse.json(chatFixture)
      }),
    )
    renderChat()

    await user.type(getComposer(), 'What is the demonstration price?')
    const send = screen.getByRole('button', { name: /^send$/i })
    await user.dblClick(send)

    expect(
      await screen.findByRole('button', { name: /working/i }),
    ).toBeDisabled()
    expect(calls).toBe(1)

    resolveResponse()
    expect(await findMessageText(chatFixture.message)).toBeVisible()
    expect(calls).toBe(1)
  })

  it('re-announces an identical answer after clearing while pending', async () => {
    const user = userEvent.setup()
    let calls = 0
    let resolveSecondStarted!: () => void
    let resolveSecondResponse!: () => void
    const secondStarted = new Promise<void>((resolve) => {
      resolveSecondStarted = resolve
    })
    const secondResponseReady = new Promise<void>((resolve) => {
      resolveSecondResponse = resolve
    })
    server.use(
      http.post(`${API_BASE}/api/chat`, async () => {
        calls += 1
        if (calls === 2) {
          resolveSecondStarted()
          await secondResponseReady
        }
        return HttpResponse.json(chatFixture)
      }),
    )
    renderChat()
    const announcement = screen.getByTestId('assistant-announcement')

    await user.type(getComposer(), 'First demonstration question')
    await user.click(screen.getByRole('button', { name: /^send$/i }))
    await waitFor(() =>
      expect(announcement).toHaveTextContent(chatFixture.message),
    )

    await user.type(getComposer(), 'Second demonstration question')
    await user.click(screen.getByRole('button', { name: /^send$/i }))
    await secondStarted

    expect(screen.getByTestId('assistant-announcement')).toBe(announcement)
    expect(announcement).toBeEmptyDOMElement()

    resolveSecondResponse()
    await waitFor(() =>
      expect(announcement).toHaveTextContent(chatFixture.message),
    )
    expect(calls).toBe(2)
  })

  it('keeps a historical answer out of the announcement after a later failure', async () => {
    const user = userEvent.setup()
    let calls = 0
    let resolveSecondStarted!: () => void
    let resolveSecondFailure!: () => void
    const secondStarted = new Promise<void>((resolve) => {
      resolveSecondStarted = resolve
    })
    const secondFailureReady = new Promise<void>((resolve) => {
      resolveSecondFailure = resolve
    })
    server.use(
      http.post(`${API_BASE}/api/chat`, async () => {
        calls += 1
        if (calls === 2) {
          resolveSecondStarted()
          await secondFailureReady
          return HttpResponse.error()
        }
        return HttpResponse.json(chatFixture)
      }),
    )
    renderChat()
    const announcement = screen.getByTestId('assistant-announcement')

    await user.type(getComposer(), 'First successful demonstration question')
    await user.click(screen.getByRole('button', { name: /^send$/i }))
    const historicalAnswer = await findMessageText(chatFixture.message)
    expect(historicalAnswer).toBeVisible()
    expect(announcement).toHaveTextContent(chatFixture.message)

    await user.type(getComposer(), 'Second failing demonstration question')
    await user.click(screen.getByRole('button', { name: /^send$/i }))
    await secondStarted

    expect(screen.getByTestId('assistant-announcement')).toBe(announcement)
    expect(announcement).toBeEmptyDOMElement()

    resolveSecondFailure()
    expect(
      await screen.findByText(
        'We could not reach the assistant. Check your connection and try again.',
      ),
    ).toBeVisible()
    expect(screen.getByTestId('assistant-announcement')).toBe(announcement)
    expect(announcement).toBeEmptyDOMElement()
    expect(historicalAnswer).toBeVisible()
    expect(calls).toBe(2)
  })

  it('keeps request and response payloads out of the mutation cache', async () => {
    const user = userEvent.setup()
    const submittedMessage = 'What is the private cache behavior?'
    let resolveStarted!: () => void
    let resolveResponse!: () => void
    const started = new Promise<void>((resolve) => {
      resolveStarted = resolve
    })
    const responseReady = new Promise<void>((resolve) => {
      resolveResponse = resolve
    })
    let requestBody:
      | { message: string; user_id: string; session_id: string; locale: string }
      | undefined
    server.use(
      http.post(`${API_BASE}/api/chat`, async ({ request }) => {
        requestBody = (await request.json()) as {
          message: string
          user_id: string
          session_id: string
          locale: string
        }
        resolveStarted()
        await responseReady
        return HttpResponse.json(chatFixture)
      }),
    )
    const { queryClient } = renderChat()

    await user.type(getComposer(), submittedMessage)
    await user.click(screen.getByRole('button', { name: /^send$/i }))
    await started

    const mutations = queryClient.getMutationCache().getAll()
    expect(mutations).toHaveLength(1)
    expect(mutations[0].options.retry).toBe(false)
    expect(mutations[0].options.gcTime).toBe(0)
    expect(mutations[0].state.status).toBe('pending')
    expect(mutations[0].state.variables).toBeUndefined()
    expect(mutations[0].state.data).toBeUndefined()
    expect(requestBody).toBeDefined()
    expect(requestBody?.locale).toBe('en')

    const cachedWhilePending = JSON.stringify(
      mutations.map(({ state }) => state),
    )
    expect(cachedWhilePending).not.toContain(submittedMessage)
    expect(cachedWhilePending).not.toContain(requestBody?.user_id)
    expect(cachedWhilePending).not.toContain(requestBody?.session_id)
    expect(cachedWhilePending).not.toContain(chatFixture.message)
    expect(cachedWhilePending).not.toContain('answer_with_rag')

    resolveResponse()
    expect(await findMessageText(chatFixture.message)).toBeVisible()
    await waitFor(() =>
      expect(queryClient.getMutationCache().getAll()).toHaveLength(0),
    )
  })

  it('states that no appointment was created when the CRM is unavailable', async () => {
    const user = userEvent.setup()
    const submittedMessage = 'Book a demonstration appointment.'
    const backendMessage = 'CRM connection failed with private context.'
    const backendTrace = 'trace-private-crm-503'
    const backendAction = 'private_crm_action_payload'
    let calls = 0
    let requestBody:
      | { message: string; user_id: string; session_id: string; locale: string }
      | undefined
    server.use(
      http.post(`${API_BASE}/api/chat`, async ({ request }) => {
        calls += 1
        requestBody = (await request.json()) as {
          message: string
          user_id: string
          session_id: string
          locale: string
        }
        return HttpResponse.json(
          {
            detail: {
              message: backendMessage,
              code: 'crm_unavailable',
              trace_id: backendTrace,
              action_data: { tool: backendAction },
            },
          },
          { status: 503 },
        )
      }),
    )
    const { queryClient } = renderChat()
    const { observations, unsubscribe } = observeMutationPrivacy(queryClient)

    await user.type(getComposer(), submittedMessage)
    await user.click(screen.getByRole('button', { name: /^send$/i }))

    expect(
      await screen.findByText(
        'The scheduling service is temporarily unavailable. No appointment or callback was created.',
      ),
    ).toBeVisible()
    expect(screen.getByText(new RegExp(backendTrace, 'i'))).toBeVisible()
    expect(calls).toBe(1)
    expect(requestBody).toBeDefined()
    await waitFor(() =>
      expect(queryClient.getMutationCache().getAll()).toHaveLength(0),
    )
    unsubscribe()

    expectNoMutationFailureState(observations)
    const serializedCache = serializeMutationPrivacy(observations)
    expect(serializedCache).not.toContain(submittedMessage)
    expect(serializedCache).not.toContain(requestBody?.user_id)
    expect(serializedCache).not.toContain(requestBody?.session_id)
    expect(serializedCache).not.toContain(backendMessage)
    expect(serializedCache).not.toContain(backendTrace)
    expect(serializedCache).not.toContain(backendAction)
  })

  it('shows a safe connectivity error after a network failure', async () => {
    const user = userEvent.setup()
    const submittedMessage = 'What are your opening hours?'
    let calls = 0
    let requestBody:
      | { message: string; user_id: string; session_id: string; locale: string }
      | undefined
    server.use(
      http.post(`${API_BASE}/api/chat`, async ({ request }) => {
        calls += 1
        requestBody = (await request.json()) as {
          message: string
          user_id: string
          session_id: string
          locale: string
        }
        return HttpResponse.error()
      }),
    )
    const { queryClient } = renderChat()
    const { observations, unsubscribe } = observeMutationPrivacy(queryClient)

    await user.type(getComposer(), submittedMessage)
    await user.click(screen.getByRole('button', { name: /^send$/i }))

    expect(
      await screen.findByText(
        'We could not reach the assistant. Check your connection and try again.',
      ),
    ).toBeVisible()
    expect(calls).toBe(1)
    expect(requestBody).toBeDefined()
    await waitFor(() =>
      expect(queryClient.getMutationCache().getAll()).toHaveLength(0),
    )
    unsubscribe()

    expectNoMutationFailureState(observations)
    const serializedCache = serializeMutationPrivacy(observations)
    expect(serializedCache).not.toContain(submittedMessage)
    expect(serializedCache).not.toContain(requestBody?.user_id)
    expect(serializedCache).not.toContain(requestBody?.session_id)
  })

  it('retries the failed request without adding a second user message', async () => {
    const user = userEvent.setup()
    let calls = 0
    server.use(
      http.post(`${API_BASE}/api/chat`, () => {
        calls += 1
        return calls === 1
          ? HttpResponse.error()
          : HttpResponse.json(chatFixture)
      }),
    )
    renderChat()

    await user.type(getComposer(), 'What is the demonstration price?')
    await user.click(screen.getByRole('button', { name: /^send$/i }))
    await user.click(await screen.findByRole('button', { name: /retry/i }))

    expect(await findMessageText(chatFixture.message)).toBeVisible()
    expect(
      screen.getAllByRole('article', { name: 'You message' }),
    ).toHaveLength(1)
    expect(calls).toBe(2)
  })

  it('retries with the failed operation locale after the interface language changes', async () => {
    const user = userEvent.setup()
    const locales: string[] = []
    let calls = 0
    const spanishAnswer = 'Respuesta de demostración en español.'
    server.use(
      http.post(`${API_BASE}/api/chat`, async ({ request }) => {
        calls += 1
        const body = (await request.json()) as { locale: string }
        locales.push(body.locale)
        return calls === 1
          ? HttpResponse.error()
          : HttpResponse.json({
              ...chatFixture,
              message: spanishAnswer,
              locale: 'es',
            })
      }),
    )
    renderChatWithSwitcher('es')

    await user.type(
      screen.getByRole('textbox', {
        name: 'Enviar un mensaje a Doc Helper AI Agent',
      }),
      '¿Cuál es el precio de demostración?',
    )
    await user.click(screen.getByRole('button', { name: 'Enviar' }))
    expect(
      await screen.findByText(/No pudimos conectar con el asistente/i),
    ).toBeVisible()

    await user.click(screen.getByRole('button', { name: 'English' }))
    await user.click(screen.getByRole('button', { name: 'Retry' }))

    expect(await findMessageText(spanishAnswer)).toHaveAttribute('lang', 'es')
    expect(locales).toEqual(['es', 'es'])
    expect(
      screen.getAllByRole('article', { name: 'You message' }),
    ).toHaveLength(1)
  })

  it('preserves an emergency response and shows the professional-help warning', async () => {
    const user = userEvent.setup()
    const emergencyAnswer =
      'This demonstration cannot assess symptoms. Please seek qualified help.'
    server.use(
      http.post(`${API_BASE}/api/chat`, () =>
        HttpResponse.json({
          ...chatFixture,
          message: emergencyAnswer,
          classification: 'emergency_or_pain',
          requires_human: false,
          actions: [],
          sources: [],
          trace_id: 'trace-emergency-001',
        }),
      ),
    )
    renderChat()

    await user.type(getComposer(), 'I have severe pain and swelling.')
    await user.click(screen.getByRole('button', { name: /^send$/i }))

    expect(await findMessageText(emergencyAnswer)).toBeVisible()
    const warning = screen.getByRole('alert')
    expect(warning).toHaveTextContent('Professional help may be needed')
    expect(warning).toHaveTextContent('has not contacted emergency services')
  })

  it('shows the emergency warning in Spanish without replacing the backend answer', async () => {
    const user = userEvent.setup()
    const emergencyAnswer =
      'Esta demostración no puede evaluar síntomas. Busca ayuda profesional.'
    server.use(
      http.post(`${API_BASE}/api/chat`, () =>
        HttpResponse.json({
          ...chatFixture,
          message: emergencyAnswer,
          classification: 'emergency_or_pain',
          requires_human: true,
          actions: [],
          sources: [],
          trace_id: 'trace-emergency-es-001',
          locale: 'es',
        }),
      ),
    )
    renderChat('es')

    await user.type(
      screen.getByRole('textbox', {
        name: 'Enviar un mensaje a Doc Helper AI Agent',
      }),
      'Tengo dolor intenso e hinchazón.',
    )
    await user.click(screen.getByRole('button', { name: 'Enviar' }))

    expect(await findMessageText(emergencyAnswer)).toBeVisible()
    const warning = screen.getByRole('alert')
    expect(warning).toHaveTextContent('Puede ser necesaria ayuda profesional')
    expect(warning).toHaveTextContent(
      'no ha contactado a los servicios de emergencia',
    )
  })

  it('preserves a non-emergency human-review response without confirming follow-up', async () => {
    const user = userEvent.setup()
    const reviewAnswer =
      'A team member should review this demonstration request before any follow-up.'
    server.use(
      http.post(`${API_BASE}/api/chat`, () =>
        HttpResponse.json({
          ...chatFixture,
          message: reviewAnswer,
          classification: 'general_question',
          requires_human: true,
          actions: [],
          sources: [],
          trace_id: 'trace-human-review-001',
        }),
      ),
    )
    renderChat()

    await user.type(getComposer(), 'Please have someone review this request.')
    await user.click(screen.getByRole('button', { name: /^send$/i }))

    expect(await findMessageText(reviewAnswer)).toBeVisible()
    const warning = screen.getByRole('alert')
    expect(warning).toHaveTextContent('Human review recommended')
    expect(warning).toHaveTextContent(
      'A callback or ticket is only confirmed when a successful action below explicitly says so.',
    )
    expect(screen.queryByText('Agent actions')).not.toBeInTheDocument()
  })

  it('preserves an unknown tool identifier exactly', async () => {
    const user = userEvent.setup()
    server.use(
      http.post(`${API_BASE}/api/chat`, () =>
        HttpResponse.json({
          ...chatFixture,
          actions: [
            {
              tool: 'new_backend_tool',
              status: 'success',
              result: {},
            },
          ],
        }),
      ),
    )
    renderChat()

    await user.type(getComposer(), 'Run the demonstration tool.')
    await user.click(screen.getByRole('button', { name: 'Send' }))

    expect(await screen.findByText('new_backend_tool')).toBeVisible()
    expect(screen.queryByText('New Backend Tool')).not.toBeInTheDocument()
  })

  it('populates the composer from a starter prompt', async () => {
    const user = userEvent.setup()
    renderChat()

    await user.click(
      screen.getByRole('button', { name: /what is your cancellation policy/i }),
    )

    expect(getComposer()).toHaveValue('What is your cancellation policy?')
  })

  it('inserts a newline with Shift+Enter and submits with Enter', async () => {
    const user = userEvent.setup()
    let calls = 0
    server.use(
      http.post(`${API_BASE}/api/chat`, () => {
        calls += 1
        return HttpResponse.json(chatFixture)
      }),
    )
    renderChat()

    await user.type(getComposer(), 'First line')
    await user.keyboard('{Shift>}{Enter}{/Shift}')
    await user.type(getComposer(), 'Second line')

    expect(getComposer()).toHaveValue('First line\nSecond line')
    expect(calls).toBe(0)

    await user.keyboard('{Enter}')
    expect(await findMessageText(chatFixture.message)).toBeVisible()
    expect(calls).toBe(1)
  })

  it('aborts an in-flight chat request on unmount', async () => {
    const user = userEvent.setup()
    let resolveStarted!: () => void
    let resolveAborted!: (event: Event) => void
    const started = new Promise<void>((resolve) => {
      resolveStarted = resolve
    })
    const aborted = new Promise<Event>((resolve) => {
      resolveAborted = resolve
    })
    server.use(
      http.post(`${API_BASE}/api/chat`, async ({ request }) => {
        request.signal.addEventListener(
          'abort',
          (event) => resolveAborted(event),
          { once: true },
        )
        resolveStarted()
        await aborted
        return HttpResponse.json(chatFixture)
      }),
    )
    const { unmount } = renderChat()

    await user.type(getComposer(), 'What is the demonstration price?')
    await user.click(screen.getByRole('button', { name: /^send$/i }))
    await started
    unmount()

    await expect(aborted).resolves.toMatchObject({ type: 'abort' })
  })

  it('aborts on clear, removes the transcript, and rotates the session', async () => {
    const user = userEvent.setup()
    const staleAnswer = 'Stale answer from the cleared conversation.'
    const freshAnswer = 'Fresh answer from the new conversation.'
    const requests: Array<{
      message: string
      user_id: string
      session_id: string
      locale: string
    }> = []
    let resolveStarted!: () => void
    let resolveAborted!: (event: Event) => void
    const started = new Promise<void>((resolve) => {
      resolveStarted = resolve
    })
    const aborted = new Promise<Event>((resolve) => {
      resolveAborted = resolve
    })
    server.use(
      http.post(`${API_BASE}/api/chat`, async ({ request }) => {
        const body = (await request.json()) as {
          message: string
          user_id: string
          session_id: string
          locale: string
        }
        requests.push(body)
        if (requests.length === 1) {
          request.signal.addEventListener(
            'abort',
            (event) => resolveAborted(event),
            { once: true },
          )
          resolveStarted()
          await aborted
        }
        return HttpResponse.json({
          ...chatFixture,
          message: requests.length === 1 ? staleAnswer : freshAnswer,
        })
      }),
    )
    const { queryClient } = renderChat()

    await user.type(getComposer(), 'First session message')
    await user.click(screen.getByRole('button', { name: /^send$/i }))
    await started
    const firstRequest = requests.at(0)
    expect(firstRequest).toBeDefined()
    const pendingCache = JSON.stringify(
      queryClient
        .getMutationCache()
        .getAll()
        .map(({ state }) => state),
    )
    expect(pendingCache).not.toContain('First session message')
    expect(pendingCache).not.toContain(firstRequest?.user_id)
    expect(pendingCache).not.toContain(firstRequest?.session_id)
    expect(pendingCache).not.toContain(staleAnswer)
    expect(pendingCache).not.toContain('answer_with_rag')
    const storedSession = localStorage.getItem('doc-helper-session-id')
    expect(localStorage).toHaveLength(1)
    expect(storedSession).not.toContain('First session message')

    await user.click(screen.getByRole('button', { name: /clear/i }))

    await expect(aborted).resolves.toMatchObject({ type: 'abort' })
    await waitFor(() =>
      expect(queryClient.getMutationCache().getAll()).toHaveLength(0),
    )
    expect(screen.queryByText('First session message')).not.toBeInTheDocument()
    expect(localStorage.getItem('doc-helper-session-id')).not.toBe(
      storedSession,
    )
    expect(screen.getAllByRole('article')).toHaveLength(1)
    expect(
      within(screen.getByRole('article')).getByText(/Hello\. I can answer/i),
    ).toBeVisible()

    await user.type(getComposer(), 'Second session message')
    await user.click(screen.getByRole('button', { name: /^send$/i }))

    expect(await findMessageText(freshAnswer)).toBeVisible()
    expect(
      screen.queryByText(staleAnswer, { selector: 'p' }),
    ).not.toBeInTheDocument()
    expect(requests).toHaveLength(2)
    expect(requests[1]?.session_id).not.toBe(requests[0]?.session_id)
    await waitFor(() =>
      expect(queryClient.getMutationCache().getAll()).toHaveLength(0),
    )
  })
})
