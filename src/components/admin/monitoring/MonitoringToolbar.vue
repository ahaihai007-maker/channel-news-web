<script setup>
import { computed } from 'vue'
import { Refresh } from '@element-plus/icons-vue'

const props = defineProps({
  filters: { type: Object, required: true },
  channels: { type: Array, default: () => [] },
  autoRefresh: Boolean,
  loading: Boolean,
  lastUpdatedAt: { type: String, default: '' }
})

const emit = defineEmits(['update:filters', 'update:autoRefresh', 'refresh'])

const channelOptions = computed(() => {
  const unique = new Map()
  for (const channel of props.channels) {
    unique.set(channel.channelKey, channel.title || channel.channelKey)
  }
  return [...unique].map(([value, label]) => ({ value, label }))
})

const updatedLabel = computed(() => {
  if (!props.lastUpdatedAt) {
    return '尚未更新'
  }
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(new Date(props.lastUpdatedAt))
})

function updateFilter(key, value) {
  emit('update:filters', { ...props.filters, [key]: value })
}
</script>

<template>
  <header class="monitor-toolbar">
    <div class="monitor-toolbar__identity">
      <div class="monitor-toolbar__title-row">
        <h1 class="monitor-toolbar__title">频道运行台</h1>
      </div>
      <p class="monitor-toolbar__description">频道流量、内容流转、Token 与自动化状态</p>
    </div>

    <div class="monitor-toolbar__controls">
      <el-select
        :model-value="filters.channel"
        class="monitor-toolbar__channel"
        placeholder="全部频道"
        clearable
        filterable
        @update:model-value="updateFilter('channel', $event)"
      >
        <el-option
          v-for="option in channelOptions"
          :key="option.value"
          :label="option.label"
          :value="option.value"
        />
      </el-select>

      <el-radio-group
        :model-value="filters.days"
        size="small"
        class="monitor-toolbar__range"
        @update:model-value="updateFilter('days', $event)"
      >
        <el-radio-button :value="1">24H</el-radio-button>
        <el-radio-button :value="7">7D</el-radio-button>
        <el-radio-button :value="30">30D</el-radio-button>
      </el-radio-group>

      <label class="monitor-toolbar__auto-refresh">
        <span>自动刷新</span>
        <el-switch
          :model-value="autoRefresh"
          inline-prompt
          active-text="开"
          inactive-text="关"
          aria-label="页面可见时每 30 秒自动刷新"
          @update:model-value="emit('update:autoRefresh', $event)"
        />
      </label>

      <el-button
        class="monitor-toolbar__refresh"
        :icon="Refresh"
        :loading="loading"
        @click="emit('refresh')"
      >
        刷新
      </el-button>
      <span class="monitor-toolbar__updated" aria-live="polite">更新于 {{ updatedLabel }}</span>
    </div>
  </header>
</template>

<style scoped>
.monitor-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--monitor-space-lg);
  padding: var(--monitor-space-lg);
  border: var(--monitor-rule);
  border-radius: var(--monitor-radius-panel);
  color: var(--monitor-color-ink-soft);
  background: var(--monitor-color-surface);
}

.monitor-toolbar__title-row {
  display: flex;
  align-items: center;
  gap: var(--monitor-space-sm);
}

.monitor-toolbar__title {
  margin: 0;
  color: var(--monitor-color-ink);
  font-family: var(--monitor-font-display);
  font-size: clamp(1.5rem, 2.4vw, 2rem);
  font-style: normal;
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.035em;
  overflow-wrap: anywhere;
}

.monitor-toolbar__description {
  max-width: 42rem;
  margin: var(--monitor-space-xs) 0 0;
  color: var(--monitor-color-muted);
  font-size: var(--monitor-text-sm);
  line-height: 1.5;
}

.monitor-toolbar__controls {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: var(--monitor-space-xs);
}

.monitor-toolbar__channel {
  width: 11.25rem;
}

.monitor-toolbar__updated {
  color: var(--monitor-color-muted);
  font-size: var(--monitor-text-xs);
  font-variant-numeric: tabular-nums;
  line-height: 1;
  white-space: nowrap;
}

.monitor-toolbar__auto-refresh {
  display: inline-flex;
  align-items: center;
  gap: var(--monitor-space-xs);
  min-height: 2.75rem;
  color: var(--monitor-color-muted);
  font-size: var(--monitor-text-xs);
  white-space: nowrap;
}

.monitor-toolbar__refresh {
  min-width: 5.25rem;
}

@media (max-width: 61.25rem) {
  .monitor-toolbar {
    align-items: flex-start;
    flex-direction: column;
  }

  .monitor-toolbar__controls {
    justify-content: flex-start;
  }
}

@media (max-width: 40rem) {
  .monitor-toolbar {
    padding: var(--monitor-space-md);
  }

  .monitor-toolbar__channel {
    width: 100%;
  }

  .monitor-toolbar__controls {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    width: 100%;
  }

  .monitor-toolbar__channel,
  .monitor-toolbar__range,
  .monitor-toolbar__updated {
    grid-column: 1 / -1;
  }

  .monitor-toolbar__range :deep(.el-radio-button) {
    flex: 1;
  }

  .monitor-toolbar__range :deep(.el-radio-button__inner) {
    width: 100%;
  }
}
</style>
