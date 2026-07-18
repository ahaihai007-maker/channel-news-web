<script setup>
import { computed } from 'vue'
import BaseTelemetryChart from './BaseTelemetryChart.vue'
import {
  monitoringChartAnimationDuration,
  monitoringChartTheme as chartTheme
} from './monitoringChartTheme.js'

const props = defineProps({
  points: { type: Array, default: () => [] },
  loading: Boolean
})

const totals = computed(() => props.points.reduce((summary, point) => ({
  prompt: summary.prompt + point.promptTokens,
  completion: summary.completion + point.completionTokens,
  total: summary.total + point.totalTokens,
  calls: summary.calls + point.calls,
  failures: summary.failures + point.failures
}), { prompt: 0, completion: 0, total: 0, calls: 0, failures: 0 }))

const option = computed(() => ({
  animationDuration: monitoringChartAnimationDuration(),
  aria: { enabled: true, description: 'OpenRouter Token 使用趋势' },
  grid: { left: 50, right: 20, top: 48, bottom: 42 },
  tooltip: {
    trigger: 'axis',
    backgroundColor: chartTheme.surface,
    borderColor: chartTheme.border,
    textStyle: { color: chartTheme.ink }
  },
  legend: { top: 4, right: 8, textStyle: { color: chartTheme.muted, fontSize: 10 } },
  xAxis: {
    type: 'category',
    data: props.points.map((item) => item.date.slice(5)),
    axisLine: { lineStyle: { color: chartTheme.border } },
    axisLabel: { color: chartTheme.muted, fontSize: 10 }
  },
  yAxis: {
    type: 'value',
    splitLine: { lineStyle: { color: chartTheme.grid } },
    axisLabel: { color: chartTheme.muted, fontSize: 10 }
  },
  series: [
    {
      name: '输入 Token',
      type: 'bar',
      stack: 'tokens',
      data: props.points.map((item) => item.promptTokens),
      itemStyle: { color: chartTheme.accent },
      barMaxWidth: 22
    },
    {
      name: '输出 Token',
      type: 'bar',
      stack: 'tokens',
      data: props.points.map((item) => item.completionTokens),
      itemStyle: { color: chartTheme.secondary },
      barMaxWidth: 22
    }
  ]
}))
</script>

<template>
  <section class="token-panel telemetry-panel">
    <div class="telemetry-panel__header">
      <div>
        <h2>Token 运行图</h2>
      </div>
      <div class="token-panel__totals">
        <span><b>{{ totals.total.toLocaleString() }}</b>总计</span>
        <span><b>{{ totals.calls.toLocaleString() }}</b>调用</span>
        <span class="is-failed"><b>{{ totals.failures.toLocaleString() }}</b>失败</span>
      </div>
    </div>
    <BaseTelemetryChart
      :option="option"
      :loading="loading"
      :height="286"
      :empty-text="points.length ? '' : '当前范围没有 AI 调用记录'"
    />
  </section>
</template>

<style scoped>
.token-panel__totals { display: flex; gap: var(--monitor-space-sm); color: var(--monitor-color-muted); font-size: var(--monitor-text-xs); white-space: nowrap; }
.token-panel__totals b { margin-inline-end: var(--monitor-space-2xs); color: var(--monitor-color-ink); font-family: var(--monitor-font-display); font-size: var(--monitor-text-sm); font-variant-numeric: tabular-nums; }
.token-panel__totals .is-failed b { color: var(--monitor-color-danger); }
@media (max-width: 40rem) { .token-panel__totals span:not(:first-child) { display: none; } }
</style>
