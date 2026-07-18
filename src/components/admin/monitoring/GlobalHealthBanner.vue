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
  <section
    class="health-banner"
    :class="`is-${health.status}`"
    role="status"
    aria-live="polite"
  >
    <i class="health-banner__signal" aria-hidden="true" />
    <div class="health-banner__copy">
      <strong>{{ health.title }}</strong>
      <span class="health-banner__detail">{{ health.detail }}</span>
    </div>
  </section>
</template>

<style scoped>
.health-banner {
  display: flex;
  align-items: center;
  gap: var(--monitor-space-sm);
  min-height: 3.5rem;
  margin-block-start: var(--monitor-space-sm);
  padding: var(--monitor-space-sm) var(--monitor-space-md);
  border: var(--monitor-rule);
  border-radius: var(--monitor-radius-control);
  color: var(--monitor-color-ink-soft);
  background: var(--monitor-color-success-soft);
}

.health-banner__signal {
  width: 0.5rem;
  height: 0.5rem;
  flex: 0 0 auto;
  border-radius: 50%;
  background: var(--monitor-color-success);
}

.health-banner strong {
  color: var(--monitor-color-ink);
  font-size: var(--monitor-text-sm);
  font-weight: 700;
}

.health-banner__detail {
  margin-inline-start: var(--monitor-space-xs);
  color: var(--monitor-color-muted);
  font-size: var(--monitor-text-xs);
}

.health-banner.is-critical { background: var(--monitor-color-danger-soft); }
.health-banner.is-warning { background: var(--monitor-color-warning-soft); }
.health-banner.is-unknown { background: var(--monitor-color-surface-subtle); }
.health-banner.is-critical .health-banner__signal { background: var(--monitor-color-danger); }
.health-banner.is-warning .health-banner__signal { background: var(--monitor-color-warning); }
.health-banner.is-unknown .health-banner__signal { background: var(--monitor-color-faint); }

@media (max-width: 35rem) {
  .health-banner__copy {
    display: flex;
    flex-direction: column;
    gap: var(--monitor-space-2xs);
  }

  .health-banner__detail {
    margin-inline-start: 0;
  }
}
</style>
