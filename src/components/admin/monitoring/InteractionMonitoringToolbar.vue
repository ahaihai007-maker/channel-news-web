<script setup>
import { computed } from 'vue'
import { Refresh, Setting } from '@element-plus/icons-vue'

const props = defineProps({
  filters: { type: Object, required: true },
  facets: { type: Object, default: () => ({ routes: [], chats: [] }) },
  autoRefresh: Boolean,
  loading: Boolean,
  lastUpdatedAt: { type: String, default: '' }
})

const emit = defineEmits(['update:filters', 'update:autoRefresh', 'refresh'])

const chatOptions = computed(() => props.facets.chats.filter((item) => (
  !props.filters.routeId || item.routeId === props.filters.routeId
)))

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
  const nextFilters = { ...props.filters, [key]: value }
  if (key === 'routeId') {
    const isCurrentChatValid = props.facets.chats.some((item) => (
      item.chatId === props.filters.chatId && (!value || item.routeId === value)
    ))
    if (!isCurrentChatValid) {
      nextFilters.chatId = null
    }
  }
  emit('update:filters', nextFilters)
}
</script>

<template>
  <header class="interaction-toolbar">
    <div class="interaction-toolbar__identity">
      <div class="interaction-toolbar__title-row">
        <h1>AI 互动运行台</h1>
        <span class="interaction-toolbar__live"><i />运行中</span>
      </div>
      <p>线路执行、Telegram 回复记录、Token 与模型延迟</p>
    </div>

    <div class="interaction-toolbar__controls">
      <el-select
        :model-value="filters.routeId"
        class="interaction-toolbar__select"
        placeholder="全部线路"
        clearable
        filterable
        data-testid="interaction-route-filter"
        @update:model-value="updateFilter('routeId', $event)"
      >
        <el-option
          v-for="option in facets.routes"
          :key="option.routeId"
          :label="option.label"
          :value="option.routeId"
        />
      </el-select>

      <el-select
        :model-value="filters.chatId"
        class="interaction-toolbar__select"
        placeholder="全部 chatId"
        clearable
        filterable
        data-testid="interaction-chat-filter"
        @update:model-value="updateFilter('chatId', $event)"
      >
        <el-option
          v-for="option in chatOptions"
          :key="`${option.routeId}-${option.chatId}`"
          :label="String(option.chatId)"
          :value="option.chatId"
        />
      </el-select>

      <el-radio-group
        :model-value="filters.days"
        size="small"
        class="interaction-toolbar__range"
        @update:model-value="updateFilter('days', $event)"
      >
        <el-radio-button :value="1">24H</el-radio-button>
        <el-radio-button :value="7">7D</el-radio-button>
        <el-radio-button :value="30">30D</el-radio-button>
      </el-radio-group>

      <el-tooltip content="页面可见且当前位于 AI 互动页签时每 30 秒刷新" placement="bottom">
        <el-switch
          :model-value="autoRefresh"
          inline-prompt
          active-text="开"
          inactive-text="关"
          @update:model-value="emit('update:autoRefresh', $event)"
        />
      </el-tooltip>

      <el-button
        class="interaction-toolbar__refresh"
        :icon="Refresh"
        :loading="loading"
        data-testid="interaction-refresh"
        @click="emit('refresh')"
      >
        刷新
      </el-button>
      <el-tooltip content="页签与筛选条件保存在当前网址" placement="bottom">
        <el-icon class="interaction-toolbar__hint"><Setting /></el-icon>
      </el-tooltip>
      <span class="interaction-toolbar__updated">更新 {{ updatedLabel }}</span>
    </div>
  </header>
</template>

<style scoped>
/* Hallmark · pre-emit critique: P5 H5 E5 S5 R5 V4 */
/* Hallmark · macrostructure: Workbench · genre: modern-minimal · theme: Cobalt · same-system override · contrast: pass (40–41) · mobile: pass (34, 49–57) */
.interaction-toolbar {
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

.interaction-toolbar__title-row {
  display: flex;
  align-items: center;
  gap: var(--monitor-space-sm);
}

.interaction-toolbar h1 {
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

.interaction-toolbar__live {
  display: inline-flex;
  align-items: center;
  gap: var(--monitor-space-xs);
  color: var(--monitor-color-success);
  font-size: var(--monitor-text-xs);
  font-weight: 600;
  line-height: 1;
}

.interaction-toolbar__live i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--monitor-color-success);
}

.interaction-toolbar p {
  max-width: 42rem;
  margin: var(--monitor-space-xs) 0 0;
  color: var(--monitor-color-muted);
  font-size: var(--monitor-text-sm);
  line-height: 1.5;
}

.interaction-toolbar__controls {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: var(--monitor-space-xs);
}

.interaction-toolbar__select {
  width: 10.5rem;
}

.interaction-toolbar__updated {
  color: var(--monitor-color-muted);
  font-size: var(--monitor-text-xs);
  font-variant-numeric: tabular-nums;
  line-height: 1;
  white-space: nowrap;
}

.interaction-toolbar__hint {
  color: var(--monitor-color-faint);
}

.interaction-toolbar__refresh {
  min-width: 5.25rem;
}

@media (max-width: 1180px) {
  .interaction-toolbar {
    align-items: flex-start;
    flex-direction: column;
  }

  .interaction-toolbar__controls {
    justify-content: flex-start;
  }
}

@media (max-width: 640px) {
  .interaction-toolbar {
    padding: var(--monitor-space-md);
  }

  .interaction-toolbar__select {
    width: 100%;
  }

  .interaction-toolbar__controls {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    width: 100%;
  }

  .interaction-toolbar__select,
  .interaction-toolbar__range,
  .interaction-toolbar__updated {
    grid-column: 1 / -1;
  }

  .interaction-toolbar__range :deep(.el-radio-button) {
    flex: 1;
  }

  .interaction-toolbar__range :deep(.el-radio-button__inner) {
    width: 100%;
  }

  .interaction-toolbar__updated,
  .interaction-toolbar__hint {
    display: none;
  }
}
</style>
