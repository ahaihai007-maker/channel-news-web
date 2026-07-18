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
        <h2>文章互动排行</h2>
      </div>
      <span class="telemetry-panel__meta">{{ rows.length }} 篇</span>
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
            <span>文章 #{{ row.articleId }}</span>
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
.identity strong,
.identity span { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.identity strong { color: var(--monitor-color-ink); font-size: var(--monitor-text-xs); }
.identity span { margin-top: var(--monitor-space-2xs); color: var(--monitor-color-muted); font-size: 0.6875rem; }
.numeric { color: var(--monitor-color-ink-soft); font-size: var(--monitor-text-xs); font-weight: 600; font-variant-numeric: tabular-nums; }
.numeric.is-success { color: var(--monitor-color-success); }
</style>
