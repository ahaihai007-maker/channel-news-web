<script setup>
import { computed } from 'vue'
import BaseTelemetryChart from './BaseTelemetryChart.vue'

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
  animationDuration: 420,
  aria: { enabled: true, description: 'OpenRouter Token 使用趋势' },
  grid: { left: 50, right: 20, top: 48, bottom: 42 },
  tooltip: {
    trigger: 'axis',
    backgroundColor: '#101a22',
    borderColor: '#30424f',
    textStyle: { color: '#dce8ef' }
  },
  legend: { top: 4, right: 8, textStyle: { color: '#8294a1', fontSize: 10 } },
  xAxis: {
    type: 'category',
    data: props.points.map((item) => item.date.slice(5)),
    axisLine: { lineStyle: { color: '#30424f' } },
    axisLabel: { color: '#718391', fontSize: 10 }
  },
  yAxis: {
    type: 'value',
    splitLine: { lineStyle: { color: '#1f303b' } },
    axisLabel: { color: '#718391', fontSize: 10 }
  },
  series: [
    {
      name: '输入 Token',
      type: 'bar',
      stack: 'tokens',
      data: props.points.map((item) => item.promptTokens),
      itemStyle: { color: '#55a6ff' },
      barMaxWidth: 22
    },
    {
      name: '输出 Token',
      type: 'bar',
      stack: 'tokens',
      data: props.points.map((item) => item.completionTokens),
      itemStyle: { color: '#a987ff' },
      barMaxWidth: 22
    }
  ]
}))
</script>

<template>
  <section class="token-panel telemetry-panel">
    <div class="telemetry-panel__header">
      <div>
        <span class="telemetry-panel__kicker">OPENROUTER</span>
        <h2>Token 运行图</h2>
      </div>
      <div class="token-panel__totals">
        <span><b>{{ totals.total.toLocaleString() }}</b> TOTAL</span>
        <span><b>{{ totals.calls.toLocaleString() }}</b> CALLS</span>
        <span class="is-failed"><b>{{ totals.failures.toLocaleString() }}</b> FAILED</span>
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
.telemetry-panel { border: 1px solid #263540; background: #101a22; }
.telemetry-panel__header { display: flex; align-items: center; justify-content: space-between; min-height: 64px; padding: 0 18px; border-bottom: 1px solid #263540; }
.telemetry-panel__kicker { color: #617584; font: 600 9px/1 ui-monospace, Consolas, monospace; letter-spacing: 0.13em; }
.telemetry-panel h2 { margin: 5px 0 0; color: #dce8ef; font-size: 15px; }
.token-panel__totals { display: flex; gap: 14px; color: #617584; font: 600 9px/1 ui-monospace, Consolas, monospace; }
.token-panel__totals b { margin-right: 3px; color: #dce8ef; font-size: 12px; }
.token-panel__totals .is-failed b { color: #f06464; }
@media (max-width: 640px) { .token-panel__totals span:not(:first-child) { display: none; } }
</style>
