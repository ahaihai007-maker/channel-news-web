<script setup>
import { computed } from 'vue'
import BaseTelemetryChart from './BaseTelemetryChart.vue'

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
  animationDuration: 420,
  aria: { enabled: true, description: 'AI 互动执行状态趋势' },
  grid: { left: 46, right: 22, top: 48, bottom: 42 },
  tooltip: {
    trigger: 'axis',
    backgroundColor: '#101a22',
    borderColor: '#30424f',
    textStyle: { color: '#dce8ef' }
  },
  legend: { top: 4, right: 8, textStyle: { color: '#8294a1', fontSize: 10 } },
  xAxis: {
    type: 'category',
    data: props.points.map((point) => formatBucket(point.timestamp)),
    axisLine: { lineStyle: { color: '#30424f' } },
    axisLabel: { color: '#718391', fontSize: 10 }
  },
  yAxis: {
    type: 'value',
    minInterval: 1,
    splitLine: { lineStyle: { color: '#1f303b' } },
    axisLabel: { color: '#718391', fontSize: 10 }
  },
  series: [
    {
      name: '模型成功',
      type: 'bar',
      stack: 'runs',
      data: props.points.map((point) => point.successRuns),
      itemStyle: { color: '#2ac6a8' },
      barMaxWidth: 24
    },
    {
      name: '失败',
      type: 'bar',
      stack: 'runs',
      data: props.points.map((point) => point.failedRuns),
      itemStyle: { color: '#f06464' },
      barMaxWidth: 24
    },
    {
      name: '运行中',
      type: 'bar',
      stack: 'runs',
      data: props.points.map((point) => point.runningRuns),
      itemStyle: { color: '#efb849' },
      barMaxWidth: 24
    },
    {
      name: '已记录回复',
      type: 'line',
      smooth: true,
      symbolSize: 5,
      data: props.points.map((point) => point.recordedReplies),
      lineStyle: { color: '#55a6ff', width: 2 },
      itemStyle: { color: '#55a6ff' }
    }
  ]
}))
</script>

<template>
  <section class="interaction-trend telemetry-panel">
    <div class="telemetry-panel__header">
      <div>
        <span class="telemetry-panel__kicker">EXECUTION STREAM</span>
        <h2>AI 执行趋势</h2>
      </div>
      <div class="interaction-trend__totals">
        <span><b>{{ totals.success }}</b> SUCCESS</span>
        <span class="is-failed"><b>{{ totals.failed }}</b> FAILED</span>
        <span><b>{{ totals.replies }}</b> REPLIED</span>
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
.telemetry-panel { border: 1px solid #263540; background: #101a22; }
.telemetry-panel__header { display: flex; align-items: center; justify-content: space-between; min-height: 64px; padding: 0 18px; border-bottom: 1px solid #263540; }
.telemetry-panel__kicker { color: #617584; font: 600 9px/1 ui-monospace, Consolas, monospace; letter-spacing: 0.13em; }
.telemetry-panel h2 { margin: 5px 0 0; color: #dce8ef; font-size: 15px; }
.interaction-trend__totals { display: flex; gap: 14px; color: #617584; font: 600 9px/1 ui-monospace, Consolas, monospace; }
.interaction-trend__totals b { margin-right: 3px; color: #dce8ef; font-size: 12px; }
.interaction-trend__totals .is-failed b { color: #f06464; }
@media (max-width: 640px) { .interaction-trend__totals span:nth-child(2) { display: none; } }
</style>
