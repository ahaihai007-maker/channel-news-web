import { defineStore } from 'pinia'
import { computed, shallowRef } from 'vue'
import { monitoringApi } from '@/services/api.js'

export const useMonitoringStore = defineStore('monitoring', () => {
  const dashboard = shallowRef(null)
  const loading = shallowRef(false)
  const error = shallowRef('')
  const lastUpdatedAt = shallowRef(null)
  let activeController = null

  const interactionDashboard = shallowRef(null)
  const interactionRuns = shallowRef({ items: [], page: 1, pageSize: 20, total: 0 })
  const interactionLoading = shallowRef(false)
  const interactionRunsLoading = shallowRef(false)
  const interactionError = shallowRef('')
  const interactionLastUpdatedAt = shallowRef(null)
  let interactionController = null
  let interactionRunsController = null

  const metrics = computed(() => dashboard.value?.metrics || [])
  const traffic = computed(() => dashboard.value?.traffic || [])
  const tokens = computed(() => dashboard.value?.tokens || [])
  const funnel = computed(() => dashboard.value?.funnel || [])
  const channels = computed(() => dashboard.value?.channels || [])
  const articles = computed(() => dashboard.value?.articles || [])
  const services = computed(() => dashboard.value?.services || [])
  const incidents = computed(() => dashboard.value?.incidents || [])
  const interactionService = computed(() => interactionDashboard.value?.service || null)
  const interactionSummary = computed(() => interactionDashboard.value?.summary || null)
  const interactionTimeseries = computed(() => interactionDashboard.value?.timeseries || [])
  const interactionBreakdowns = computed(() => interactionDashboard.value?.breakdowns || {
    statuses: [],
    triggers: [],
    modes: [],
    models: []
  })
  const interactionRoutes = computed(() => interactionDashboard.value?.routes || [])
  const interactionArticles = computed(() => interactionDashboard.value?.articles || [])
  const interactionFacets = computed(() => interactionDashboard.value?.facets || {
    routes: [],
    chats: []
  })

  async function fetchDashboard(filters = {}) {
    activeController?.abort()
    const controller = new AbortController()
    activeController = controller
    loading.value = true
    error.value = ''
    try {
      const response = await monitoringApi.getDashboard(filters, controller.signal)
      if (response.code !== 200) {
        throw new Error(response.message || '监控数据加载失败')
      }
      dashboard.value = response.data
      lastUpdatedAt.value = response.data?.meta?.generatedAt || new Date().toISOString()
    } catch (requestError) {
      if (controller.signal.aborted || requestError?.code === 'ERR_CANCELED') {
        return
      }
      error.value = requestError?.response?.data?.message || requestError?.message || '监控数据加载失败'
    } finally {
      if (activeController === controller) {
        loading.value = false
        activeController = null
      }
    }
  }

  function cancelRequest() {
    activeController?.abort()
    activeController = null
    loading.value = false
  }

  async function fetchInteractionDashboard(filters = {}) {
    interactionController?.abort()
    const controller = new AbortController()
    interactionController = controller
    interactionLoading.value = true
    interactionError.value = ''
    try {
      const response = await monitoringApi.getInteractionDashboard(filters, controller.signal)
      if (response.code !== 200) {
        throw new Error(response.message || 'AI 互动监控加载失败')
      }
      interactionDashboard.value = response.data
      interactionLastUpdatedAt.value = response.data?.meta?.generatedAt || new Date().toISOString()
    } catch (requestError) {
      if (controller.signal.aborted || requestError?.code === 'ERR_CANCELED') {
        return
      }
      interactionError.value = requestError?.response?.data?.message
        || requestError?.message
        || 'AI 互动监控加载失败'
    } finally {
      if (interactionController === controller) {
        interactionLoading.value = false
        interactionController = null
      }
    }
  }

  async function fetchInteractionRuns(filters = {}) {
    interactionRunsController?.abort()
    const controller = new AbortController()
    interactionRunsController = controller
    interactionRunsLoading.value = true
    interactionError.value = ''
    try {
      const response = await monitoringApi.getInteractionRuns(filters, controller.signal)
      if (response.code !== 200) {
        throw new Error(response.message || 'AI 运行记录加载失败')
      }
      interactionRuns.value = response.data
    } catch (requestError) {
      if (controller.signal.aborted || requestError?.code === 'ERR_CANCELED') {
        return
      }
      interactionError.value = requestError?.response?.data?.message
        || requestError?.message
        || 'AI 运行记录加载失败'
    } finally {
      if (interactionRunsController === controller) {
        interactionRunsLoading.value = false
        interactionRunsController = null
      }
    }
  }

  function cancelInteractionRequests() {
    interactionController?.abort()
    interactionRunsController?.abort()
    interactionController = null
    interactionRunsController = null
    interactionLoading.value = false
    interactionRunsLoading.value = false
  }

  return {
    dashboard,
    loading,
    error,
    lastUpdatedAt,
    metrics,
    traffic,
    tokens,
    funnel,
    channels,
    articles,
    services,
    incidents,
    interactionDashboard,
    interactionRuns,
    interactionLoading,
    interactionRunsLoading,
    interactionError,
    interactionLastUpdatedAt,
    interactionService,
    interactionSummary,
    interactionTimeseries,
    interactionBreakdowns,
    interactionRoutes,
    interactionArticles,
    interactionFacets,
    fetchDashboard,
    fetchInteractionDashboard,
    fetchInteractionRuns,
    cancelRequest,
    cancelInteractionRequests
  }
})
