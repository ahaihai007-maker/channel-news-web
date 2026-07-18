<script setup>
import { computed } from 'vue'

const props = defineProps({
  services: { type: Array, default: () => [] },
  incidents: { type: Array, default: () => [] }
})

const statusLabels = {
  healthy: '正常',
  delayed: '延迟',
  offline: '离线',
  failed: '失败',
  unknown: '未确认'
}

const formattedServices = computed(() => props.services.map((service) => ({
  ...service,
  statusLabel: statusLabels[service.status] || service.status,
  seenLabel: service.lastSeenAt
    ? new Intl.RelativeTimeFormat('zh-CN', { numeric: 'auto' }).format(
        -Math.max(0, Math.round((Date.now() - new Date(service.lastSeenAt).getTime()) / 60000)),
        'minute'
      )
    : '无心跳'
})))
</script>

<template>
  <section class="status-panel telemetry-panel">
    <div class="telemetry-panel__header">
      <div>
        <h2>服务状态</h2>
      </div>
      <span class="telemetry-panel__meta">{{ services.length }} 个服务</span>
    </div>

    <div class="status-panel__grid">
      <article
        v-for="service in formattedServices"
        :key="service.key"
        class="status-panel__item"
        :class="`is-${service.status}`"
      >
        <i class="status-panel__indicator" />
        <div class="status-panel__copy">
          <strong>{{ service.label }}</strong>
          <span>{{ service.detail || service.seenLabel }}</span>
        </div>
        <el-tag size="small" effect="dark">{{ service.statusLabel }}</el-tag>
      </article>
    </div>

    <div v-if="incidents.length" class="status-panel__incidents">
      <div class="status-panel__incidents-title">当前异常</div>
      <article v-for="incident in incidents.slice(0, 4)" :key="incident.key">
        <span :class="`is-${incident.severity}`">{{ incident.severity }}</span>
        <div>
          <strong>{{ incident.title }}</strong>
          <p>{{ incident.detail }}</p>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.status-panel__incidents-title {
  color: var(--monitor-color-muted);
  font-size: var(--monitor-text-xs);
  font-weight: 700;
}

.status-panel__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
}

.status-panel__item {
  display: flex;
  align-items: center;
  gap: var(--monitor-space-xs);
  min-height: 3.75rem;
  padding: var(--monitor-space-sm) var(--monitor-space-md);
  border-block-end: var(--monitor-rule);
}

.status-panel__indicator {
  width: 0.5rem;
  height: 0.5rem;
  flex: 0 0 auto;
  border-radius: 50%;
  background: var(--monitor-color-success);
}

.status-panel__copy {
  min-width: 0;
  flex: 1;
}

.status-panel__copy strong,
.status-panel__copy span {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-panel__copy strong {
  color: var(--monitor-color-ink);
  font-size: var(--monitor-text-xs);
}

.status-panel__copy span {
  margin-block-start: var(--monitor-space-2xs);
  color: var(--monitor-color-muted);
  font-size: var(--monitor-text-xs);
}

.status-panel__item :deep(.el-tag) {
  border: 0;
  color: var(--monitor-color-success);
  background: var(--monitor-color-success-soft);
}

.status-panel__item.is-delayed .status-panel__indicator { background: var(--monitor-color-warning); }
.status-panel__item.is-offline .status-panel__indicator,
.status-panel__item.is-failed .status-panel__indicator { background: var(--monitor-color-danger); }
.status-panel__item.is-unknown .status-panel__indicator { background: var(--monitor-color-faint); }
.status-panel__item.is-delayed :deep(.el-tag) { color: var(--monitor-color-warning); background: var(--monitor-color-warning-soft); }
.status-panel__item.is-offline :deep(.el-tag),
.status-panel__item.is-failed :deep(.el-tag) { color: var(--monitor-color-danger); background: var(--monitor-color-danger-soft); }
.status-panel__item.is-unknown :deep(.el-tag) { color: var(--monitor-color-muted); background: var(--monitor-color-surface-subtle); }

.status-panel__incidents {
  padding: var(--monitor-space-md);
}

.status-panel__incidents-title { margin-block-end: var(--monitor-space-xs); }

.status-panel__incidents article {
  display: flex;
  gap: var(--monitor-space-xs);
  padding: var(--monitor-space-xs) 0;
  border-block-start: var(--monitor-rule);
}

.status-panel__incidents article > span {
  color: var(--monitor-color-warning);
  font-size: var(--monitor-text-xs);
  font-weight: 700;
  line-height: 1.3;
  text-transform: uppercase;
}

.status-panel__incidents article > span.is-critical { color: var(--monitor-color-danger); }
.status-panel__incidents strong { color: var(--monitor-color-ink); font-size: var(--monitor-text-xs); }
.status-panel__incidents p { margin: var(--monitor-space-2xs) 0 0; color: var(--monitor-color-muted); font-size: var(--monitor-text-xs); line-height: 1.4; }

@media (min-width: 90rem) {
  .status-panel__grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .status-panel__item:nth-child(odd) { border-inline-end: var(--monitor-rule); }
}
</style>
