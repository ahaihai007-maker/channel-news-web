<script setup>
import { computed } from 'vue'
import { Refresh, Setting } from '@element-plus/icons-vue'

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
      <span class="monitor-toolbar__eyebrow">TELEMETRY / CHANNEL OPS</span>
      <div class="monitor-toolbar__title-row">
        <h1 class="monitor-toolbar__title">频道运行台</h1>
        <span class="monitor-toolbar__live"><i /> LIVE</span>
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

      <el-tooltip content="页面可见时每 30 秒刷新" placement="bottom">
        <el-switch
          :model-value="autoRefresh"
          inline-prompt
          active-text="AUTO"
          inactive-text="MAN"
          @update:model-value="emit('update:autoRefresh', $event)"
        />
      </el-tooltip>

      <el-button
        class="monitor-toolbar__refresh"
        :icon="Refresh"
        :loading="loading"
        @click="emit('refresh')"
      >
        刷新
      </el-button>
      <el-tooltip content="筛选条件会保存在当前网址" placement="bottom">
        <el-icon class="monitor-toolbar__hint"><Setting /></el-icon>
      </el-tooltip>
      <span class="monitor-toolbar__updated">更新 {{ updatedLabel }}</span>
    </div>
  </header>
</template>

<style scoped>
.monitor-toolbar {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  padding: 22px 24px;
  border: 1px solid #263540;
  background:
    linear-gradient(90deg, rgba(85, 166, 255, 0.08) 1px, transparent 1px) 0 0 / 48px 48px,
    #101a22;
}

.monitor-toolbar__eyebrow {
  display: block;
  margin-bottom: 8px;
  color: #55a6ff;
  font: 600 10px/1 ui-monospace, Consolas, monospace;
  letter-spacing: 0.16em;
}

.monitor-toolbar__title-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.monitor-toolbar__title {
  margin: 0;
  color: #edf7ff;
  font: 700 clamp(24px, 2.4vw, 36px)/1.05 'Microsoft YaHei UI', sans-serif;
  letter-spacing: -0.04em;
}

.monitor-toolbar__live {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #32c787;
  font: 700 10px/1 ui-monospace, Consolas, monospace;
}

.monitor-toolbar__live i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #32c787;
  box-shadow: 0 0 0 4px rgba(50, 199, 135, 0.12);
}

.monitor-toolbar__description {
  margin: 8px 0 0;
  color: #8294a1;
  font-size: 13px;
}

.monitor-toolbar__controls {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 10px;
}

.monitor-toolbar__channel {
  width: 180px;
}

.monitor-toolbar__updated {
  color: #718391;
  font: 500 11px/1 ui-monospace, Consolas, monospace;
}

.monitor-toolbar__hint {
  color: #627684;
}

.monitor-toolbar :deep(.el-input__wrapper),
.monitor-toolbar :deep(.el-radio-button__inner) {
  border-color: #30424f;
  background: #0b1117;
  color: #a9bac6;
  box-shadow: none;
}

.monitor-toolbar :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
  border-color: #55a6ff;
  background: #17334a;
  color: #e6f3ff;
}

.monitor-toolbar__refresh {
  border-color: #35546b;
  background: #132839;
  color: #cfe9ff;
}

@media (max-width: 980px) {
  .monitor-toolbar {
    align-items: flex-start;
    flex-direction: column;
  }

  .monitor-toolbar__controls {
    justify-content: flex-start;
  }
}

@media (max-width: 640px) {
  .monitor-toolbar {
    padding: 18px;
  }

  .monitor-toolbar__channel {
    width: 100%;
  }

  .monitor-toolbar__updated,
  .monitor-toolbar__hint {
    display: none;
  }
}
</style>
