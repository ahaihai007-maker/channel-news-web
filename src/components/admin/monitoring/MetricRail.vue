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
        <span class="metric-rail__status"><i />{{ item.availabilityLabel }}</span>
      </div>
      <div class="metric-rail__value">
        {{ item.displayValue }}<small v-if="item.unit">{{ item.unit }}</small>
      </div>
      <div class="metric-rail__meta">
        <span>{{ item.source }}</span>
        <span>{{ item.note || '当前筛选范围' }}</span>
      </div>
    </article>
  </section>
</template>

<style scoped>
.metric-rail {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-block-start: var(--monitor-space-md);
  border-block: var(--monitor-rule);
  background: transparent;
}

.metric-rail__item {
  min-width: 0;
  min-height: 7rem;
  padding: var(--monitor-space-md);
  border-inline-end: var(--monitor-rule);
  border-block-end: var(--monitor-rule);
}

.metric-rail__item:nth-child(2n) {
  border-inline-end: 0;
}

.metric-rail__topline,
.metric-rail__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--monitor-space-xs);
}

.metric-rail__topline {
  color: var(--monitor-color-ink-soft);
  font-size: var(--monitor-text-xs);
  font-weight: 600;
}

.metric-rail__status {
  display: inline-flex;
  align-items: center;
  gap: var(--monitor-space-2xs);
  color: var(--monitor-color-muted);
  font-weight: 500;
  white-space: nowrap;
}

.metric-rail__status i {
  width: 0.375rem;
  height: 0.375rem;
  border-radius: 50%;
  background: var(--monitor-color-success);
}

.metric-rail__value {
  margin: var(--monitor-space-xs) 0 var(--monitor-space-sm);
  color: var(--monitor-color-ink);
  font-family: var(--monitor-font-display);
  font-size: 1.75rem;
  font-weight: 700;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.04em;
}

.metric-rail__value small {
  margin-inline-start: var(--monitor-space-2xs);
  color: var(--monitor-color-muted);
  font-size: var(--monitor-text-xs);
}

.metric-rail__meta {
  color: var(--monitor-color-muted);
  font-size: var(--monitor-text-xs);
  font-weight: 500;
  line-height: 1.25;
}

.metric-rail__meta span:last-child {
  overflow: hidden;
  text-align: right;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.metric-rail__item.is-stale .metric-rail__status i {
  background: var(--monitor-color-warning);
}

.metric-rail__item.is-unavailable .metric-rail__status i,
.metric-rail__item.is-permission_denied .metric-rail__status i {
  background: var(--monitor-color-danger);
}

.metric-rail__item.is-collecting .metric-rail__status i,
.metric-rail__item.is-not_configured .metric-rail__status i {
  background: var(--monitor-color-faint);
}

@media (min-width: 60rem) {
  .metric-rail {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .metric-rail__item {
    border-block-end: 0;
  }

  .metric-rail__item:nth-child(2n) {
    border-inline-end: var(--monitor-rule);
  }

  .metric-rail__item:nth-child(4n) {
    border-inline-end: 0;
  }
}

@media (max-width: 33.75rem) {
  .metric-rail__item {
    min-height: 6.5rem;
    padding: var(--monitor-space-sm);
  }

  .metric-rail__value {
    font-size: 1.4rem;
  }

  .metric-rail__meta span:first-child {
    display: none;
  }
}
</style>
