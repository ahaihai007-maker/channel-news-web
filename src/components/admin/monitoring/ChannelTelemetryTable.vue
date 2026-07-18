<script setup>
const props = defineProps({
  rows: { type: Array, default: () => [] },
  loading: Boolean
})

const availabilityLabels = {
  available: '正常',
  collecting: '等待快照',
  stale: '已过期',
  unavailable: '无法取得',
  permission_denied: '无权限',
  not_configured: '未配置'
}

function formatNumber(value) {
  return value === null || value === undefined ? '—' : Number(value).toLocaleString()
}

function formatTime(value) {
  if (!value) {
    return '—'
  }
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
  <section class="channel-table telemetry-panel">
    <div class="telemetry-panel__header">
      <div>
        <h2>频道遥测对比</h2>
      </div>
      <span class="telemetry-panel__meta">{{ rows.length }} 个频道</span>
    </div>
    <el-table
      v-loading="loading"
      :data="rows"
      class="telemetry-table channel-table__desktop"
      row-key="channelKey"
      empty-text="尚无频道快照"
    >
      <el-table-column label="频道" min-width="190" fixed="left">
        <template #default="{ row }">
          <div class="channel-table__identity">
            <strong>{{ row.title }}</strong>
            <span>{{ row.channelKey }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="108">
        <template #default="{ row }">
          <el-tag :class="`is-${row.availability}`" size="small" effect="dark">
            {{ availabilityLabels[row.availability] || row.availability }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="订阅" width="110" align="right">
        <template #default="{ row }"><span class="numeric">{{ formatNumber(row.subscribers) }}</span></template>
      </el-table-column>
      <el-table-column label="净增" width="90" align="right">
        <template #default="{ row }"><span class="numeric is-accent">{{ formatNumber(row.subscriberDelta) }}</span></template>
      </el-table-column>
      <el-table-column prop="posts" label="发文" width="76" align="right" />
      <el-table-column label="浏览" width="110" align="right" sortable prop="views">
        <template #default="{ row }"><span class="numeric">{{ formatNumber(row.views) }}</span></template>
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
      <el-table-column label="最近快照" width="130">
        <template #default="{ row }">{{ formatTime(row.capturedAt) }}</template>
      </el-table-column>
    </el-table>

    <div v-loading="loading" class="channel-table__mobile">
      <article v-for="row in rows" :key="row.channelKey" class="channel-table__card">
        <div class="channel-table__card-head">
          <div class="channel-table__identity">
            <strong>{{ row.title }}</strong>
            <span>{{ row.channelKey }}</span>
          </div>
          <el-tag :class="`is-${row.availability}`" size="small" effect="plain">
            {{ availabilityLabels[row.availability] || row.availability }}
          </el-tag>
        </div>
        <dl class="channel-table__card-grid">
          <div><dt>订阅</dt><dd>{{ formatNumber(row.subscribers) }}</dd></div>
          <div><dt>净增</dt><dd class="is-accent">{{ formatNumber(row.subscriberDelta) }}</dd></div>
          <div><dt>浏览</dt><dd>{{ formatNumber(row.views) }}</dd></div>
          <div><dt>互动率</dt><dd>{{ row.engagementRate === null ? '—' : `${row.engagementRate}%` }}</dd></div>
        </dl>
        <p>最近快照 {{ formatTime(row.capturedAt) }}</p>
      </article>
      <p v-if="!loading && !rows.length" class="channel-table__empty">尚无频道快照</p>
    </div>
  </section>
</template>

<style scoped>
.channel-table__identity strong,
.channel-table__identity span { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.channel-table__identity strong { color: var(--monitor-color-ink); font-size: var(--monitor-text-xs); }
.channel-table__identity span { margin-block-start: var(--monitor-space-2xs); color: var(--monitor-color-muted); font-family: var(--monitor-font-body); font-size: 0.6875rem; }
.numeric { color: var(--monitor-color-ink-soft); font-family: var(--monitor-font-body); font-size: var(--monitor-text-xs); font-weight: 600; font-variant-numeric: tabular-nums; }
.numeric.is-accent { color: var(--monitor-color-accent-strong); }
.channel-table :deep(.el-tag) { border: 0; color: var(--monitor-color-success); background: var(--monitor-color-success-soft); }
.channel-table :deep(.el-tag.is-collecting),
.channel-table :deep(.el-tag.is-not_configured) { color: var(--monitor-color-muted); background: var(--monitor-color-surface-subtle); }
.channel-table :deep(.el-tag.is-stale) { color: var(--monitor-color-warning); background: var(--monitor-color-warning-soft); }
.channel-table :deep(.el-tag.is-unavailable),
.channel-table :deep(.el-tag.is-permission_denied) { color: var(--monitor-color-danger); background: var(--monitor-color-danger-soft); }

.channel-table__mobile { display: none; }

@media (max-width: 48rem) {
  .channel-table__desktop { display: none; }
  .channel-table__mobile { display: block; }

  .channel-table__card {
    padding: var(--monitor-space-md);
    border-block-end: var(--monitor-rule);
  }

  .channel-table__card:last-child { border-block-end: 0; }

  .channel-table__card-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--monitor-space-sm);
  }

  .channel-table__card-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--monitor-space-sm);
    margin: var(--monitor-space-md) 0 var(--monitor-space-sm);
  }

  .channel-table__card-grid div {
    min-width: 0;
  }

  .channel-table__card-grid dt {
    color: var(--monitor-color-muted);
    font-size: var(--monitor-text-xs);
  }

  .channel-table__card-grid dd {
    margin: var(--monitor-space-2xs) 0 0;
    color: var(--monitor-color-ink);
    font-family: var(--monitor-font-display);
    font-size: var(--monitor-text-base);
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  .channel-table__card-grid dd.is-accent { color: var(--monitor-color-accent-strong); }
  .channel-table__card > p,
  .channel-table__empty { margin: 0; color: var(--monitor-color-muted); font-size: var(--monitor-text-xs); }
  .channel-table__empty { padding: var(--monitor-space-lg); text-align: center; }
}
</style>
