import { act, screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { healthFixture } from '../../../test/fixtures'
import { API_BASE } from '../../../test/handlers'
import { renderWithProviders } from '../../../test/render'
import { server } from '../../../test/server'
import { useHealth } from '../hooks/useHealth'
import { HealthIndicator } from './HealthIndicator'

function HealthHarness() {
  const { health, status, refresh } = useHealth()

  return (
    <HealthIndicator
      health={health}
      status={status}
      onRefresh={() => void refresh()}
    />
  )
}

describe('HealthIndicator', () => {
  it('shows online health returned by the API', async () => {
    renderWithProviders(<HealthHarness />)

    expect(
      await screen.findByRole('button', { name: /API online/i }),
    ).toBeVisible()
  })

  it('aborts an in-flight health request on unmount', async () => {
    let resolveStarted!: () => void
    let resolveAborted!: (event: Event) => void
    const started = new Promise<void>((resolve) => {
      resolveStarted = resolve
    })
    const aborted = new Promise<Event>((resolve) => {
      resolveAborted = resolve
    })

    server.use(
      http.get(`${API_BASE}/health`, async ({ request }) => {
        request.signal.addEventListener(
          'abort',
          (event) => resolveAborted(event),
          { once: true },
        )
        resolveStarted()
        await aborted
        return HttpResponse.json(healthFixture)
      }),
    )

    const { unmount } = renderWithProviders(<HealthHarness />)
    await started
    unmount()

    await expect(aborted).resolves.toMatchObject({ type: 'abort' })
  })

  it('refetches health after 45 seconds', async () => {
    let calls = 0
    let resolveInitialRequest!: () => void
    let resolveRefetch!: () => void
    const initialRequest = new Promise<void>((resolve) => {
      resolveInitialRequest = resolve
    })
    const refetched = new Promise<void>((resolve) => {
      resolveRefetch = resolve
    })
    server.use(
      http.get(`${API_BASE}/health`, () => {
        calls += 1
        if (calls === 1) resolveInitialRequest()
        if (calls === 2) resolveRefetch()
        return HttpResponse.json(healthFixture)
      }),
    )
    vi.useFakeTimers()
    let unmount = () => {}

    try {
      unmount = renderWithProviders(<HealthHarness />).unmount
      await initialRequest
      expect(calls).toBe(1)

      await act(async () => {
        await vi.advanceTimersByTimeAsync(44_999)
      })
      expect(calls).toBe(1)

      await act(async () => {
        await vi.advanceTimersByTimeAsync(1)
      })

      await refetched
      expect(calls).toBe(2)
    } finally {
      unmount()
      vi.useRealTimers()
    }
  })
})
