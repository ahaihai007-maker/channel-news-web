<script setup>
defineProps({
  rows: { type: Array, default: () => [] },
  loading: Boolean
})

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
    hour12: false
  }).format(new Date(value))
}
</script>

<template>
  <section class="interaction-article-table telemetry-panel">
    <div class="telemetry-panel__header">
      <div>
        <span class="telemetry-panel__kicker">ARTICLE CONTEXT</span>
        <h2>文章互动排行</h2>
      </div>
      <span class="telemetry-panel__count">TOP {{ rows.length }}</span>
    </div>
    <el-table
      v-loading="loading"
      :data="rows"
      class="telemetry-table"
      row-key="articleId"
      empty-text="当前范围没有文章讨论记录"
    >
      <el-table-column label="文章" min-width="220">
        <template #default="{ row }">
          <div class="identity">
            <strong>{{ row.title }}</strong>
            <span>ARTICLE {{ row.articleId }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="执行" width="76" align="right" sortable prop="totalRuns" />
      <el-table-column label="触发用户" width="90" align="right" prop="triggerUsers" />
      <el-table-column label="成功率" width="90" align="right">
        <template #default="{ row }"><span class="numeric is-success">{{ row.successRate === null ? '—' : `${row.successRate}%` }}</span></template>
      </el-table-column>
      <el-table-column label="Token" width="110" align="right">
        <template #default="{ row }"><span class="numeric">{{ formatNumber(row.totalTokens) }}</span></template>
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
</style>
