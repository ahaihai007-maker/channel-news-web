<script setup>
import { Link } from '@element-plus/icons-vue'

const props = defineProps({
  rows: { type: Array, default: () => [] },
  loading: Boolean
})

function formatNumber(value) {
  return value === null || value === undefined ? '—' : Number(value).toLocaleString()
}

function formatTime(value) {
  if (!value) {
    return '—'
  }
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false
  }).format(new Date(value))
}
</script>

<template>
  <section class="article-table telemetry-panel">
    <div class="telemetry-panel__header">
      <div>
        <span class="telemetry-panel__kicker">CONTENT RANKING</span>
        <h2>单篇内容表现</h2>
      </div>
      <span class="telemetry-panel__count">TOP {{ rows.length }}</span>
    </div>
    <el-table
      v-loading="loading"
      :data="rows"
      class="telemetry-table"
      row-key="articleId"
      empty-text="当前范围没有已发布文章"
    >
      <el-table-column label="内容" min-width="280" fixed="left">
        <template #default="{ row }">
          <div class="article-table__title">
            <strong>{{ row.title }}</strong>
            <span>#{{ row.articleId }} · {{ row.channelKey }} · {{ formatTime(row.publishedAt) }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="浏览" prop="views" sortable width="110" align="right">
        <template #default="{ row }"><span class="numeric is-primary">{{ formatNumber(row.views) }}</span></template>
      </el-table-column>
      <el-table-column label="转发" width="90" align="right">
        <template #default="{ row }"><span class="numeric">{{ formatNumber(row.forwards) }}</span></template>
      </el-table-column>
      <el-table-column label="Reaction" width="100" align="right">
        <template #default="{ row }"><span class="numeric">{{ formatNumber(row.reactions) }}</span></template>
      </el-table-column>
      <el-table-column label="评论" width="86" align="right">
        <template #default="{ row }"><span class="numeric">{{ formatNumber(row.replies) }}</span></template>
      </el-table-column>
      <el-table-column label="互动率" width="92" align="right">
        <template #default="{ row }"><span class="numeric">{{ row.engagementRate === null ? '—' : `${row.engagementRate}%` }}</span></template>
      </el-table-column>
      <el-table-column label="Token" width="110" align="right">
        <template #default="{ row }"><span class="numeric is-token">{{ formatNumber(row.totalTokens) }}</span></template>
      </el-table-column>
      <el-table-column label="消息" width="74" align="center">
        <template #default="{ row }">
          <el-button
            v-if="row.telegramUrl"
            :icon="Link"
            circle
            size="small"
            tag="a"
            :href="row.telegramUrl"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="打开 Telegram 消息"
          />
          <span v-else>—</span>
        </template>
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
.article-table__title strong,
.article-table__title span { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.article-table__title strong { color: #dce8ef; font-size: 12px; }
.article-table__title span { margin-top: 4px; color: #617584; font: 500 10px/1 ui-monospace, Consolas, monospace; }
.numeric { color: #c8d5dd; font: 600 11px/1 ui-monospace, Consolas, monospace; font-variant-numeric: tabular-nums; }
.numeric.is-primary { color: #55a6ff; }
.numeric.is-token { color: #a987ff; }
.article-table :deep(.el-button) { border-color: #35546b; background: #132839; color: #55a6ff; }
</style>
