<script setup>
defineProps({
  modelValue: { type: String, required: true }
})

const emit = defineEmits(['update:modelValue'])
</script>

<template>
  <nav class="monitor-tabs" aria-label="监控视图" data-testid="monitor-view-tabs">
    <button
      type="button"
      class="monitor-tabs__item"
      :class="{ 'is-active': modelValue === 'channel' }"
      data-testid="channel-monitor-tab"
      @click="emit('update:modelValue', 'channel')"
    >
      频道流量
    </button>
    <button
      type="button"
      class="monitor-tabs__item"
      :class="{ 'is-active': modelValue === 'interaction' }"
      data-testid="interaction-monitor-tab"
      @click="emit('update:modelValue', 'interaction')"
    >
      AI 互动
    </button>
  </nav>
</template>

<style scoped>
.monitor-tabs {
  display: flex;
  align-items: center;
  gap: var(--monitor-space-lg);
  min-height: 3rem;
  margin-block-end: var(--monitor-space-lg);
  border-bottom: var(--monitor-rule);
}

.monitor-tabs__item {
  position: relative;
  min-width: 0;
  min-height: 2.75rem;
  padding: 0;
  border: 0;
  color: var(--monitor-color-muted);
  background: transparent;
  font-family: var(--monitor-font-body);
  font-size: var(--monitor-text-sm);
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  transition: color var(--monitor-dur-short) var(--monitor-ease-out);
}

.monitor-tabs__item::after {
  position: absolute;
  right: 0;
  bottom: -0.0625rem;
  left: 0;
  height: 0.125rem;
  background: var(--monitor-color-accent);
  content: '';
  opacity: 0;
}

.monitor-tabs__item.is-active {
  color: var(--monitor-color-ink);
}

.monitor-tabs__item:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.monitor-tabs__item.is-active::after {
  opacity: 1;
}

@media (hover: hover) and (pointer: fine) {
  .monitor-tabs__item:hover {
    color: var(--monitor-color-accent-strong);
  }
}

@media (max-width: 35rem) {
  .monitor-tabs {
    gap: var(--monitor-space-md);
  }

  .monitor-tabs__item {
    flex: 1;
  }
}
</style>
