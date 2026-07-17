<script setup>
import { computed } from 'vue'

const props = defineProps({
  services: { type: Array, default: () => [] },
  incidents: { type: Array, default: () => [] }
})

const health = computed(() => {
  const critical = props.incidents.filter((item) => item.severity === 'critical').length
  const warning = props.incidents.filter((item) => item.severity === 'warning').length
  const unknown = props.services.filter((item) => item.status === 'unknown').length
  if (critical > 0) {
    return { status: 'critical', title: '存在严重异常', detail: `${critical} 项严重 / ${warning} 项警告` }
  }
  if (warning > 0) {
    return { status: 'warning', title: '存在运行警告', detail: `${warning} 项需要检查` }
  }
  if (unknown > 0) {
    return { status: 'unknown', title: '监控数据不完整', detail: `${unknown} 个服务尚无心跳` }
  }
  return { status: 'healthy', title: '运行状态正常', detail: '未发现当前异常' }
})
</script>

<template>
  <section class="health-banner" :class="`is-${health.status}`">
    <div class="health-banner__signal"><i /><i /><i /></div>
    <div>
      <span class="health-banner__kicker">GLOBAL STATUS</span>
      <strong>{{ health.title }}</strong>
    </div>
    <span class="health-banner__detail">{{ health.detail }}</span>
  </section>
</template>

<style scoped>
.health-banner {
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 56px;
  padding: 0 18px;
  border: 1px solid #263540;
  border-top: 0;
  color: #dce8ef;
  background: #0d161d;
}

.health-banner__signal {
  display: flex;
  gap: 3px;
  align-items: flex-end;
  width: 24px;
  height: 18px;
}

.health-banner__signal i {
  width: 4px;
  background: #32c787;
}

.health-banner__signal i:nth-child(1) { height: 7px; }
.health-banner__signal i:nth-child(2) { height: 12px; }
.health-banner__signal i:nth-child(3) { height: 18px; }

.health-banner__kicker {
  display: block;
  margin-bottom: 2px;
  color: #617584;
  font: 600 9px/1 ui-monospace, Consolas, monospace;
  letter-spacing: 0.14em;
}

.health-banner strong {
  font-size: 13px;
}

.health-banner__detail {
  margin-left: auto;
  color: #8294a1;
  font-size: 12px;
}

.health-banner.is-critical .health-banner__signal i { background: #f06464; }
.health-banner.is-warning .health-banner__signal i { background: #efb849; }
.health-banner.is-unknown .health-banner__signal i { background: #718391; }

@media (max-width: 560px) {
  .health-banner__detail {
    display: none;
  }
}
</style>
