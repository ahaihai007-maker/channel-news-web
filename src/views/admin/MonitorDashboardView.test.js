import { describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { createMemoryHistory, createRouter } from 'vue-router'
import MonitorDashboardView from './MonitorDashboardView.vue'
import { useMonitoringStore } from '@/stores/monitoring.js'

const ChannelPanelStub = {
  name: 'ChannelMonitoringPanel',
  template: '<section data-testid="channel-monitor-panel-stub" />'
}

const InteractionPanelStub = {
  name: 'InteractionMonitoringPanel',
  template: '<section data-testid="interaction-monitor-panel-stub" />'
}

async function mountView(url) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/admin/monitor-dashboard', component: MonitorDashboardView }]
  })
  await router.push(url)
  await router.isReady()

  const wrapper = mount(MonitorDashboardView, {
    global: {
      plugins: [
        router,
        createTestingPinia({
          createSpy: vi.fn,
          stubActions: true
        })
      ],
      stubs: {
        ChannelMonitoringPanel: ChannelPanelStub,
        InteractionMonitoringPanel: InteractionPanelStub
      }
    }
  })
  await flushPromises()
  return { wrapper, router, store: useMonitoringStore() }
}

describe('MonitorDashboardView', () => {
  it('restores the AI interaction tab and filters from the URL', async () => {
    const { wrapper, store } = await mountView(
      '/admin/monitor-dashboard?view=interaction&days=1&routeId=8&chatId=-100123'
    )

    expect(wrapper.find('[data-testid="interaction-monitor-panel-stub"]').exists()).toBe(true)
    expect(store.fetchInteractionDashboard).toHaveBeenCalledWith({
      days: 1,
      routeId: 8,
      chatId: -100123
    })
    expect(store.fetchInteractionRuns).toHaveBeenCalledWith(expect.objectContaining({
      days: 1,
      routeId: 8,
      chatId: -100123,
      page: 1
    }))
    expect(store.fetchDashboard).not.toHaveBeenCalled()

    wrapper.unmount()
  })

  it('switches back to channel monitoring and removes the view query', async () => {
    const { wrapper, router, store } = await mountView(
      '/admin/monitor-dashboard?view=interaction&days=7'
    )

    await wrapper.find('[data-testid="channel-monitor-tab"]').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.query.view).toBeUndefined()
    expect(wrapper.find('[data-testid="channel-monitor-panel-stub"]').exists()).toBe(true)
    expect(store.fetchDashboard).toHaveBeenCalledWith({ days: 7, channel: undefined })

    wrapper.unmount()
  })

  it('polls only the active interaction tab', async () => {
    vi.useFakeTimers()
    const { wrapper, store } = await mountView(
      '/admin/monitor-dashboard?view=interaction&days=7'
    )
    const initialInteractionCalls = store.fetchInteractionDashboard.mock.calls.length

    await vi.advanceTimersByTimeAsync(30000)
    await flushPromises()

    expect(store.fetchInteractionDashboard).toHaveBeenCalledTimes(initialInteractionCalls + 1)
    expect(store.fetchDashboard).not.toHaveBeenCalled()

    wrapper.unmount()
  })
})
