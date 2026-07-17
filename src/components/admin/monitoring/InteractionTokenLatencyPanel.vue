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

const option = computed(() => ({
  animationDuration: 420,
  aria: { enabled: true, description: 'AI 互动 Token 与模型延迟趋势' },
  grid: { left: 56, right: 58, top: 48, bottom: 42 },
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
  yAxis: [
    {
      type: 'value',
      name: 'TOKEN',
      nameTextStyle: { color: '#526977', fontSize: 9 },
      splitLine: { lineStyle: { color: '#1f303b' } },
      axisLabel: { color: '#718391', fontSize: 10 }
    },
    {
      type: 'value',
      name: 'MS',
      nameTextStyle: { color: '#526977', fontSize: 9 },
      splitLine: { show: false },
      axisLabel: { color: '#718391', fontSize: 10 }
    }
  ],
  series: [
    {
      name: '输入 Token',
      type: 'bar',
      stack: 'tokens',
      data: props.points.map((point) => point.promptTokens),
      itemStyle: { color: '#55a6ff' },
      barMaxWidth: 22
    },
    {
      name: '输出 Token',
      type: 'bar',
      stack: 'tokens',
      data: props.points.map((point) => point.completionTokens),
      itemStyle: { color: '#a987ff' },
      barMaxWidth: 22
    },
    {
      name: '平均延迟',
      type: 'line',
      yAxisIndex: 1,
      connectNulls: false,
      smooth: true,
      symbolSize: 4,
      data: props.points.map((point) => point.averageLatencyMs),
      lineStyle: { color: '#2ac6a8', width: 2 },
      itemStyle: { color: '#2ac6a8' }
    },
    {
      name: 'P95 延迟',
      type: 'line',
      yAxisIndex: 1,
      connectNulls: false,
      symbol: 'none',
      data: props.points.map((point) => point.p95LatencyMs),
      lineStyle: { color: '#efb849', width: 1, type: 'dashed' },
      itemStyle: { color: '#efb849' }
    }
  ]
}))
</script>

<template>
  <section class="token-latency telemetry-panel">
    <div class="telemetry-panel__header">
      <div>
        <span class="telemetry-panel__kicker">OPENROUTER LOAD</span>
        <h2>Token 与延迟</h2>
      </div>
      <span class="token-latency__note">TOKEN SOURCE: INTERACTION RUNS ONLY</span>
    </div>
    <BaseTelemetryChart
      :option="option"
      :loading="loading"
      :height="300"
      :empty-text="points.some((point) => point.totalTokens) ? '' : '当前范围没有 Token 使用记录'"
    />
  </section>
</template>

<style scoped>
.telemetry-panel { border: 1px solid #263540; background: #101a22; }
.telemetry-panel__header { display: flex; align-items: center; justify-content: space-between; min-height: 64px; padding: 0 18px; border-bottom: 1px solid #263540; }
.telemetry-panel__kicker,
.token-latency__note { color: #617584; font: 600 9px/1 ui-monospace, Consolas, monospace; letter-spacing: 0.13em; }
.telemetry-panel h2 { margin: 5px 0 0; color: #dce8ef; font-size: 15px; }
@media (max-width: 640px) { .token-latency__note { display: none; } }
</style>
