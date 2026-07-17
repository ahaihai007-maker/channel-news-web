<script setup>
import { computed, shallowRef } from 'vue'
import BaseTelemetryChart from './BaseTelemetryChart.vue'

const props = defineProps({
  points: { type: Array, default: () => [] },
  loading: Boolean
})

const mode = shallowRef('traffic')

const hasTrafficData = computed(() => props.points.some((item) =>
  item.viewDelta !== null || item.subscriberDelta !== null || item.interactionDelta !== null
))

const emptyText = computed(() => hasTrafficData.value
  ? ''
  : '等待至少两次 Telegram 快照后生成流量增量趋势'
)

const option = computed(() => {
  const labels = props.points.map((item) => item.date.slice(5))
  const common = {
    animationDuration: 420,
    aria: { enabled: true, description: '频道流量趋势图' },
    backgroundColor: 'transparent',
    grid: { left: 46, right: 22, top: 52, bottom: 42 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#101a22',
      borderColor: '#30424f',
      textStyle: { color: '#dce8ef' }
    },
    legend: {
      top: 4,
      right: 8,
      textStyle: { color: '#8294a1', fontSize: 10 }
    },
    xAxis: {
      type: 'category',
      data: labels,
      axisLine: { lineStyle: { color: '#30424f' } },
      axisLabel: { color: '#718391', fontSize: 10 }
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: '#1f303b' } },
      axisLabel: { color: '#718391', fontSize: 10 }
    }
  }
  if (mode.value === 'subscribers') {
    return {
      ...common,
      series: [
        {
          name: '订阅人数',
          type: 'line',
          smooth: true,
          showSymbol: false,
          data: props.points.map((item) => item.subscribers),
          lineStyle: { color: '#55a6ff', width: 2 },
          itemStyle: { color: '#55a6ff' },
          areaStyle: { color: 'rgba(85, 166, 255, 0.12)' }
        },
        {
          name: '订阅净增',
          type: 'bar',
          data: props.points.map((item) => item.subscriberDelta),
          itemStyle: { color: '#2ac6a8' },
          barMaxWidth: 18
        }
      ]
    }
  }
  if (mode.value === 'engagement') {
    return {
      ...common,
      series: [
        {
          name: '互动增量',
          type: 'bar',
          data: props.points.map((item) => item.interactionDelta),
          itemStyle: { color: '#a987ff' },
          barMaxWidth: 20
        },
        {
          name: '发文',
          type: 'line',
          data: props.points.map((item) => item.posts),
          lineStyle: { color: '#efb849', width: 2 },
          itemStyle: { color: '#efb849' }
        }
      ]
    }
  }
  return {
    ...common,
    series: [
      {
        name: '新增浏览',
        type: 'line',
        smooth: true,
        showSymbol: false,
        data: props.points.map((item) => item.viewDelta),
        lineStyle: { color: '#55a6ff', width: 2 },
        itemStyle: { color: '#55a6ff' },
        areaStyle: { color: 'rgba(85, 166, 255, 0.16)' }
      },
      {
        name: '发文',
        type: 'bar',
        data: props.points.map((item) => item.posts),
        itemStyle: { color: '#2ac6a8' },
        barMaxWidth: 18
      }
    ]
  }
})
</script>

<template>
  <section class="trend-panel telemetry-panel">
    <div class="telemetry-panel__header">
      <div>
        <span class="telemetry-panel__kicker">TRAFFIC DELTA</span>
        <h2>频道流量趋势</h2>
      </div>
      <el-radio-group v-model="mode" size="small">
        <el-radio-button value="traffic">浏览</el-radio-button>
        <el-radio-button value="subscribers">订阅</el-radio-button>
        <el-radio-button value="engagement">互动</el-radio-button>
      </el-radio-group>
    </div>
    <BaseTelemetryChart
      :option="option"
      :loading="loading"
      :empty-text="emptyText"
      :height="330"
    />
  </section>
</template>

<style scoped>
.telemetry-panel { border: 1px solid #263540; background: #101a22; }
.telemetry-panel__header { display: flex; align-items: center; justify-content: space-between; min-height: 64px; padding: 0 18px; border-bottom: 1px solid #263540; }
.telemetry-panel__kicker { color: #617584; font: 600 9px/1 ui-monospace, Consolas, monospace; letter-spacing: 0.13em; }
.telemetry-panel h2 { margin: 5px 0 0; color: #dce8ef; font-size: 15px; }
.trend-panel :deep(.el-radio-button__inner) { border-color: #30424f; background: #0b1117; color: #8294a1; box-shadow: none; }
.trend-panel :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) { border-color: #55a6ff; background: #17334a; color: #e6f3ff; }
@media (max-width: 560px) { .telemetry-panel__header { align-items: flex-start; flex-direction: column; gap: 12px; padding: 14px; } }
</style>
