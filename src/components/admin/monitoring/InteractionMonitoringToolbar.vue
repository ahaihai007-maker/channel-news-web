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
      <span class="interaction-toolbar__eyebrow">TELEMETRY / INTERACTION AI</span>
      <div class="interaction-toolbar__title-row">
        <h1>AI 互动运行台</h1>
        <span class="interaction-toolbar__live"><i /> ACTIVE</span>
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
          active-text="AUTO"
          inactive-text="MAN"
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
.interaction-toolbar {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  padding: 22px 24px;
  border: 1px solid #263540;
  background:
    linear-gradient(90deg, rgba(42, 198, 168, 0.075) 1px, transparent 1px) 0 0 / 48px 48px,
    #101a22;
}

.interaction-toolbar__eyebrow {
  display: block;
  margin-bottom: 8px;
  color: #2ac6a8;
  font: 600 10px/1 ui-monospace, Consolas, monospace;
  letter-spacing: 0.16em;
}

.interaction-toolbar__title-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.interaction-toolbar h1 {
  margin: 0;
  color: #edf7ff;
  font: 700 clamp(24px, 2.4vw, 36px)/1.05 'Microsoft YaHei UI', 'PingFang SC', sans-serif;
  letter-spacing: -0.04em;
}

.interaction-toolbar__live {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #2ac6a8;
  font: 700 10px/1 ui-monospace, Consolas, monospace;
}

.interaction-toolbar__live i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #2ac6a8;
  box-shadow: 0 0 0 4px rgba(42, 198, 168, 0.12);
}

.interaction-toolbar p {
  margin: 8px 0 0;
  color: #8294a1;
  font-size: 13px;
}

.interaction-toolbar__controls {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 10px;
}

.interaction-toolbar__select {
  width: 168px;
}

.interaction-toolbar__updated {
  color: #718391;
  font: 500 11px/1 ui-monospace, Consolas, monospace;
}

.interaction-toolbar__hint {
  color: #627684;
}

.interaction-toolbar :deep(.el-input__wrapper),
.interaction-toolbar :deep(.el-radio-button__inner) {
  border-color: #30424f;
  background: #0b1117;
  color: #a9bac6;
  box-shadow: none;
}

.interaction-toolbar :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
  border-color: #2ac6a8;
  background: #153932;
  color: #e3fff8;
}

.interaction-toolbar__refresh {
  border-color: #2d6259;
  background: #12322d;
  color: #d9fff7;
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
    padding: 18px;
  }

  .interaction-toolbar__select {
    width: calc(50% - 5px);
  }

  .interaction-toolbar__updated,
  .interaction-toolbar__hint {
    display: none;
  }
}
</style>
