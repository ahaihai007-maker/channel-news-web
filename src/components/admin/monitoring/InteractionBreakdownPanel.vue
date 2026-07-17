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
        <span class="telemetry-panel__kicker">REQUEST SHAPE</span>
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
        <p v-else>NO DATA</p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.telemetry-panel { border: 1px solid #263540; background: #101a22; }
.telemetry-panel__header { display: flex; align-items: center; min-height: 64px; padding: 0 18px; border-bottom: 1px solid #263540; }
.telemetry-panel__kicker { color: #617584; font: 600 9px/1 ui-monospace, Consolas, monospace; letter-spacing: 0.13em; }
.telemetry-panel h2 { margin: 5px 0 0; color: #dce8ef; font-size: 15px; }
.interaction-breakdown__body { display: grid; gap: 16px; padding: 16px 18px 18px; }
.interaction-breakdown__section h3 { margin: 0 0 10px; color: #718391; font: 600 10px/1 ui-monospace, Consolas, monospace; letter-spacing: 0.08em; }
.interaction-breakdown__items { display: grid; gap: 8px; }
.interaction-breakdown__line { display: flex; justify-content: space-between; gap: 8px; color: #91a3af; font-size: 11px; }
.interaction-breakdown__line span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.interaction-breakdown__line b { color: #dce8ef; font: 600 10px/1 ui-monospace, Consolas, monospace; }
.interaction-breakdown__track { height: 4px; background: #1d2a33; overflow: hidden; }
.interaction-breakdown__track i { display: block; height: 100%; background: linear-gradient(90deg, #2ac6a8, #55a6ff); }
.interaction-breakdown__section p { margin: 0; color: #425868; font: 600 10px/1 ui-monospace, Consolas, monospace; }
</style>
