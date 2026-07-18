<script setup>
import { computed } from 'vue'

const props = defineProps({
  breakdowns: {
    type: Object,
    default: () => ({ statuses: [], triggers: [], modes: [], models: [] })
  },
  loading: Boolean
})

const sections = computed(() => [
  { key: 'triggers', title: '触发方式', items: props.breakdowns.triggers || [] },
  { key: 'modes', title: '讨论模式', items: props.breakdowns.modes || [] },
  { key: 'models', title: '模型分布', items: props.breakdowns.models || [] }
].map((section) => ({
  ...section,
  max: Math.max(...section.items.map((item) => item.value), 1)
})))
</script>

<template>
  <section v-loading="loading" class="interaction-breakdown telemetry-panel">
    <div class="telemetry-panel__header">
      <div>
        <h2>触发与场景分布</h2>
      </div>
    </div>
    <div class="interaction-breakdown__body">
      <div v-for="section in sections" :key="section.key" class="interaction-breakdown__section">
        <h3>{{ section.title }}</h3>
        <div v-if="section.items.length" class="interaction-breakdown__items">
          <div v-for="item in section.items" :key="item.key" class="interaction-breakdown__item">
            <div class="interaction-breakdown__line">
              <span :title="item.label">{{ item.label }}</span>
              <b>{{ item.value }}</b>
            </div>
            <div class="interaction-breakdown__track">
              <i :style="{ width: `${(item.value / section.max) * 100}%` }" />
            </div>
          </div>
        </div>
        <p v-else>暂无数据</p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.interaction-breakdown__body { display: grid; gap: var(--monitor-space-md); padding: var(--monitor-space-md); }
.interaction-breakdown__section h3 { margin: 0 0 var(--monitor-space-sm); color: var(--monitor-color-ink-soft); font-size: var(--monitor-text-xs); font-weight: 700; }
.interaction-breakdown__items { display: grid; gap: var(--monitor-space-xs); }
.interaction-breakdown__line { display: flex; justify-content: space-between; gap: var(--monitor-space-xs); color: var(--monitor-color-muted); font-size: 0.6875rem; }
.interaction-breakdown__line span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.interaction-breakdown__line b { color: var(--monitor-color-ink); font-size: var(--monitor-text-xs); font-weight: 700; font-variant-numeric: tabular-nums; }
.interaction-breakdown__track { height: 0.25rem; overflow: hidden; border-radius: 999px; background: var(--monitor-color-surface-subtle); }
.interaction-breakdown__track i { display: block; height: 100%; border-radius: inherit; background: var(--monitor-color-accent); }
.interaction-breakdown__section p { margin: 0; color: var(--monitor-color-faint); font-size: var(--monitor-text-xs); }
</style>
