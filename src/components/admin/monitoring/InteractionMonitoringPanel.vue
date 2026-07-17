<script setup>
import InteractionArticleTable from './InteractionArticleTable.vue'
import InteractionBreakdownPanel from './InteractionBreakdownPanel.vue'
import InteractionExecutionTrendPanel from './InteractionExecutionTrendPanel.vue'
import InteractionHealthBanner from './InteractionHealthBanner.vue'
import InteractionMetricRail from './InteractionMetricRail.vue'
import InteractionMonitoringToolbar from './InteractionMonitoringToolbar.vue'
import InteractionRouteTable from './InteractionRouteTable.vue'
import InteractionRunTable from './InteractionRunTable.vue'
import InteractionTokenLatencyPanel from './InteractionTokenLatencyPanel.vue'

defineProps({
  filters: { type: Object, required: true },
  runFilters: { type: Object, required: true },
  autoRefresh: Boolean,
  loading: Boolean,
  runsLoading: Boolean,
  error: { type: String, default: '' },
  lastUpdatedAt: { type: String, default: '' },
  service: { type: Object, default: null },
  summary: { type: Object, default: null },
  timeseries: { type: Array, default: () => [] },
  breakdowns: { type: Object, required: true },
  routes: { type: Array, default: () => [] },
  articles: { type: Array, default: () => [] },
  facets: { type: Object, required: true },
  runs: { type: Object, required: true },
  granularity: { type: String, default: 'day' }
})

const emit = defineEmits([
  'update:filters',
  'update:runFilters',
  'update:runPage',
  'update:autoRefresh',
  'refresh'
])
</script>

<template>
  <section data-testid="interaction-monitor-panel">
    <InteractionMonitoringToolbar
      :filters="filters"
      :facets="facets"
      :auto-refresh="autoRefresh"
      :loading="loading"
      :last-updated-at="lastUpdatedAt"
      @update:filters="emit('update:filters', $event)"
      @update:auto-refresh="emit('update:autoRefresh', $event)"
      @refresh="emit('refresh')"
    />

    <el-alert
      v-if="error"
      class="interaction-monitor-panel__error"
      type="error"
      :title="error"
      :closable="false"
      show-icon
    />

    <InteractionHealthBanner :service="service" :summary="summary" :loading="loading" />
    <InteractionMetricRail :summary="summary" :loading="loading" />

    <main class="interaction-monitor-panel__grid">
      <InteractionExecutionTrendPanel
        class="interaction-monitor-panel__execution"
        :points="timeseries"
        :granularity="granularity"
        :loading="loading"
      />
      <InteractionBreakdownPanel
        class="interaction-monitor-panel__breakdowns"
        :breakdowns="breakdowns"
        :loading="loading"
      />
      <InteractionTokenLatencyPanel
        class="interaction-monitor-panel__tokens"
        :points="timeseries"
        :granularity="granularity"
        :loading="loading"
      />
      <InteractionArticleTable
        class="interaction-monitor-panel__articles"
        :rows="articles"
        :loading="loading"
      />
      <InteractionRouteTable
        class="interaction-monitor-panel__routes"
        :rows="routes"
        :loading="loading"
      />
      <InteractionRunTable
        class="interaction-monitor-panel__runs"
        :rows="runs.items"
        :total="runs.total"
        :page="runs.page"
        :page-size="runs.pageSize"
        :filters="runFilters"
        :breakdowns="breakdowns"
        :loading="runsLoading"
        @update:filters="emit('update:runFilters', $event)"
        @update:page="emit('update:runPage', $event)"
      />
    </main>
  </section>
</template>

<style scoped>
.interaction-monitor-panel__error {
  margin: 12px 0 0;
}

.interaction-monitor-panel__grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 12px;
  margin-top: 12px;
}

.interaction-monitor-panel__execution { grid-column: span 8; }
.interaction-monitor-panel__breakdowns { grid-column: span 4; }
.interaction-monitor-panel__tokens { grid-column: span 8; }
.interaction-monitor-panel__articles { grid-column: span 4; }
.interaction-monitor-panel__routes,
.interaction-monitor-panel__runs { grid-column: span 12; }

@media (max-width: 1320px) {
  .interaction-monitor-panel__execution,
  .interaction-monitor-panel__breakdowns,
  .interaction-monitor-panel__tokens,
  .interaction-monitor-panel__articles {
    grid-column: span 12;
  }
}

@media (max-width: 768px) {
  .interaction-monitor-panel__grid {
    gap: 8px;
    margin-top: 8px;
  }
}
</style>
