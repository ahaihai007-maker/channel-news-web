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
        <span class="telemetry-panel__kicker">CHANNEL FLEET</span>
        <h2>频道遥测对比</h2>
      </div>
      <span class="telemetry-panel__count">{{ rows.length }} CHANNELS</span>
    </div>
    <el-table
      v-loading="loading"
      :data="rows"
      class="telemetry-table"
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
  </section>
</template>

<style scoped>
.telemetry-panel { border: 1px solid #263540; background: #101a22; }
.telemetry-panel__header { display: flex; align-items: center; justify-content: space-between; min-height: 64px; padding: 0 18px; border-bottom: 1px solid #263540; }
.telemetry-panel__kicker,
.telemetry-panel__count { color: #617584; font: 600 9px/1 ui-monospace, Consolas, monospace; letter-spacing: 0.13em; }
.telemetry-panel h2 { margin: 5px 0 0; color: #dce8ef; font-size: 15px; }
.telemetry-table { --el-table-bg-color: #101a22; --el-table-tr-bg-color: #101a22; --el-table-header-bg-color: #0d161d; --el-table-row-hover-bg-color: #142631; --el-table-border-color: #263540; --el-table-text-color: #a9bac6; --el-table-header-text-color: #718391; width: 100%; }
.channel-table__identity strong,
.channel-table__identity span { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.channel-table__identity strong { color: #dce8ef; font-size: 12px; }
.channel-table__identity span { margin-top: 3px; color: #617584; font: 500 10px/1 ui-monospace, Consolas, monospace; }
.numeric { color: #c8d5dd; font: 600 11px/1 ui-monospace, Consolas, monospace; font-variant-numeric: tabular-nums; }
.numeric.is-accent { color: #2ac6a8; }
.channel-table :deep(.el-tag) { border: 0; background: #1b6b4d; }
.channel-table :deep(.el-tag.is-collecting),
.channel-table :deep(.el-tag.is-not_configured) { background: #46545e; }
.channel-table :deep(.el-tag.is-stale) { background: #72581b; }
.channel-table :deep(.el-tag.is-unavailable),
.channel-table :deep(.el-tag.is-permission_denied) { background: #7c3030; }
</style>
