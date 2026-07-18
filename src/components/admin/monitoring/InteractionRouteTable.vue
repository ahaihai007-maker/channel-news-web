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
        <h2>线路与群组对比</h2>
      </div>
      <span class="telemetry-panel__meta">{{ rows.length }} 个组合</span>
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
            <span>线路 #{{ row.routeId ?? '已删除' }}</span>
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
.identity strong,
.identity span { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.identity strong { color: var(--monitor-color-ink); font-size: var(--monitor-text-xs); }
.identity span { margin-top: var(--monitor-space-2xs); color: var(--monitor-color-muted); font-size: 0.6875rem; }
.numeric { color: var(--monitor-color-ink-soft); font-size: var(--monitor-text-xs); font-weight: 600; font-variant-numeric: tabular-nums; }
.numeric.is-success { color: var(--monitor-color-success); }
.numeric small { color: var(--monitor-color-muted); font-size: 0.6875rem; }
</style>
