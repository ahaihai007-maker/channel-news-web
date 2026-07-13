<template>
  <div class="plan-page">
    <div class="page-head">
      <div>
        <h2 class="page-title">发文计划</h2>
        <p class="page-subtitle">配置来源采集、AI 处理、模板装配与 Telegram 发布。</p>
      </div>
      <div class="head-actions">
        <el-button :icon="Refresh" @click="loadAll">刷新</el-button>
        <el-button type="primary" :icon="Plus" @click="openCreateDialog">新建计划</el-button>
      </div>
    </div>

    <el-card class="panel" shadow="never">
      <el-table v-loading="loading" :data="plans" stripe>
        <el-table-column prop="name" label="名称" min-width="160" />
        <el-table-column label="计划类型" width="150">
          <template #default="{ row }">{{ planTypeName(row.planType) }}</template>
        </el-table-column>
        <el-table-column label="启用" width="80">
          <template #default="{ row }">{{ row.enabled ? '是' : '否' }}</template>
        </el-table-column>
        <el-table-column label="Prompt" min-width="150">
          <template #default="{ row }">{{ promptName(row.promptKey) }}</template>
        </el-table-column>
        <el-table-column label="模板" min-width="140">
          <template #default="{ row }">{{ templateName(row.templateId) }}</template>
        </el-table-column>
        <el-table-column label="目标频道" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">{{ formatList(row.targetChannels) || '默认频道' }}</template>
        </el-table-column>
        <el-table-column prop="scheduleType" label="定时" width="100" />
        <el-table-column label="新文章触发" width="110">
          <template #default="{ row }">{{ row.triggerOnNewArticle ? '是' : '否' }}</template>
        </el-table-column>
        <el-table-column label="下次执行" width="180">
          <template #default="{ row }">{{ formatDateTime(row.nextRunAt) }}</template>
        </el-table-column>
        <el-table-column prop="lastStatus" label="上次状态" width="110" />
        <el-table-column label="采集状态" width="110">
          <template #default="{ row }">{{ row.planType === 'BILIBILI_AUTHOR_COMMENT' ? collectStatusName(row.lastCollectStatus) : '-' }}</template>
        </el-table-column>
        <el-table-column label="下次采集" width="180">
          <template #default="{ row }">{{ row.planType === 'BILIBILI_AUTHOR_COMMENT' ? formatDateTime(row.nextCollectAt) : '-' }}</template>
        </el-table-column>
        <el-table-column label="错误" min-width="160" show-overflow-tooltip>
          <template #default="{ row }">{{ row.lastCollectError || row.lastError || '-' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEditDialog(row)">编辑</el-button>
            <el-button link type="success" :loading="runningId === row.id" @click="runNow(row)">立即执行</el-button>
            <el-button link type="info" @click="openRuns(row)">日志</el-button>
            <el-button link type="danger" @click="deletePlan(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑发文计划' : '新建发文计划'" width="860px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="130px">
        <el-row :gutter="16">
          <el-col :span="14">
            <el-form-item label="计划名称" prop="name">
              <el-input v-model="form.name" maxlength="100" show-word-limit />
            </el-form-item>
          </el-col>
          <el-col :span="10">
            <el-form-item label="启用">
              <el-switch v-model="form.enabled" active-text="启用" inactive-text="停用" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="计划类型">
          <el-radio-group v-model="form.planType" @change="onPlanTypeChange">
            <el-radio-button value="ARTICLE_DRAFT">频道文章</el-radio-button>
            <el-radio-button value="BILIBILI_AUTHOR_COMMENT">Bilibili 作者留言</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item v-if="form.planType === 'ARTICLE_DRAFT'" label="来源频道">
          <el-select v-model="form.sourceChannels" multiple clearable filterable placeholder="不选则处理全部抓取稿" style="width: 100%;">
            <el-option v-for="channel in sourceChannelOptions" :key="channel" :label="channel" :value="channel" />
          </el-select>
        </el-form-item>

        <template v-if="form.planType === 'BILIBILI_AUTHOR_COMMENT'">
          <el-divider content-position="left">Bilibili 来源</el-divider>
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="空间 MID" prop="bilibiliSpaceMid">
                <el-input v-model="form.bilibiliSpaceMid" maxlength="32" placeholder="3546606469123022" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="开始采集时间">
                <el-time-picker v-model="form.bilibiliCollectTimeOfDay" format="HH:mm" value-format="HH:mm" style="width: 100%;" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="16">
            <el-col :span="24">
              <el-form-item label="失败重试间隔">
                <el-input-number v-model="form.bilibiliPollIntervalMinutes" :min="60" :max="1440" />
                <span class="field-unit">分钟</span>
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="完成标记">
            <el-input v-model="form.bilibiliCompletionMarker" maxlength="100" />
          </el-form-item>
        </template>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="Prompt" prop="promptKey">
              <el-select v-model="form.promptKey" filterable placeholder="选择 Prompt" style="width: 100%;">
                <el-option v-for="prompt in pipelineOptions" :key="prompt.value" :label="prompt.label" :value="prompt.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="每次数量" prop="maxArticlesPerRun">
              <el-input-number v-model="form.maxArticlesPerRun" :min="1" :max="50" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="使用模板">
              <el-switch v-model="form.useTemplate" />
            </el-form-item>
          </el-col>
          <el-col :span="16">
            <el-form-item label="文章模板" prop="templateId">
              <el-select v-model="form.templateId" clearable :disabled="!form.useTemplate" placeholder="选择模板" style="width: 100%;">
                <el-option v-for="template in templates" :key="template.id" :label="template.name" :value="template.id" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="Emoji 前缀">
              <el-switch v-model="form.useEmoji" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="地区标签">
              <el-select v-model="form.regionTag" clearable placeholder="自动识别">
                <el-option v-for="tag in regionTags" :key="tag.code" :label="tag.name" :value="tag.code" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="类型标签">
              <el-select v-model="form.typeTag" clearable placeholder="不设置">
                <el-option v-for="tag in typeTags" :key="tag.code" :label="tag.name" :value="tag.code" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="目标频道">
          <el-select v-model="form.targetChannels" multiple clearable filterable placeholder="不选则使用默认发布频道" style="width: 100%;">
            <el-option v-for="channel in targetChannelOptions" :key="channel.value" :label="channel.label" :value="channel.value" />
          </el-select>
        </el-form-item>

        <el-form-item label="自动发布">
          <el-switch v-model="form.autoPublish" active-text="处理后发布" inactive-text="处理后待审" />
        </el-form-item>

        <el-form-item v-if="form.planType === 'ARTICLE_DRAFT'" label="新文章触发">
          <el-switch
            v-model="form.triggerOnNewArticle"
            active-text="抓取入库后触发"
            inactive-text="仅按定时"
          />
        </el-form-item>

        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="定时类型" prop="scheduleType">
              <el-select v-model="form.scheduleType">
                <el-option label="一次" value="ONCE" />
                <el-option label="每日" value="DAILY" />
                <el-option label="每周" value="WEEKLY" />
                <el-option label="间隔" value="INTERVAL" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col v-if="form.scheduleType === 'ONCE'" :span="16">
            <el-form-item label="执行时间" prop="runAt">
              <el-date-picker v-model="form.runAt" type="datetime" value-format="YYYY-MM-DDTHH:mm:ss" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col v-if="form.scheduleType === 'DAILY' || form.scheduleType === 'WEEKLY'" :span="8">
            <el-form-item label="每日时间" prop="timeOfDay">
              <el-time-picker v-model="form.timeOfDay" format="HH:mm" value-format="HH:mm" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col v-if="form.scheduleType === 'WEEKLY'" :span="8">
            <el-form-item label="星期">
              <el-select v-model="form.weekdays" multiple style="width: 100%;">
                <el-option v-for="day in weekdayOptions" :key="day.value" :label="day.label" :value="day.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col v-if="form.scheduleType === 'INTERVAL'" :span="16">
            <el-form-item label="间隔分钟" prop="intervalMinutes">
              <el-input-number v-model="form.intervalMinutes" :min="1" :max="10080" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="savePlan">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="runsVisible" title="执行日志" width="900px">
      <el-table v-loading="runsLoading" :data="runs" stripe>
        <el-table-column prop="articleId" label="文章ID" width="90" />
        <el-table-column prop="promptKey" label="Prompt" min-width="130" />
        <el-table-column prop="stage" label="阶段" width="120" />
        <el-table-column prop="status" label="状态" width="100" />
        <el-table-column prop="telegramMessageId" label="消息ID" width="110" />
        <el-table-column prop="error" label="错误" min-width="180" show-overflow-tooltip />
        <el-table-column label="开始时间" width="180">
          <template #default="{ row }">{{ formatDateTime(row.startedAt) }}</template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh } from '@element-plus/icons-vue'
import {
  aiPromptApi,
  articlePublishPlanApi,
  messageTemplateApi,
  tagApi,
  telegramConfigApi
} from '@/services/api.js'

const plans = ref([])
const prompts = ref([])
const templates = ref([])
const regionTags = ref([])
const typeTags = ref([])
const sourceChannelOptions = ref([])
const targetChannelOptions = ref([])
const runs = ref([])
const loading = ref(false)
const saving = ref(false)
const runningId = ref(null)
const runsLoading = ref(false)
const dialogVisible = ref(false)
const runsVisible = ref(false)
const currentRunsPlan = ref(null)
const formRef = ref(null)

const weekdayOptions = [
  { label: '周一', value: 0 },
  { label: '周二', value: 1 },
  { label: '周三', value: 2 },
  { label: '周四', value: 3 },
  { label: '周五', value: 4 },
  { label: '周六', value: 5 },
  { label: '周日', value: 6 }
]

const fixedPipelineOptions = [
  { label: '标准新闻', value: 'standard' },
  { label: '新闻观点评论', value: 'news_view_commentart' }
]

const defaultForm = () => ({
  id: null,
  name: '',
  enabled: true,
  planType: 'ARTICLE_DRAFT',
  sourceChannels: [],
  promptKey: '',
  templateId: null,
  useTemplate: false,
  useEmoji: true,
  regionTag: '',
  typeTag: '',
  targetChannels: [],
  scheduleType: 'ONCE',
  runAt: '',
  timeOfDay: '09:00',
  weekdays: [],
  intervalMinutes: 60,
  maxArticlesPerRun: 1,
  autoPublish: false,
  triggerOnNewArticle: false,
  bilibiliSpaceMid: '',
  bilibiliCollectTimeOfDay: '06:00',
  bilibiliPollIntervalMinutes: 360,
  bilibiliCompletionMarker: '今天分享到此结束'
})

const form = reactive(defaultForm())

const pipelineOptions = computed(() => [
  ...fixedPipelineOptions,
  ...prompts.value
    .filter((prompt) => prompt.isActive && prompt.pipelineType !== 'auxiliary')
    .map((prompt) => ({
      label: prompt.name,
      value: prompt.promptKey
    }))
])

const rules = {
  name: [{ required: true, message: '请输入计划名称', trigger: 'blur' }],
  promptKey: [{ required: true, message: '请选择 Prompt', trigger: 'change' }],
  scheduleType: [{ required: true, message: '请选择定时类型', trigger: 'change' }],
  maxArticlesPerRun: [{ required: true, message: '请输入每次数量', trigger: 'change' }]
}

const loadAll = async () => {
  loading.value = true
  try {
    await Promise.all([
      loadPlans(),
      loadPrompts(),
      loadTemplates(),
      loadTelegramConfig(),
      loadTags()
    ])
  } finally {
    loading.value = false
  }
}

const loadPlans = async () => {
  const res = await articlePublishPlanApi.getList({ page: 1, pageSize: 100 })
  if (res.code === 200) {
    plans.value = res.data?.list || []
  }
}

const loadPrompts = async () => {
  const res = await aiPromptApi.getList()
  if (res.code === 200) {
    prompts.value = res.data || []
  }
}

const loadTemplates = async () => {
  const res = await messageTemplateApi.getList()
  if (res.code === 200) {
    templates.value = res.data || []
  }
}

const loadTelegramConfig = async () => {
  const res = await telegramConfigApi.get()
  if (res.code !== 200) return
  sourceChannelOptions.value = res.data?.monitorChannels || []
  targetChannelOptions.value = (res.data?.telegramChannels || []).map((channel) => ({
    label: channel,
    value: channel
  }))
}

const loadTags = async () => {
  const [regionRes, typeRes] = await Promise.all([tagApi.getRegions(), tagApi.getTypes()])
  if (regionRes.code === 200) regionTags.value = regionRes.data || []
  if (typeRes.code === 200) typeTags.value = typeRes.data || []
}

const resetForm = () => {
  Object.assign(form, defaultForm())
  form.promptKey = pipelineOptions.value[0]?.value || ''
}

const openCreateDialog = () => {
  resetForm()
  dialogVisible.value = true
}

const onPlanTypeChange = (planType) => {
  if (planType !== 'BILIBILI_AUTHOR_COMMENT') return
  form.scheduleType = 'DAILY'
  form.timeOfDay = '09:00'
  form.maxArticlesPerRun = 1
  form.triggerOnNewArticle = false
}

const openEditDialog = (row) => {
  Object.assign(form, {
    ...defaultForm(),
    ...row,
    runAt: row.runAt || '',
    timeOfDay: row.timeOfDay || '09:00',
    regionTag: row.regionTag || '',
    typeTag: row.typeTag || '',
    intervalMinutes: row.intervalMinutes || 60
  })
  dialogVisible.value = true
}

const buildPayload = () => ({
  name: form.name.trim(),
  enabled: form.enabled,
  planType: form.planType,
  sourceChannels: form.sourceChannels,
  promptKey: form.promptKey,
  templateId: form.useTemplate ? form.templateId : null,
  useTemplate: form.useTemplate,
  useEmoji: form.useEmoji,
  regionTag: form.regionTag || null,
  typeTag: form.typeTag || null,
  targetChannels: form.targetChannels,
  scheduleType: form.scheduleType,
  runAt: form.runAt || null,
  timeOfDay: form.timeOfDay || null,
  weekdays: form.weekdays,
  intervalMinutes: form.intervalMinutes,
  maxArticlesPerRun: form.maxArticlesPerRun,
  autoPublish: form.autoPublish,
  triggerOnNewArticle: form.planType === 'ARTICLE_DRAFT' && form.triggerOnNewArticle,
  bilibiliSpaceMid: form.planType === 'BILIBILI_AUTHOR_COMMENT' ? form.bilibiliSpaceMid.trim() : null,
  bilibiliCollectTimeOfDay: form.bilibiliCollectTimeOfDay,
  bilibiliPollIntervalMinutes: form.bilibiliPollIntervalMinutes,
  bilibiliCompletionMarker: form.bilibiliCompletionMarker
})

const savePlan = async () => {
  const valid = await formRef.value?.validate?.().catch(() => false)
  if (!valid) return
  if (form.planType === 'BILIBILI_AUTHOR_COMMENT' && !/^\d+$/.test(form.bilibiliSpaceMid.trim())) {
    ElMessage.error('请输入有效的 Bilibili 空间 MID')
    return
  }

  saving.value = true
  try {
    const payload = buildPayload()
    const res = form.id
      ? await articlePublishPlanApi.update(form.id, payload)
      : await articlePublishPlanApi.create(payload)
    if (res.code === 200) {
      ElMessage.success('发文计划保存成功')
      dialogVisible.value = false
      await loadPlans()
      return
    }
    ElMessage.error(res.message || '保存失败')
  } finally {
    saving.value = false
  }
}

const runNow = async (row) => {
  runningId.value = row.id
  try {
    const res = await articlePublishPlanApi.runNow(row.id)
    if (res.code === 200) {
      const collected = res.data?.collection?.collected || 0
      ElMessage.success(`执行完成，采集 ${collected} 篇，处理 ${res.data?.processed || 0} 篇`)
      await loadPlans()
      return
    }
    ElMessage.error(res.message || '执行失败')
  } finally {
    runningId.value = null
  }
}

const deletePlan = async (row) => {
  await ElMessageBox.confirm(`确定删除发文计划「${row.name}」吗？`, '确认删除', { type: 'warning' })
  const res = await articlePublishPlanApi.delete(row.id)
  if (res.code === 200) {
    ElMessage.success('删除成功')
    await loadPlans()
  } else {
    ElMessage.error(res.message || '删除失败')
  }
}

const openRuns = async (row) => {
  currentRunsPlan.value = row
  runsVisible.value = true
  await loadRuns()
}

const loadRuns = async () => {
  if (!currentRunsPlan.value) return
  runsLoading.value = true
  try {
    const res = await articlePublishPlanApi.getRuns(currentRunsPlan.value.id, { page: 1, pageSize: 50 })
    if (res.code === 200) {
      runs.value = res.data?.list || []
    }
  } finally {
    runsLoading.value = false
  }
}

const promptName = (key) => pipelineOptions.value.find((prompt) => prompt.value === key)?.label || key
const planTypeName = (type) => type === 'BILIBILI_AUTHOR_COMMENT' ? 'Bilibili 作者留言' : '频道文章'
const collectStatusName = (status) => ({
  WAITING_VIDEO: '等待影片',
  WAITING_COMMENT: '等待留言',
  BLOCKED_412: '请求受限',
  CONFIG_ERROR: '配置错误',
  INCOMPLETE: '留言不完整',
  SUCCESS: '成功',
  RUNNING: '采集中',
  FAILED: '失败'
}[status] || status || '-')
const templateName = (id) => {
  if (!id) return '-'
  return templates.value.find((template) => template.id === id)?.name || `#${id}`
}
const formatList = (items) => (items || []).join(', ')
const formatDateTime = (value) => value ? new Date(value).toLocaleString() : '-'

onMounted(loadAll)
</script>

<style scoped>
.plan-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
}

.page-title {
  margin: 0;
  font-size: 24px;
  line-height: 1.3;
  color: #1f2937;
}

.page-subtitle {
  margin: 6px 0 0;
  color: #6b7280;
  font-size: 14px;
}

.head-actions {
  display: flex;
  gap: 8px;
}

.panel {
  border-radius: 8px;
}

.field-unit {
  margin-left: 8px;
  color: #6b7280;
}
</style>
