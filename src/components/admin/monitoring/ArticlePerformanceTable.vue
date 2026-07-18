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
        <h2>单篇内容表现</h2>
      </div>
      <span class="telemetry-panel__meta">{{ rows.length }} 篇</span>
    </div>
    <el-table
      v-loading="loading"
      :data="rows"
      class="telemetry-table article-table__desktop"
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

    <div v-loading="loading" class="article-table__mobile">
      <article v-for="row in rows" :key="row.articleId" class="article-table__card">
        <div class="article-table__title">
          <strong>{{ row.title }}</strong>
          <span>#{{ row.articleId }} · {{ row.channelKey }} · {{ formatTime(row.publishedAt) }}</span>
        </div>
        <dl class="article-table__card-grid">
          <div><dt>浏览</dt><dd class="is-primary">{{ formatNumber(row.views) }}</dd></div>
          <div><dt>互动率</dt><dd>{{ row.engagementRate === null ? '—' : `${row.engagementRate}%` }}</dd></div>
          <div><dt>转发</dt><dd>{{ formatNumber(row.forwards) }}</dd></div>
          <div><dt>Token</dt><dd>{{ formatNumber(row.totalTokens) }}</dd></div>
        </dl>
        <el-button
          v-if="row.telegramUrl"
          :icon="Link"
          tag="a"
          :href="row.telegramUrl"
          target="_blank"
          rel="noopener noreferrer"
        >
          打开 Telegram 消息
        </el-button>
      </article>
      <p v-if="!loading && !rows.length" class="article-table__empty">当前范围没有已发布文章</p>
    </div>
  </section>
</template>

<style scoped>
.article-table__title strong,
.article-table__title span { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.article-table__title strong { color: var(--monitor-color-ink); font-size: var(--monitor-text-xs); }
.article-table__title span { margin-block-start: var(--monitor-space-2xs); color: var(--monitor-color-muted); font-family: var(--monitor-font-body); font-size: 0.6875rem; }
.numeric { color: var(--monitor-color-ink-soft); font-family: var(--monitor-font-body); font-size: var(--monitor-text-xs); font-weight: 600; font-variant-numeric: tabular-nums; }
.numeric.is-primary { color: var(--monitor-color-accent-strong); }
.numeric.is-token { color: var(--monitor-color-success); }
.article-table :deep(.el-button) { border-color: var(--monitor-color-rule-strong); color: var(--monitor-color-accent-strong); background: var(--monitor-color-surface); }

.article-table__mobile { display: none; }

@media (max-width: 48rem) {
  .article-table__desktop { display: none; }
  .article-table__mobile { display: block; }

  .article-table__card {
    padding: var(--monitor-space-md);
    border-block-end: var(--monitor-rule);
  }

  .article-table__card:last-child { border-block-end: 0; }

  .article-table__card-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--monitor-space-sm);
    margin: var(--monitor-space-md) 0;
  }

  .article-table__card-grid dt {
    color: var(--monitor-color-muted);
    font-size: var(--monitor-text-xs);
  }

  .article-table__card-grid dd {
    margin: var(--monitor-space-2xs) 0 0;
    color: var(--monitor-color-ink);
    font-family: var(--monitor-font-display);
    font-size: var(--monitor-text-base);
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  .article-table__card-grid dd.is-primary { color: var(--monitor-color-accent-strong); }
  .article-table__card :deep(.el-button) { width: 100%; white-space: nowrap; }
  .article-table__empty { margin: 0; padding: var(--monitor-space-lg); color: var(--monitor-color-muted); font-size: var(--monitor-text-xs); text-align: center; }
}
</style>
