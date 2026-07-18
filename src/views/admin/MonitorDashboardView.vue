<script setup>
import { computed, onUnmounted, shallowRef, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import ChannelMonitoringPanel from '@/components/admin/monitoring/ChannelMonitoringPanel.vue'
import InteractionMonitoringPanel from '@/components/admin/monitoring/InteractionMonitoringPanel.vue'
import MonitorViewTabs from '@/components/admin/monitoring/MonitorViewTabs.vue'
import { useMonitoringPolling } from '@/composables/useMonitoringPolling.js'
import { useMonitoringStore } from '@/stores/monitoring.js'
import '../../../tokens.css'
import '@/components/admin/monitoring/monitoring-shell.css'

const route = useRoute()
const router = useRouter()
const monitoringStore = useMonitoringStore()
const {
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
  interactionFacets
} = storeToRefs(monitoringStore)

const activeView = computed(() => (
  route.query.view === 'interaction' ? 'interaction' : 'channel'
))

const selectedDays = computed(() => (
  [1, 7, 30].includes(Number(route.query.days)) ? Number(route.query.days) : 7
))

const channelFilters = computed(() => ({
  days: selectedDays.value,
  channel: typeof route.query.channel === 'string' ? route.query.channel : ''
}))

function numericQueryValue(value) {
  if (typeof value !== 'string' || !value.trim()) {
    return null
  }
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) ? parsed : null
}

const interactionFilters = computed(() => ({
  days: selectedDays.value,
  routeId: numericQueryValue(route.query.routeId),
  chatId: numericQueryValue(route.query.chatId)
}))

const runFilters = shallowRef({
  status: null,
  modelId: null,
  mode: null,
  triggerType: null,
  page: 1,
  pageSize: 20
})

const interactionGranularity = computed(() => (
  interactionDashboard.value?.meta?.granularity || (selectedDays.value === 1 ? 'hour' : 'day')
))

function channelRequestParams() {
  return {
    days: channelFilters.value.days,
    channel: channelFilters.value.channel || undefined
  }
}

function interactionRequestParams() {
  return {
    days: interactionFilters.value.days,
    routeId: interactionFilters.value.routeId || undefined,
    chatId: interactionFilters.value.chatId ?? undefined
  }
}

function runRequestParams() {
  const filters = runFilters.value
  return {
    ...interactionRequestParams(),
    status: filters.status || undefined,
    modelId: filters.modelId || undefined,
    mode: filters.mode || undefined,
    triggerType: filters.triggerType || undefined,
    page: filters.page,
    pageSize: filters.pageSize
  }
}

function loadChannelDashboard() {
  return monitoringStore.fetchDashboard(channelRequestParams())
}

function loadInteractionRuns() {
  return monitoringStore.fetchInteractionRuns(runRequestParams())
}

function loadInteractionDashboard() {
  return Promise.all([
    monitoringStore.fetchInteractionDashboard(interactionRequestParams()),
    loadInteractionRuns()
  ])
}

function loadActiveView() {
  return activeView.value === 'interaction'
    ? loadInteractionDashboard()
    : loadChannelDashboard()
}

function cancelActiveViewRequests() {
  if (activeView.value === 'interaction') {
    monitoringStore.cancelInteractionRequests()
    return
  }
  monitoringStore.cancelRequest()
}

function updateView(value) {
  router.replace({
    query: {
      ...route.query,
      view: value === 'interaction' ? 'interaction' : undefined
    }
  })
}

function updateChannelFilters(nextFilters) {
  router.replace({
    query: {
      ...route.query,
      days: nextFilters.days === 7 ? undefined : String(nextFilters.days),
      channel: nextFilters.channel || undefined
    }
  })
}

function updateInteractionFilters(nextFilters) {
  router.replace({
    query: {
      ...route.query,
      days: nextFilters.days === 7 ? undefined : String(nextFilters.days),
      routeId: nextFilters.routeId ? String(nextFilters.routeId) : undefined,
      chatId: nextFilters.chatId !== null && nextFilters.chatId !== undefined
        ? String(nextFilters.chatId)
        : undefined
    }
  })
}

function updateRunFilters(nextFilters) {
  runFilters.value = { ...nextFilters, page: 1, pageSize: runFilters.value.pageSize }
  loadInteractionRuns()
}

function updateRunPage(page) {
  runFilters.value = { ...runFilters.value, page }
  loadInteractionRuns()
}

const { isAutoRefresh, setAutoRefresh } = useMonitoringPolling(loadActiveView, {
  intervalMs: 30000,
  onPause: cancelActiveViewRequests
})

watch(
  () => [activeView.value, channelFilters.value.days, channelFilters.value.channel],
  ([view]) => {
    if (view !== 'channel') {
      monitoringStore.cancelRequest()
      return
    }
    loadChannelDashboard()
  },
  { immediate: true }
)

watch(
  () => [
    activeView.value,
    interactionFilters.value.days,
    interactionFilters.value.routeId,
    interactionFilters.value.chatId
  ],
  ([view]) => {
    if (view !== 'interaction') {
      monitoringStore.cancelInteractionRequests()
      return
    }
    runFilters.value = { ...runFilters.value, page: 1 }
    loadInteractionDashboard()
  },
  { immediate: true }
)

onUnmounted(() => {
  monitoringStore.cancelRequest()
  monitoringStore.cancelInteractionRequests()
})
</script>

<template>
  <div
    class="monitor-dashboard"
    :class="`is-${activeView}`"
    data-testid="monitor-dashboard"
  >
    <MonitorViewTabs :model-value="activeView" @update:model-value="updateView" />

    <ChannelMonitoringPanel
      v-if="activeView === 'channel'"
      :filters="channelFilters"
      :auto-refresh="isAutoRefresh"
      :loading="loading"
      :error="error"
      :last-updated-at="lastUpdatedAt"
      :metrics="metrics"
      :traffic="traffic"
      :tokens="tokens"
      :funnel="funnel"
      :channels="channels"
      :articles="articles"
      :services="services"
      :incidents="incidents"
      @update:filters="updateChannelFilters"
      @update:auto-refresh="setAutoRefresh"
      @refresh="loadChannelDashboard"
    />

    <InteractionMonitoringPanel
      v-else
      :filters="interactionFilters"
      :run-filters="runFilters"
      :auto-refresh="isAutoRefresh"
      :loading="interactionLoading"
      :runs-loading="interactionRunsLoading"
      :error="interactionError"
      :last-updated-at="interactionLastUpdatedAt"
      :service="interactionService"
      :summary="interactionSummary"
      :timeseries="interactionTimeseries"
      :breakdowns="interactionBreakdowns"
      :routes="interactionRoutes"
      :articles="interactionArticles"
      :facets="interactionFacets"
      :runs="interactionRuns"
      :granularity="interactionGranularity"
      @update:filters="updateInteractionFilters"
      @update:run-filters="updateRunFilters"
      @update:run-page="updateRunPage"
      @update:auto-refresh="setAutoRefresh"
      @refresh="loadInteractionDashboard"
    />
  </div>
</template>

<style scoped>
/* Hallmark · genre: modern-minimal · macrostructure: Workbench · theme: Cobalt · designed-as-app */
.monitor-dashboard {
  width: 100%;
  min-height: calc(100dvh - 6.75rem);
  overflow-x: clip;
  color: var(--monitor-color-ink-soft);
  background: transparent;
  font-family: var(--monitor-font-body);
}

@media (max-width: 48rem) {
  .monitor-dashboard {
    min-height: auto;
  }
}
</style>
