import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { documentsFixture } from '../../../test/fixtures'
import { API_BASE } from '../../../test/handlers'
import { renderWithProviders } from '../../../test/render'
import { server } from '../../../test/server'
import { KnowledgeBaseSummary } from './KnowledgeBaseSummary'

describe('KnowledgeBaseSummary', () => {
  it('recovers when document retry succeeds', async () => {
    let calls = 0
    server.use(
      http.get(`${API_BASE}/api/documents`, () => {
        calls += 1
        return calls === 1
          ? HttpResponse.error()
          : HttpResponse.json(documentsFixture)
      }),
    )

    renderWithProviders(<KnowledgeBaseSummary />)
    await userEvent.click(await screen.findByRole('button', { name: /retry/i }))

    expect(await screen.findByText('pricing.md')).toBeVisible()
  })

  it('aborts an in-flight documents request on unmount', async () => {
    let resolveStarted!: () => void
    let resolveAborted!: (event: Event) => void
    const started = new Promise<void>((resolve) => {
      resolveStarted = resolve
    })
    const aborted = new Promise<Event>((resolve) => {
      resolveAborted = resolve
    })

    server.use(
      http.get(`${API_BASE}/api/documents`, async ({ request }) => {
        request.signal.addEventListener(
          'abort',
          (event) => resolveAborted(event),
          { once: true },
        )
        resolveStarted()
        await aborted
        return HttpResponse.json(documentsFixture)
      }),
    )

    const { unmount } = renderWithProviders(<KnowledgeBaseSummary />)
    await started
    unmount()

    await expect(aborted).resolves.toMatchObject({ type: 'abort' })
  })
})
