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

const option = computed(() => ({
  animationDuration: monitoringChartAnimationDuration(),
  backgroundColor: 'transparent',
  aria: { enabled: true, description: 'AI 互动 Token 与模型延迟趋势' },
  grid: { left: 56, right: 58, top: 48, bottom: 42 },
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
  yAxis: [
    {
      type: 'value',
      name: 'TOKEN',
      nameTextStyle: { color: chartTheme.muted, fontSize: 9 },
      splitLine: { lineStyle: { color: chartTheme.grid } },
      axisLabel: { color: chartTheme.muted, fontSize: 10 }
    },
    {
      type: 'value',
      name: 'MS',
      nameTextStyle: { color: chartTheme.muted, fontSize: 9 },
      splitLine: { show: false },
      axisLabel: { color: chartTheme.muted, fontSize: 10 }
    }
  ],
  series: [
    {
      name: '输入 Token',
      type: 'bar',
      stack: 'tokens',
      data: props.points.map((point) => point.promptTokens),
      itemStyle: { color: chartTheme.accent },
      barMaxWidth: 22
    },
    {
      name: '输出 Token',
      type: 'bar',
      stack: 'tokens',
      data: props.points.map((point) => point.completionTokens),
      itemStyle: { color: chartTheme.secondary },
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
      lineStyle: { color: chartTheme.secondary, width: 2 },
      itemStyle: { color: chartTheme.secondary }
    },
    {
      name: 'P95 延迟',
      type: 'line',
      yAxisIndex: 1,
      connectNulls: false,
      symbol: 'none',
      data: props.points.map((point) => point.p95LatencyMs),
      lineStyle: { color: chartTheme.warning, width: 1, type: 'dashed' },
      itemStyle: { color: chartTheme.warning }
    }
  ]
}))
</script>

<template>
  <section class="token-latency telemetry-panel">
    <div class="telemetry-panel__header">
      <div>
        <h2>Token 与延迟</h2>
      </div>
      <span class="token-latency__note">仅统计互动运行记录</span>
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
.token-latency__note { color: var(--monitor-color-muted); font-size: var(--monitor-text-xs); font-weight: 500; }
@media (max-width: 640px) { .token-latency__note { display: none; } }
</style>
