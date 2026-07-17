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
        <span class="telemetry-panel__kicker">RUNTIME</span>
        <h2>服务状态矩阵</h2>
      </div>
      <span class="telemetry-panel__count">{{ services.length }} SERVICES</span>
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
      <div class="status-panel__incidents-title">ACTIVE INCIDENTS</div>
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
.telemetry-panel {
  border: 1px solid #263540;
  background: #101a22;
}

.telemetry-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 64px;
  padding: 0 18px;
  border-bottom: 1px solid #263540;
}

.telemetry-panel__kicker,
.telemetry-panel__count,
.status-panel__incidents-title {
  color: #617584;
  font: 600 9px/1 ui-monospace, Consolas, monospace;
  letter-spacing: 0.13em;
}

.telemetry-panel h2 {
  margin: 5px 0 0;
  color: #dce8ef;
  font-size: 15px;
}

.status-panel__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.status-panel__item {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 60px;
  padding: 10px 14px;
  border-right: 1px solid #263540;
  border-bottom: 1px solid #263540;
  box-sizing: border-box;
}

.status-panel__item:nth-child(2n) { border-right: 0; }

.status-panel__indicator {
  width: 8px;
  height: 8px;
  border: 2px solid #0d161d;
  border-radius: 50%;
  background: #32c787;
  box-shadow: 0 0 0 1px #32c787;
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
  color: #c8d5dd;
  font-size: 12px;
}

.status-panel__copy span {
  margin-top: 4px;
  color: #657987;
  font-size: 10px;
}

.status-panel__item :deep(.el-tag) {
  border: 0;
  background: #1b6b4d;
}

.status-panel__item.is-delayed .status-panel__indicator { background: #efb849; box-shadow: 0 0 0 1px #efb849; }
.status-panel__item.is-offline .status-panel__indicator,
.status-panel__item.is-failed .status-panel__indicator { background: #f06464; box-shadow: 0 0 0 1px #f06464; }
.status-panel__item.is-unknown .status-panel__indicator { background: #718391; box-shadow: 0 0 0 1px #718391; }
.status-panel__item.is-delayed :deep(.el-tag) { background: #72581b; }
.status-panel__item.is-offline :deep(.el-tag),
.status-panel__item.is-failed :deep(.el-tag) { background: #7c3030; }
.status-panel__item.is-unknown :deep(.el-tag) { background: #46545e; }

.status-panel__incidents {
  padding: 14px;
}

.status-panel__incidents-title { margin-bottom: 8px; }

.status-panel__incidents article {
  display: flex;
  gap: 10px;
  padding: 9px 0;
  border-top: 1px solid #22313b;
}

.status-panel__incidents article > span {
  color: #efb849;
  font: 700 9px/1.3 ui-monospace, Consolas, monospace;
  text-transform: uppercase;
}

.status-panel__incidents article > span.is-critical { color: #f06464; }
.status-panel__incidents strong { color: #c8d5dd; font-size: 11px; }
.status-panel__incidents p { margin: 3px 0 0; color: #718391; font-size: 10px; line-height: 1.4; }

@media (max-width: 560px) {
  .status-panel__grid { grid-template-columns: 1fr; }
  .status-panel__item { border-right: 0; }
}
</style>
