<script setup>
import { computed } from 'vue'
import ArticlePerformanceTable from './ArticlePerformanceTable.vue'
import ChannelTelemetryTable from './ChannelTelemetryTable.vue'
import GlobalHealthBanner from './GlobalHealthBanner.vue'
import MetricRail from './MetricRail.vue'
import MonitoringToolbar from './MonitoringToolbar.vue'
import PipelineFunnelPanel from './PipelineFunnelPanel.vue'
import ServiceStatusPanel from './ServiceStatusPanel.vue'
import TokenUsagePanel from './TokenUsagePanel.vue'
import TrafficTrendPanel from './TrafficTrendPanel.vue'

const HIDDEN_SERVICE_KEY = 'telegram_metrics'

const props = defineProps({
  filters: { type: Object, required: true },
  autoRefresh: Boolean,
  loading: Boolean,
  error: { type: String, default: '' },
  lastUpdatedAt: { type: String, default: '' },
  metrics: { type: Array, default: () => [] },
  traffic: { type: Array, default: () => [] },
  tokens: { type: Array, default: () => [] },
  funnel: { type: Array, default: () => [] },
  channels: { type: Array, default: () => [] },
  articles: { type: Array, default: () => [] },
  services: { type: Array, default: () => [] },
  incidents: { type: Array, default: () => [] }
})

const emit = defineEmits(['update:filters', 'update:autoRefresh', 'refresh'])

const visibleServices = computed(() =>
  props.services.filter((service) => service.key !== HIDDEN_SERVICE_KEY)
)

const visibleIncidents = computed(() =>
  props.incidents.filter((incident) => incident.key !== `service:${HIDDEN_SERVICE_KEY}`)
)
</script>

<template>
  <section data-testid="channel-monitor-panel">
    <MonitoringToolbar
      :filters="filters"
      :channels="channels"
      :auto-refresh="autoRefresh"
      :loading="loading"
      :last-updated-at="lastUpdatedAt"
      @update:filters="emit('update:filters', $event)"
      @update:auto-refresh="emit('update:autoRefresh', $event)"
      @refresh="emit('refresh')"
    />

    <el-alert
      v-if="error"
      class="channel-monitor-panel__error"
      type="error"
      :title="error"
      :closable="false"
      show-icon
    />

    <GlobalHealthBanner :services="visibleServices" :incidents="visibleIncidents" />
    <MetricRail :items="metrics" :loading="loading" />

    <main class="channel-monitor-panel__grid">
      <TrafficTrendPanel class="channel-monitor-panel__traffic" :points="traffic" :loading="loading" />
      <ServiceStatusPanel
        class="channel-monitor-panel__services"
        :services="visibleServices"
        :incidents="visibleIncidents"
      />
      <ChannelTelemetryTable
        class="channel-monitor-panel__channels"
        :rows="channels"
        :loading="loading"
      />
      <PipelineFunnelPanel
        class="channel-monitor-panel__funnel"
        :stages="funnel"
        :loading="loading"
      />
      <TokenUsagePanel
        class="channel-monitor-panel__tokens"
        :points="tokens"
        :loading="loading"
      />
      <ArticlePerformanceTable
        class="channel-monitor-panel__articles"
        :rows="articles"
        :loading="loading"
      />
    </main>
  </section>
</template>

<style scoped>
.channel-monitor-panel__error {
  margin: 12px 0 0;
}

.channel-monitor-panel__grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 12px;
  margin-top: 12px;
}

.channel-monitor-panel__traffic { grid-column: span 8; }
.channel-monitor-panel__services { grid-column: span 4; }
.channel-monitor-panel__channels { grid-column: span 12; }
.channel-monitor-panel__funnel { grid-column: span 4; }
.channel-monitor-panel__tokens { grid-column: span 8; }
.channel-monitor-panel__articles { grid-column: span 12; }

@media (max-width: 1320px) {
  .channel-monitor-panel__traffic,
  .channel-monitor-panel__services,
  .channel-monitor-panel__funnel,
  .channel-monitor-panel__tokens {
    grid-column: span 12;
  }
}

@media (max-width: 768px) {
  .channel-monitor-panel__grid {
    gap: 8px;
    margin-top: 8px;
  }
}
</style>
