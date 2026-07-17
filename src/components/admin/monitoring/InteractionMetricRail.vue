<script setup>
import { computed } from 'vue'
import MetricRail from './MetricRail.vue'

const props = defineProps({
  summary: { type: Object, default: null },
  loading: Boolean
})

const items = computed(() => {
  const summary = props.summary
  return [
    { key: 'totalRuns', label: 'AI 执行次数', value: summary?.totalRuns ?? 0, source: 'interaction_ai_runs', note: `成功 ${summary?.successRuns ?? 0}` },
    { key: 'successRate', label: '模型执行成功率', value: summary?.successRate ?? null, unit: '%', source: 'SUCCESS / 已完成', note: '不含 RUNNING' },
    { key: 'failedRuns', label: '失败次数', value: summary?.failedRuns ?? 0, source: 'interaction_ai_runs', note: `运行中 ${summary?.runningRuns ?? 0}` },
    { key: 'recordedReplies', label: '已记录 Telegram 回复', value: summary?.recordedReplies ?? 0, source: 'reply_message_id', note: '与模型成功分开计算' },
    { key: 'triggerUsers', label: '触发用户数', value: summary?.triggerUsers ?? 0, source: '去重 user_id', note: '仅 AI 触发用户' },
    { key: 'indexedMessages', label: 'Bot 已索引消息', value: summary?.indexedMessages ?? 0, source: 'interaction_message_index', note: '不等于群组总消息' },
    { key: 'promptTokens', label: '输入 Token', value: summary?.promptTokens ?? 0, source: 'interaction_ai_runs', note: '含已记录失败用量' },
    { key: 'completionTokens', label: '输出 Token', value: summary?.completionTokens ?? 0, source: 'interaction_ai_runs', note: '含已记录失败用量' },
    { key: 'totalTokens', label: 'Token 总数', value: summary?.totalTokens ?? 0, source: 'interaction_ai_runs', note: '不叠加 ai_usage_logs' },
    { key: 'averageLatency', label: '平均延迟', value: summary?.averageLatencyMs ?? null, unit: 'ms', source: '非空 latency_ms', note: '端到端请求时间' },
    { key: 'p95Latency', label: 'P95 延迟', value: summary?.p95LatencyMs ?? null, unit: 'ms', source: 'nearest-rank P95', note: '非空 latency_ms' },
    { key: 'webSearch', label: 'Web 搜索请求', value: summary?.webSearchRequests ?? 0, source: 'web_search_requests', note: '不含搜索来源正文' }
  ].map((item) => ({ ...item, availability: 'available' }))
})
</script>

<template>
  <MetricRail :items="items" :loading="loading" data-testid="interaction-metric-rail" />
</template>
