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
      <span>01</span>
      频道流量
    </button>
    <button
      type="button"
      class="monitor-tabs__item"
      :class="{ 'is-active': modelValue === 'interaction' }"
      data-testid="interaction-monitor-tab"
      @click="emit('update:modelValue', 'interaction')"
    >
      <span>02</span>
      AI 互动
    </button>
    <div class="monitor-tabs__line" />
  </nav>
</template>

<style scoped>
.monitor-tabs {
  position: relative;
  display: flex;
  align-items: stretch;
  min-height: 48px;
  margin-bottom: 10px;
  border: 1px solid #263540;
  background: #0d161d;
}

.monitor-tabs__item {
  position: relative;
  min-width: 168px;
  padding: 0 24px;
  border: 0;
  border-right: 1px solid #263540;
  color: #718391;
  background: transparent;
  font: 650 13px/1 'Microsoft YaHei UI', 'PingFang SC', sans-serif;
  cursor: pointer;
  transition: color 160ms ease, background-color 160ms ease;
}

.monitor-tabs__item span {
  margin-right: 8px;
  color: #425868;
  font: 600 9px/1 ui-monospace, Consolas, monospace;
}

.monitor-tabs__item::after {
  position: absolute;
  right: 0;
  bottom: -1px;
  left: 0;
  height: 2px;
  background: #55a6ff;
  content: '';
  opacity: 0;
}

.monitor-tabs__item:hover {
  color: #c8d5dd;
  background: #101d26;
}

.monitor-tabs__item.is-active {
  color: #edf7ff;
  background: #13232e;
}

.monitor-tabs__item.is-active span {
  color: #55a6ff;
}

.monitor-tabs__item.is-active::after {
  opacity: 1;
}

.monitor-tabs__line {
  flex: 1;
  background:
    repeating-linear-gradient(
      90deg,
      transparent 0,
      transparent 23px,
      rgba(85, 166, 255, 0.07) 24px
    );
}

@media (max-width: 560px) {
  .monitor-tabs__item {
    min-width: 0;
    flex: 1;
    padding: 0 12px;
  }

  .monitor-tabs__line {
    display: none;
  }
}
</style>
