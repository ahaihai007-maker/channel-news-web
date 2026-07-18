<script setup>
import { computed } from 'vue'
import BaseTelemetryChart from './BaseTelemetryChart.vue'
import { monitoringChartAnimationDuration, monitoringChartTheme as chartTheme } from './monitoringChartTheme.js'

const props = defineProps({
  points: { type: Array, default: () => [] },
  loading: Boolean,
  granularity: { type: String, default: 'day' }
})

function formatBucket(value) {
  const date = new Date(value)
  const options = props.granularity === 'hour'
    ? { hour: '2-digit', minute: '2-digit', hour12: false }
    : { month: '2-digit', day: '2-digit' }
  return new Intl.DateTimeFormat('zh-CN', options).format(date)
}

const totals = computed(() => props.points.reduce((result, point) => ({
  success: result.success + point.successRuns,
  failed: result.failed + point.failedRuns,
  running: result.running + point.runningRuns,
  replies: result.replies + point.recordedReplies
}), { success: 0, failed: 0, running: 0, replies: 0 }))

const option = computed(() => ({
  animationDuration: monitoringChartAnimationDuration(),
  backgroundColor: 'transparent',
  aria: { enabled: true, description: 'AI 互动执行状态趋势' },
  grid: { left: 46, right: 22, top: 48, bottom: 42 },
  tooltip: {
    trigger: 'axis',
    backgroundColor: chartTheme.surface,
    borderColor: chartTheme.border,
    textStyle: { color: chartTheme.ink }
  },
  legend: { top: 4, right: 8, textStyle: { color: chartTheme.muted, fontSize: 10 } },
  xAxis: {
    type: 'category',
    data: props.points.map((point) => formatBucket(point.timestamp)),
    axisLine: { lineStyle: { color: chartTheme.border } },
    axisLabel: { color: chartTheme.muted, fontSize: 10 }
  },
  yAxis: {
    type: 'value',
    minInterval: 1,
    splitLine: { lineStyle: { color: chartTheme.grid } },
    axisLabel: { color: chartTheme.muted, fontSize: 10 }
  },
  series: [
    {
      name: '模型成功',
      type: 'bar',
      stack: 'runs',
      data: props.points.map((point) => point.successRuns),
      itemStyle: { color: chartTheme.secondary },
      barMaxWidth: 24
    },
    {
      name: '失败',
      type: 'bar',
      stack: 'runs',
      data: props.points.map((point) => point.failedRuns),
      itemStyle: { color: chartTheme.danger },
      barMaxWidth: 24
    },
    {
      name: '运行中',
      type: 'bar',
      stack: 'runs',
      data: props.points.map((point) => point.runningRuns),
      itemStyle: { color: chartTheme.warning },
      barMaxWidth: 24
    },
    {
      name: '已记录回复',
      type: 'line',
      smooth: true,
      symbolSize: 5,
      data: props.points.map((point) => point.recordedReplies),
      lineStyle: { color: chartTheme.accent, width: 2 },
      itemStyle: { color: chartTheme.accent }
    }
  ]
}))
</script>

<template>
  <section class="interaction-trend telemetry-panel">
    <div class="telemetry-panel__header">
      <div>
        <h2>AI 执行趋势</h2>
      </div>
      <div class="interaction-trend__totals">
        <span><b>{{ totals.success }}</b>成功</span>
        <span class="is-failed"><b>{{ totals.failed }}</b>失败</span>
        <span><b>{{ totals.replies }}</b>已回复</span>
      </div>
    </div>
    <BaseTelemetryChart
      :option="option"
      :loading="loading"
      :height="300"
      :empty-text="points.some((point) => point.successRuns || point.failedRuns || point.runningRuns) ? '' : '当前范围没有 AI 执行记录'"
    />
  </section>
</template>

<style scoped>
.interaction-trend__totals { display: flex; gap: var(--monitor-space-sm); color: var(--monitor-color-muted); font-size: 0.6875rem; font-weight: 600; }
.interaction-trend__totals b { margin-right: var(--monitor-space-2xs); color: var(--monitor-color-ink); font-size: var(--monitor-text-xs); }
.interaction-trend__totals .is-failed b { color: var(--monitor-color-danger); }
@media (max-width: 640px) { .interaction-trend__totals span:nth-child(2) { display: none; } }
</style>
