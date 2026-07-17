import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const monitoringApiMock = vi.hoisted(() => ({
  getDashboard: vi.fn(),
  getInteractionDashboard: vi.fn(),
  getInteractionRuns: vi.fn()
}))

vi.mock('@/services/api.js', () => ({
  monitoringApi: monitoringApiMock
}))

import { useMonitoringStore } from './monitoring.js'

describe('monitoring store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('keeps channel and interaction responses in independent state', async () => {
    monitoringApiMock.getDashboard.mockResolvedValue({
      code: 200,
      data: { meta: { generatedAt: '2026-07-15T10:00:00' }, metrics: [] }
    })
    monitoringApiMock.getInteractionDashboard.mockResolvedValue({
      code: 200,
      data: {
        meta: { generatedAt: '2026-07-15T10:01:00' },
        summary: { totalRuns: 12 },
        facets: { routes: [], chats: [] }
      }
    })

    const store = useMonitoringStore()
    await store.fetchDashboard({ days: 7 })
    await store.fetchInteractionDashboard({ days: 7 })

    expect(store.dashboard.meta.generatedAt).toBe('2026-07-15T10:00:00')
    expect(store.interactionSummary.totalRuns).toBe(12)
    expect(store.lastUpdatedAt).toBe('2026-07-15T10:00:00')
    expect(store.interactionLastUpdatedAt).toBe('2026-07-15T10:01:00')
    expect(store.error).toBe('')
    expect(store.interactionError).toBe('')
  })

  it('aborts the previous interaction overview request', async () => {
    monitoringApiMock.getInteractionDashboard
      .mockImplementationOnce((_filters, signal) => new Promise((_resolve, reject) => {
        signal.addEventListener('abort', () => {
          const error = new Error('canceled')
          error.code = 'ERR_CANCELED'
          reject(error)
        })
      }))
      .mockResolvedValueOnce({
        code: 200,
        data: { meta: { generatedAt: '2026-07-15T10:02:00' }, summary: { totalRuns: 3 } }
      })

    const store = useMonitoringStore()
    const firstRequest = store.fetchInteractionDashboard({ days: 7 })
    const secondRequest = store.fetchInteractionDashboard({ days: 1 })
    await Promise.all([firstRequest, secondRequest])

    expect(monitoringApiMock.getInteractionDashboard).toHaveBeenCalledTimes(2)
    expect(store.interactionSummary.totalRuns).toBe(3)
    expect(store.interactionError).toBe('')
    expect(store.interactionLoading).toBe(false)
  })

  it('stores paged run metadata without mixing it into the overview', async () => {
    monitoringApiMock.getInteractionRuns.mockResolvedValue({
      code: 200,
      data: {
        items: [{ id: 9, status: 'FAILED', errorSummary: 'request failed' }],
        page: 2,
        pageSize: 20,
        total: 21
      }
    })

    const store = useMonitoringStore()
    await store.fetchInteractionRuns({ days: 7, page: 2 })

    expect(store.interactionRuns.page).toBe(2)
    expect(store.interactionRuns.items[0].errorSummary).toBe('request failed')
    expect(store.interactionDashboard).toBeNull()
  })
})
