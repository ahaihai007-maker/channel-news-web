<script setup>
import { computed } from 'vue'

const props = defineProps({
  service: { type: Object, default: null },
  summary: { type: Object, default: null },
  loading: Boolean
})

const serviceLabels = {
  healthy: '进程正常',
  delayed: '心跳延迟',
  offline: '进程离线',
  failed: '进程失败',
  unknown: '状态未知'
}

const executionLabels = {
  healthy: '区间执行正常',
  degraded: '区间存在失败',
  failed: '存在超时运行',
  running: '请求执行中',
  no_activity: '区间无活动'
}

const executionStatus = computed(() => props.summary?.executionStatus || 'no_activity')

function formatTime(value) {
  if (!value) {
    return '—'
  }
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(new Date(value))
}
</script>

<template>
  <section class="interaction-health" data-testid="interaction-health-banner">
    <div class="interaction-health__block">
      <span class="interaction-health__label">BOT HEARTBEAT</span>
      <strong :class="`is-${service?.status || 'unknown'}`">
        <i />{{ serviceLabels[service?.status] || serviceLabels.unknown }}
      </strong>
      <small>最后心跳 {{ formatTime(service?.lastSeenAt) }}</small>
    </div>
    <div class="interaction-health__block">
      <span class="interaction-health__label">EXECUTION WINDOW</span>
      <strong :class="`is-${executionStatus}`">
        <i />{{ executionLabels[executionStatus] }}
      </strong>
      <small>最近执行 {{ formatTime(summary?.lastRunAt) }}</small>
    </div>
    <div class="interaction-health__signals">
      <span><b>{{ summary?.runningRuns ?? 0 }}</b> RUNNING</span>
      <span :class="{ 'is-danger': (summary?.stuckRuns || 0) > 0 }">
        <b>{{ summary?.stuckRuns ?? 0 }}</b> STUCK &gt; 5M
      </span>
      <span><b>{{ summary?.failedRuns ?? 0 }}</b> FAILED</span>
    </div>
    <div v-if="loading" class="interaction-health__scan" />
  </section>
</template>

<style scoped>
.interaction-health {
  position: relative;
  display: grid;
  grid-template-columns: minmax(220px, 1fr) minmax(220px, 1fr) auto;
  border: 1px solid #263540;
  border-top: 0;
  background: #0d161d;
  overflow: hidden;
}

.interaction-health__block,
.interaction-health__signals {
  min-height: 82px;
  padding: 15px 18px;
  border-right: 1px solid #263540;
  box-sizing: border-box;
}

.interaction-health__label {
  display: block;
  color: #526977;
  font: 600 9px/1 ui-monospace, Consolas, monospace;
  letter-spacing: 0.14em;
}

.interaction-health strong {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 8px 0 7px;
  color: #dce8ef;
  font-size: 13px;
}

.interaction-health strong i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #32c787;
}

.interaction-health strong.is-delayed i,
.interaction-health strong.is-degraded i,
.interaction-health strong.is-running i {
  background: #efb849;
}

.interaction-health strong.is-offline i,
.interaction-health strong.is-failed i {
  background: #f06464;
}

.interaction-health strong.is-unknown i,
.interaction-health strong.is-no_activity i {
  background: #718391;
}

.interaction-health small {
  color: #617584;
  font: 500 10px/1 ui-monospace, Consolas, monospace;
}

.interaction-health__signals {
  display: flex;
  align-items: center;
  gap: 20px;
  border-right: 0;
}

.interaction-health__signals span {
  color: #617584;
  font: 600 9px/1.4 ui-monospace, Consolas, monospace;
  white-space: nowrap;
}

.interaction-health__signals b {
  display: block;
  margin-bottom: 4px;
  color: #dce8ef;
  font-size: 17px;
}

.interaction-health__signals .is-danger b {
  color: #f06464;
}

.interaction-health__scan {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, #2ac6a8, transparent);
  animation: health-scan 1.2s linear infinite;
}

@keyframes health-scan {
  from { transform: translateX(-100%); }
  to { transform: translateX(100%); }
}

@media (max-width: 980px) {
  .interaction-health {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .interaction-health__signals {
    grid-column: span 2;
    border-top: 1px solid #263540;
  }
}

@media (max-width: 620px) {
  .interaction-health {
    grid-template-columns: 1fr;
  }

  .interaction-health__block,
  .interaction-health__signals {
    grid-column: span 1;
    border-right: 0;
    border-bottom: 1px solid #263540;
  }

  .interaction-health__signals {
    justify-content: space-between;
    gap: 8px;
  }
}
</style>
