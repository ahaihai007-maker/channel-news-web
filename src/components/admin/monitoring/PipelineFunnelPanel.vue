<script setup>
const props = defineProps({
  stages: { type: Array, default: () => [] },
  loading: Boolean
})
</script>

<template>
  <section class="funnel-panel telemetry-panel">
    <div class="telemetry-panel__header">
      <div>
        <h2>自动化处理链</h2>
      </div>
      <span class="telemetry-panel__meta">{{ stages.length }} 个阶段</span>
    </div>
    <el-skeleton v-if="loading && !stages.length" :rows="4" animated />
    <div v-else class="funnel-panel__flow">
      <article v-for="(stage, index) in stages" :key="stage.key" class="funnel-panel__stage">
        <span class="funnel-panel__index">{{ index + 1 }}</span>
        <div>
          <strong>{{ stage.value.toLocaleString() }}</strong>
          <span>{{ stage.label }}</span>
        </div>
        <em v-if="stage.rate !== null">{{ stage.rate }}%</em>
      </article>
    </div>
    <p class="funnel-panel__note">统计选定时段内的频道采集文章；阶段数量按当前持久化状态计算。</p>
  </section>
</template>

<style scoped>
.funnel-panel__flow { padding: var(--monitor-space-sm) var(--monitor-space-md) var(--monitor-space-3xs); }
.funnel-panel__stage { position: relative; display: grid; grid-template-columns: 2rem minmax(0, 1fr) auto; align-items: center; min-height: 3.5rem; border-block-end: var(--monitor-rule); }
.funnel-panel__stage::before { content: ''; position: absolute; inset-inline-start: 0.75rem; bottom: -0.5625rem; width: 1px; height: 1.125rem; background: var(--monitor-color-rule-strong); }
.funnel-panel__stage:last-child::before { display: none; }
.funnel-panel__index { color: var(--monitor-color-accent-strong); font-family: var(--monitor-font-body); font-size: var(--monitor-text-xs); font-weight: 600; }
.funnel-panel__stage strong,
.funnel-panel__stage span { display: block; }
.funnel-panel__stage strong { color: var(--monitor-color-ink); font-family: var(--monitor-font-display); font-size: 1.125rem; font-weight: 700; line-height: 1; font-variant-numeric: tabular-nums; }
.funnel-panel__stage div span { margin-block-start: var(--monitor-space-2xs); color: var(--monitor-color-muted); font-size: var(--monitor-text-xs); }
.funnel-panel__stage em { color: var(--monitor-color-success); font-family: var(--monitor-font-body); font-size: var(--monitor-text-xs); font-style: normal; font-weight: 600; }
.funnel-panel__note { margin: var(--monitor-space-sm) var(--monitor-space-md) var(--monitor-space-md); color: var(--monitor-color-muted); font-size: var(--monitor-text-xs); line-height: 1.5; }
</style>
