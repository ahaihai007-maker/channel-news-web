<script setup>
defineProps({
  rows: { type: Array, default: () => [] },
  loading: Boolean
})

function formatNumber(value) {
  return value === null || value === undefined ? '—' : Number(value).toLocaleString('zh-CN')
}

function formatRate(value) {
  return value === null || value === undefined ? '—' : `${value}%`
}

function formatTime(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(new Date(value))
}

function routeRowKey(row) {
  return `${row.routeId ?? 'removed'}:${row.chatId}:${row.modelId}`
}
</script>

<template>
  <section class="interaction-route-table telemetry-panel">
    <div class="telemetry-panel__header">
      <div>
        <span class="telemetry-panel__kicker">ROUTE MATRIX</span>
        <h2>线路与群组对比</h2>
      </div>
      <span class="telemetry-panel__count">{{ rows.length }} ROUTE / CHAT / MODEL</span>
    </div>
    <el-table
      v-loading="loading"
      :data="rows"
      class="telemetry-table"
      :row-key="routeRowKey"
      empty-text="当前范围没有线路执行记录"
    >
      <el-table-column label="线路" min-width="150" fixed="left">
        <template #default="{ row }">
          <div class="identity">
            <strong>{{ row.routeName }}</strong>
            <span>ROUTE {{ row.routeId ?? 'REMOVED' }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="chatId" min-width="145">
        <template #default="{ row }"><span class="numeric">{{ row.chatId }}</span></template>
      </el-table-column>
      <el-table-column label="模型" min-width="190" show-overflow-tooltip prop="modelId" />
      <el-table-column label="执行" width="76" align="right" sortable prop="totalRuns" />
      <el-table-column label="成功率" width="96" align="right">
        <template #default="{ row }"><span class="numeric is-success">{{ formatRate(row.successRate) }}</span></template>
      </el-table-column>
      <el-table-column label="已记录回复" width="100" align="right" prop="recordedReplies" />
      <el-table-column label="Token" width="110" align="right">
        <template #default="{ row }"><span class="numeric">{{ formatNumber(row.totalTokens) }}</span></template>
      </el-table-column>
      <el-table-column label="平均延迟" width="100" align="right">
        <template #default="{ row }"><span class="numeric">{{ formatNumber(row.averageLatencyMs) }}<small v-if="row.averageLatencyMs !== null"> ms</small></span></template>
      </el-table-column>
      <el-table-column label="P95" width="92" align="right">
        <template #default="{ row }"><span class="numeric">{{ formatNumber(row.p95LatencyMs) }}<small v-if="row.p95LatencyMs !== null"> ms</small></span></template>
      </el-table-column>
      <el-table-column label="最近执行" width="130">
        <template #default="{ row }">{{ formatTime(row.lastRunAt) }}</template>
      </el-table-column>
    </el-table>
  </section>
</template>

<style scoped>
.telemetry-panel { border: 1px solid #263540; background: #101a22; }
.telemetry-panel__header { display: flex; align-items: center; justify-content: space-between; min-height: 64px; padding: 0 18px; border-bottom: 1px solid #263540; }
.telemetry-panel__kicker,
.telemetry-panel__count { color: #617584; font: 600 9px/1 ui-monospace, Consolas, monospace; letter-spacing: 0.13em; }
.telemetry-panel h2 { margin: 5px 0 0; color: #dce8ef; font-size: 15px; }
.telemetry-table { --el-table-bg-color: #101a22; --el-table-tr-bg-color: #101a22; --el-table-header-bg-color: #0d161d; --el-table-row-hover-bg-color: #142631; --el-table-border-color: #263540; --el-table-text-color: #a9bac6; --el-table-header-text-color: #718391; width: 100%; }
.identity strong,
.identity span { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.identity strong { color: #dce8ef; font-size: 12px; }
.identity span { margin-top: 3px; color: #617584; font: 500 9px/1 ui-monospace, Consolas, monospace; }
.numeric { color: #c8d5dd; font: 600 11px/1 ui-monospace, Consolas, monospace; font-variant-numeric: tabular-nums; }
.numeric.is-success { color: #2ac6a8; }
.numeric small { color: #617584; font-size: 9px; }
</style>
