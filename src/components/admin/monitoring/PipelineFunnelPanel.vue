<script setup>
const props = defineProps({
  stages: { type: Array, default: () => [] },
  loading: Boolean
})
</script>

<template>
  <section class="funnel-panel telemetry-panel">
    <div class="telemetry-panel__header">
      <div>
        <span class="telemetry-panel__kicker">CONTENT FLOW</span>
        <h2>自动化处理链</h2>
      </div>
      <span class="telemetry-panel__count">{{ stages.length }} STAGES</span>
    </div>
    <el-skeleton v-if="loading && !stages.length" :rows="4" animated />
    <div v-else class="funnel-panel__flow">
      <article v-for="(stage, index) in stages" :key="stage.key" class="funnel-panel__stage">
        <span class="funnel-panel__index">0{{ index + 1 }}</span>
        <div>
          <strong>{{ stage.value.toLocaleString() }}</strong>
          <span>{{ stage.label }}</span>
        </div>
        <em v-if="stage.rate !== null">{{ stage.rate }}%</em>
      </article>
    </div>
    <p class="funnel-panel__note">统计选定时段内的频道采集文章；阶段数量按当前持久化状态计算。</p>
  </section>
</template>

<style scoped>
.telemetry-panel { border: 1px solid #263540; background: #101a22; }
.telemetry-panel__header { display: flex; align-items: center; justify-content: space-between; min-height: 64px; padding: 0 18px; border-bottom: 1px solid #263540; }
.telemetry-panel__kicker,
.telemetry-panel__count { color: #617584; font: 600 9px/1 ui-monospace, Consolas, monospace; letter-spacing: 0.13em; }
.telemetry-panel h2 { margin: 5px 0 0; color: #dce8ef; font-size: 15px; }
.funnel-panel__flow { padding: 12px 18px 2px; }
.funnel-panel__stage { position: relative; display: grid; grid-template-columns: 34px 1fr auto; align-items: center; min-height: 56px; border-bottom: 1px solid #22313b; }
.funnel-panel__stage::before { content: ''; position: absolute; left: 12px; bottom: -9px; width: 1px; height: 18px; background: #385063; }
.funnel-panel__stage:last-child::before { display: none; }
.funnel-panel__index { color: #55a6ff; font: 600 10px/1 ui-monospace, Consolas, monospace; }
.funnel-panel__stage strong,
.funnel-panel__stage span { display: block; }
.funnel-panel__stage strong { color: #edf7ff; font: 700 18px/1 ui-monospace, Consolas, monospace; }
.funnel-panel__stage div span { margin-top: 4px; color: #718391; font-size: 11px; }
.funnel-panel__stage em { color: #2ac6a8; font: normal 600 11px/1 ui-monospace, Consolas, monospace; }
.funnel-panel__note { margin: 12px 18px 16px; color: #5d707e; font-size: 10px; line-height: 1.5; }
</style>
