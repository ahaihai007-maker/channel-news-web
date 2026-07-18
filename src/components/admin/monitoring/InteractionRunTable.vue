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

const requestModeLabels = {
  CASUAL_CHAT: '自然聊天',
  EDITORIAL_SUMMARY: '新闻摘要',
  EDITORIAL_ANALYSIS: '新闻分析',
  FACT_CHECK: '事实核查',
  SOURCE_REQUEST: '来源查询',
  OPINION: '观点讨论',
  PERSONAL_ADVICE: '明确建议',
  FORMAT_REQUEST: '格式调整',
  FOLLOW_UP: '继续追问',
  OPERATIONAL_DETAIL: '操作细节'
}

const replyTypeLabels = {
  TEXT: '文字',
  STICKER: '贴图',
  TEXT_AND_STICKER: '文字 + 贴图'
}

const stickerStatusLabels = {
  NOT_REQUESTED: '未请求贴图',
  SUCCESS: '贴图已发送',
  FALLBACK_TEXT: '已回退文字',
  FAILED: '贴图发送失败',
  PLANNED: '等待发送'
}

const stickerReasonLabels = {
  INFORMATION_REQUIRED: '信息型请求，强制使用文字',
  EXPLICIT_STICKER_REQUEST: '用户明确要求贴图',
  REACTION_ONLY: '仅需简短反应',
  CONTENT_PLUS_REACTION: '文字回答后补充贴图',
  NO_MATCH: '没有语义匹配的贴图',
  STICKER_NOT_ALLOWED: '当前规则不允许贴图',
  SELECTOR_FALLBACK: '选择器异常，已回退文字',
  COOLDOWN_ACTIVE: '同一群组仍在贴图冷却期'
}

function policyState(row) {
  if (row.repairSucceeded) return '已修复'
  if (row.repairAttempted) return '已降级'
  if (row.policyViolationCodes?.length) return '命中规则'
  return '通过'
}

function replyState(row) {
  const replyType = replyTypeLabels[row.replyType] || row.replyType || '文字'
  if (row.replyType === 'TEXT') return `${replyType} · ${row.replyMessageId ? '已记录' : '未记录'}`
  return `${replyType} · ${stickerStatusLabels[row.stickerSendStatus] || row.stickerSendStatus || '状态未知'}`
}

function replyDetail(row) {
  return [
    row.stickerDecisionReason
      ? `决策：${stickerReasonLabels[row.stickerDecisionReason] || row.stickerDecisionReason}`
      : '',
    row.selectedStickerId ? `贴图 ID：${row.selectedStickerId}` : '',
    row.stickerErrorSummary ? `错误：${row.stickerErrorSummary}` : ''
  ].filter(Boolean).join('\n') || '未使用贴图'
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
        <h2>最近执行记录</h2>
      </div>
      <span class="telemetry-panel__meta">{{ total }} 条</span>
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
      <el-table-column label="请求模式" width="108">
        <template #default="{ row }">{{ requestModeLabels[row.requestMode] || row.requestMode || '旧记录' }}</template>
      </el-table-column>
      <el-table-column label="策略" width="92">
        <template #default="{ row }">
          <el-tooltip :content="row.policyViolationCodes?.join(', ') || '未检测到违规'">
            <span>{{ policyState(row) }}</span>
          </el-tooltip>
        </template>
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
      <el-table-column label="回复形式" width="180">
        <template #default="{ row }">
          <el-tooltip :content="replyDetail(row)">
            <span>{{ replyState(row) }}</span>
          </el-tooltip>
        </template>
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
.interaction-run-table__filters { display: flex; flex-wrap: wrap; gap: var(--monitor-space-xs); padding: var(--monitor-space-sm) var(--monitor-space-md); border-bottom: var(--monitor-rule); background: var(--monitor-color-surface-subtle); }
.interaction-run-table__filters :deep(.el-select) { width: 9.375rem; }
.numeric { color: var(--monitor-color-ink-soft); font-size: var(--monitor-text-xs); font-weight: 600; font-variant-numeric: tabular-nums; }
.numeric small { color: var(--monitor-color-muted); font-size: 0.6875rem; }
.error-summary { color: var(--monitor-color-danger); }
.interaction-run-table :deep(.el-tag) { border: 0; }
.interaction-run-table :deep(.el-tag.is-success) { color: var(--monitor-color-success); background: var(--monitor-color-success-soft); }
.interaction-run-table :deep(.el-tag.is-failed) { color: var(--monitor-color-danger); background: var(--monitor-color-danger-soft); }
.interaction-run-table :deep(.el-tag.is-running) { color: var(--monitor-color-warning); background: var(--monitor-color-warning-soft); }
.interaction-run-table__pagination { display: flex; justify-content: flex-end; padding: var(--monitor-space-sm) var(--monitor-space-md); border-top: var(--monitor-rule); }
@media (max-width: 640px) { .interaction-run-table__filters :deep(.el-select) { width: calc(50% - 4px); } }
</style>
