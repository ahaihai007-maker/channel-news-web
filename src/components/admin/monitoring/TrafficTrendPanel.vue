<script setup>
import { computed, shallowRef } from 'vue'
import BaseTelemetryChart from './BaseTelemetryChart.vue'
import {
  monitoringChartAnimationDuration,
  monitoringChartTheme as chartTheme
} from './monitoringChartTheme.js'

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
    animationDuration: monitoringChartAnimationDuration(),
    aria: { enabled: true, description: '频道流量趋势图' },
    backgroundColor: 'transparent',
    grid: { left: 46, right: 22, top: 52, bottom: 42 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: chartTheme.surface,
      borderColor: chartTheme.border,
      textStyle: { color: chartTheme.ink }
    },
    legend: {
      top: 4,
      right: 8,
      textStyle: { color: chartTheme.muted, fontSize: 10 }
    },
    xAxis: {
      type: 'category',
      data: labels,
      axisLine: { lineStyle: { color: chartTheme.border } },
      axisLabel: { color: chartTheme.muted, fontSize: 10 }
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: chartTheme.grid } },
      axisLabel: { color: chartTheme.muted, fontSize: 10 }
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
          lineStyle: { color: chartTheme.accent, width: 2 },
          itemStyle: { color: chartTheme.accent },
          areaStyle: { color: chartTheme.accentSoft }
        },
        {
          name: '订阅净增',
          type: 'bar',
          data: props.points.map((item) => item.subscriberDelta),
          itemStyle: { color: chartTheme.secondary },
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
          itemStyle: { color: chartTheme.accent },
          barMaxWidth: 20
        },
        {
          name: '发文',
          type: 'line',
          data: props.points.map((item) => item.posts),
          lineStyle: { color: chartTheme.warning, width: 2 },
          itemStyle: { color: chartTheme.warning }
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
        lineStyle: { color: chartTheme.accent, width: 2 },
        itemStyle: { color: chartTheme.accent },
        areaStyle: { color: chartTheme.accentSoft }
      },
      {
        name: '发文',
        type: 'bar',
        data: props.points.map((item) => item.posts),
        itemStyle: { color: chartTheme.secondary },
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
