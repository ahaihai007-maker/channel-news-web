<script setup>
import { computed, onMounted, onUnmounted, shallowRef, useTemplateRef, watch } from 'vue'
import { BarChart, LineChart } from 'echarts/charts'
import {
  AriaComponent,
  DataZoomComponent,
  GridComponent,
  LegendComponent,
  TooltipComponent
} from 'echarts/components'
import * as echarts from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([
  LineChart,
  BarChart,
  AriaComponent,
  DataZoomComponent,
  GridComponent,
  LegendComponent,
  TooltipComponent,
  CanvasRenderer
])

const props = defineProps({
  option: { type: Object, required: true },
  height: { type: Number, default: 320 },
  loading: Boolean,
  emptyText: { type: String, default: '' }
})

const chartElement = useTemplateRef('chartElement')
const chart = shallowRef(null)
let resizeObserver = null

const chartStyle = computed(() => ({ height: `${props.height}px` }))

function render() {
  if (!chart.value || props.emptyText) {
    return
  }
  chart.value.setOption(props.option, { notMerge: true })
  if (props.loading) {
    chart.value.showLoading('default', {
      text: '读取遥测数据',
      color: '#55a6ff',
      textColor: '#9fb0bd',
      maskColor: 'rgba(11, 17, 23, 0.72)'
    })
    return
  }
  chart.value.hideLoading()
}

watch(() => props.option, render)
watch(() => props.loading, render)

onMounted(() => {
  if (!chartElement.value) {
    return
  }
  chart.value = echarts.init(chartElement.value, null, { renderer: 'canvas' })
  resizeObserver = new ResizeObserver(() => chart.value?.resize())
  resizeObserver.observe(chartElement.value)
  render()
})

onUnmounted(() => {
  resizeObserver?.disconnect()
  chart.value?.dispose()
  chart.value = null
})
</script>

<template>
  <div class="telemetry-chart" :style="chartStyle">
    <div ref="chartElement" class="telemetry-chart__canvas" />
    <div v-if="emptyText" class="telemetry-chart__empty">
      <span class="telemetry-chart__empty-mark">DATA</span>
      <p>{{ emptyText }}</p>
    </div>
  </div>
</template>

<style scoped>
.telemetry-chart {
  position: relative;
  width: 100%;
  min-height: 240px;
}

.telemetry-chart__canvas {
  width: 100%;
  height: 100%;
}

.telemetry-chart__empty {
  position: absolute;
  inset: 0;
  display: grid;
  place-content: center;
  gap: 8px;
  color: #718391;
  text-align: center;
}

.telemetry-chart__empty-mark {
  font: 600 11px/1 ui-monospace, Consolas, monospace;
  letter-spacing: 0.18em;
  color: #425868;
}

.telemetry-chart__empty p {
  margin: 0;
  font-size: 13px;
}
</style>
