<script setup>
import { computed } from 'vue'

const props = defineProps({
  items: { type: Array, default: () => [] },
  loading: Boolean
})

const availabilityLabels = {
  available: '数据正常',
  collecting: '等待快照',
  stale: '数据过期',
  unavailable: '无法取得',
  permission_denied: '无权限',
  not_configured: '未配置'
}

const formattedItems = computed(() => props.items.map((item) => ({
  ...item,
  displayValue: item.value === null || item.value === undefined
    ? '—'
    : new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 2 }).format(item.value),
  availabilityLabel: availabilityLabels[item.availability] || item.availability
})))
</script>

<template>
  <section class="metric-rail" aria-label="关键指标">
    <el-skeleton v-if="loading && items.length === 0" :rows="2" animated />
    <article
      v-for="item in formattedItems"
      v-else
      :key="item.key"
      class="metric-rail__item"
      :class="`is-${item.availability}`"
    >
      <div class="metric-rail__topline">
        <span>{{ item.label }}</span>
        <i />
      </div>
      <div class="metric-rail__value">
        {{ item.displayValue }}<small v-if="item.unit">{{ item.unit }}</small>
      </div>
      <div class="metric-rail__meta">
        <span>{{ item.source }}</span>
        <span>{{ item.note || item.availabilityLabel }}</span>
      </div>
    </article>
  </section>
</template>

<style scoped>
.metric-rail {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  border: 1px solid #263540;
  border-bottom: 0;
  background: #101a22;
}

.metric-rail__item {
  min-height: 116px;
  padding: 17px 18px 14px;
  border-right: 1px solid #263540;
  border-bottom: 1px solid #263540;
  box-sizing: border-box;
}

.metric-rail__item:nth-child(4n) {
  border-right: 0;
}

.metric-rail__topline,
.metric-rail__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.metric-rail__topline {
  color: #8fa2af;
  font-size: 12px;
  font-weight: 600;
}

.metric-rail__topline i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #32c787;
}

.metric-rail__value {
  margin: 10px 0 12px;
  color: #edf7ff;
  font: 700 28px/1 ui-monospace, Consolas, monospace;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.04em;
}

.metric-rail__value small {
  margin-left: 3px;
  color: #8294a1;
  font-size: 13px;
}

.metric-rail__meta {
  color: #617584;
  font: 500 10px/1.25 ui-monospace, Consolas, monospace;
}

.metric-rail__meta span:last-child {
  overflow: hidden;
  text-align: right;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.metric-rail__item.is-stale .metric-rail__topline i {
  background: #efb849;
}

.metric-rail__item.is-unavailable .metric-rail__topline i,
.metric-rail__item.is-permission_denied .metric-rail__topline i {
  background: #f06464;
}

.metric-rail__item.is-collecting .metric-rail__topline i,
.metric-rail__item.is-not_configured .metric-rail__topline i {
  background: #718391;
}

@media (max-width: 1180px) {
  .metric-rail {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .metric-rail__item:nth-child(2n) {
    border-right: 0;
  }
}

@media (max-width: 540px) {
  .metric-rail__item {
    min-height: 104px;
    padding: 14px;
  }

  .metric-rail__value {
    font-size: 23px;
  }

  .metric-rail__meta span:first-child {
    display: none;
  }
}
</style>
