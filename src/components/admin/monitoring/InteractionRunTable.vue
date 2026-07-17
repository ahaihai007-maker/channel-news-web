<script setup>
const props = defineProps({
  rows: { type: Array, default: () => [] },
  total: { type: Number, default: 0 },
  page: { type: Number, default: 1 },
  pageSize: { type: Number, default: 20 },
  filters: { type: Object, required: true },
  breakdowns: {
    type: Object,
    default: () => ({ statuses: [], triggers: [], modes: [], models: [] })
  },
  loading: Boolean
})

const emit = defineEmits(['update:filters', 'update:page'])

const statusLabels = {
  SUCCESS: '模型成功',
  FAILED: '失败',
  RUNNING: '运行中'
}

const modeLabels = {
  GROUP_DISCUSSION: '群组讨论',
  ARTICLE_DISCUSSION: '文章讨论'
}

const triggerLabels = {
  mention: '提及',
  reply: '回复',
  command: '命令'
}

function updateFilter(key, value) {
  emit('update:filters', { ...props.filters, [key]: value })
}

function formatNumber(value) {
  return value === null || value === undefined ? '—' : Number(value).toLocaleString('zh-CN')
}

function formatTime(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(new Date(value))
}
</script>

<template>
  <section class="interaction-run-table telemetry-panel" data-testid="interaction-run-table">
    <div class="telemetry-panel__header">
      <div>
        <span class="telemetry-panel__kicker">RUN LEDGER</span>
        <h2>最近执行记录</h2>
      </div>
      <span class="telemetry-panel__count">{{ total }} RUNS</span>
    </div>
    <div class="interaction-run-table__filters">
      <el-select :model-value="filters.status" placeholder="全部状态" clearable @update:model-value="updateFilter('status', $event)">
        <el-option v-for="item in breakdowns.statuses" :key="item.key" :label="item.label" :value="item.key" />
      </el-select>
      <el-select :model-value="filters.modelId" placeholder="全部模型" clearable filterable @update:model-value="updateFilter('modelId', $event)">
        <el-option v-for="item in breakdowns.models" :key="item.key" :label="item.label" :value="item.key" />
      </el-select>
      <el-select :model-value="filters.mode" placeholder="全部模式" clearable @update:model-value="updateFilter('mode', $event)">
        <el-option v-for="item in breakdowns.modes" :key="item.key" :label="item.label" :value="item.key" />
      </el-select>
      <el-select :model-value="filters.triggerType" placeholder="全部触发" clearable @update:model-value="updateFilter('triggerType', $event)">
        <el-option v-for="item in breakdowns.triggers" :key="item.key" :label="item.label" :value="item.key" />
      </el-select>
    </div>
    <el-table
      v-loading="loading"
      :data="rows"
      class="telemetry-table"
      row-key="id"
      empty-text="当前筛选没有运行记录"
    >
      <el-table-column label="时间" width="140" fixed="left">
        <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column label="状态" width="94">
        <template #default="{ row }">
          <el-tag :class="`is-${row.status.toLowerCase()}`" size="small" effect="dark">
            {{ statusLabels[row.status] || row.status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="线路" min-width="135" show-overflow-tooltip prop="routeName" />
      <el-table-column label="chatId" min-width="145">
        <template #default="{ row }"><span class="numeric">{{ row.chatId }}</span></template>
      </el-table-column>
      <el-table-column label="文章" min-width="170" show-overflow-tooltip>
        <template #default="{ row }">{{ row.articleTitle || '—' }}</template>
      </el-table-column>
      <el-table-column label="模式" width="98">
        <template #default="{ row }">{{ modeLabels[row.mode] || row.mode }}</template>
      </el-table-column>
      <el-table-column label="触发" width="76">
        <template #default="{ row }">{{ triggerLabels[row.triggerType] || row.triggerType }}</template>
      </el-table-column>
      <el-table-column label="模型" min-width="180" show-overflow-tooltip prop="modelId" />
      <el-table-column label="Token" width="100" align="right">
        <template #default="{ row }"><span class="numeric">{{ formatNumber(row.totalTokens) }}</span></template>
      </el-table-column>
      <el-table-column label="延迟" width="92" align="right">
        <template #default="{ row }"><span class="numeric">{{ formatNumber(row.latencyMs) }}<small v-if="row.latencyMs !== null"> ms</small></span></template>
      </el-table-column>
      <el-table-column label="回复" width="88" align="center">
        <template #default="{ row }">{{ row.replyMessageId ? '已记录' : '—' }}</template>
      </el-table-column>
      <el-table-column label="错误摘要" min-width="220" show-overflow-tooltip>
        <template #default="{ row }"><span class="error-summary">{{ row.errorSummary || '—' }}</span></template>
      </el-table-column>
    </el-table>
    <div class="interaction-run-table__pagination">
      <el-pagination
        background
        layout="total, prev, pager, next"
        :total="total"
        :page-size="pageSize"
        :current-page="page"
        @update:current-page="emit('update:page', $event)"
      />
    </div>
  </section>
</template>

<style scoped>
.telemetry-panel { border: 1px solid #263540; background: #101a22; }
.telemetry-panel__header { display: flex; align-items: center; justify-content: space-between; min-height: 64px; padding: 0 18px; border-bottom: 1px solid #263540; }
.telemetry-panel__kicker,
.telemetry-panel__count { color: #617584; font: 600 9px/1 ui-monospace, Consolas, monospace; letter-spacing: 0.13em; }
.telemetry-panel h2 { margin: 5px 0 0; color: #dce8ef; font-size: 15px; }
.interaction-run-table__filters { display: flex; flex-wrap: wrap; gap: 8px; padding: 12px 16px; border-bottom: 1px solid #263540; background: #0d161d; }
.interaction-run-table__filters :deep(.el-select) { width: 150px; }
.interaction-run-table__filters :deep(.el-input__wrapper) { background: #0b1117; box-shadow: 0 0 0 1px #30424f inset; }
.telemetry-table { --el-table-bg-color: #101a22; --el-table-tr-bg-color: #101a22; --el-table-header-bg-color: #0d161d; --el-table-row-hover-bg-color: #142631; --el-table-border-color: #263540; --el-table-text-color: #a9bac6; --el-table-header-text-color: #718391; width: 100%; }
.numeric { color: #c8d5dd; font: 600 11px/1 ui-monospace, Consolas, monospace; font-variant-numeric: tabular-nums; }
.numeric small { color: #617584; font-size: 9px; }
.error-summary { color: #b88787; }
.interaction-run-table :deep(.el-tag) { border: 0; }
.interaction-run-table :deep(.el-tag.is-success) { background: #1b6b4d; }
.interaction-run-table :deep(.el-tag.is-failed) { background: #7c3030; }
.interaction-run-table :deep(.el-tag.is-running) { background: #72581b; }
.interaction-run-table__pagination { display: flex; justify-content: flex-end; padding: 14px 16px; border-top: 1px solid #263540; }
@media (max-width: 640px) { .interaction-run-table__filters :deep(.el-select) { width: calc(50% - 4px); } }
</style>
