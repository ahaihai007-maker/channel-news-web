<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, shallowRef } from 'vue'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, Plus, Refresh, UploadFilled, VideoCamera } from '@element-plus/icons-vue'
import { adApi } from '@/services/api.js'
import '@wangeditor/editor/dist/css/style.css'

const templates = ref([])
const schedules = ref([])
const logs = ref([])
const loading = ref(false)
const saving = ref(false)
const sendingId = ref(null)
const showTemplateDialog = ref(false)
const showScheduleDialog = ref(false)
const editingTemplate = ref(null)
const editorRef = shallowRef()
const uploadFiles = ref([])
const formRef = ref(null)
const scheduleFormRef = ref(null)

const templateForm = reactive({
  id: null,
  name: '',
  mode: 'CUSTOM',
  status: 'ACTIVE',
  customHtml: '',
  forwardMessageUrl: '',
  forwardFromChatId: '',
  forwardMessageIdsText: '',
  buttonsPerRow: 1,
  buttons: [],
  files: []
})

const scheduleForm = reactive({
  id: null,
  templateId: null,
  enabled: true,
  scheduleType: 'ONCE',
  runAt: '',
  timeOfDay: '',
  weekdays: [],
  intervalMinutes: 60
})

const templateRules = {
  name: [{ required: true, message: '请输入模板名称', trigger: 'blur' }],
  mode: [{ required: true, message: '请选择发送模式', trigger: 'change' }]
}

const scheduleRules = {
  templateId: [{ required: true, message: '请选择广告模板', trigger: 'change' }],
  scheduleType: [{ required: true, message: '请选择定时类型', trigger: 'change' }]
}

const toolbarConfig = {
  toolbarKeys: [
    'bold',
    'italic',
    'underline',
    'through',
    'code',
    'insertLink',
    'blockquote',
    'codeBlock',
    'undo',
    'redo'
  ]
}

const editorConfig = {
  placeholder: '仅保留 Telegram Bot HTML 支持的格式：粗体、斜体、下划线、删除线、链接、代码、引用。'
}

const handleEditorCreated = (editor) => {
  editorRef.value = editor
}

const activeTemplates = computed(() => templates.value.filter((item) => item.status === 'ACTIVE'))
const selectedTemplate = computed(() => templates.value.find((item) => item.id === scheduleForm.templateId))
const mediaCount = computed(() => templateForm.files.length + uploadFiles.value.length)
const activeButtons = computed(() => templateForm.buttons
  .map((button) => ({ text: button.text.trim(), url: button.url.trim() }))
  .filter((button) => button.text || button.url))
const hasMultiMediaButtonConflict = computed(() =>
  templateForm.mode === 'CUSTOM' && mediaCount.value > 1 && activeButtons.value.length > 0
)

const loadAll = async () => {
  loading.value = true
  try {
    await Promise.all([loadTemplates(), loadSchedules(), loadLogs()])
  } finally {
    loading.value = false
  }
}

const loadTemplates = async () => {
  const res = await adApi.getTemplates({ page: 1, pageSize: 100 })
  if (res.code === 200) {
    templates.value = res.data?.list || []
  }
}

const loadSchedules = async () => {
  const res = await adApi.getSchedules({ page: 1, pageSize: 100 })
  if (res.code === 200) {
    schedules.value = res.data?.list || []
  }
}

const loadLogs = async () => {
  const res = await adApi.getLogs({ page: 1, pageSize: 20 })
  if (res.code === 200) {
    logs.value = res.data?.list || []
  }
}

const resetTemplateForm = () => {
  Object.assign(templateForm, {
    id: null,
    name: '',
    mode: 'CUSTOM',
    status: 'ACTIVE',
    customHtml: '',
    forwardMessageUrl: '',
    forwardFromChatId: '',
    forwardMessageIdsText: '',
    buttonsPerRow: 1,
    buttons: [],
    files: []
  })
  uploadFiles.value = []
  editingTemplate.value = null
}

const openCreateTemplate = () => {
  resetTemplateForm()
  editorRef.value = null
  showTemplateDialog.value = true
}

const openEditTemplate = async (template) => {
  resetTemplateForm()
  editorRef.value = null
  showTemplateDialog.value = true

  try {
    const res = await adApi.getTemplate(template.id)
    const detail = normalizeTemplateDetail(res.code === 200 ? res.data : template)
    applyTemplateDetail(detail)
  } catch (error) {
    ElMessage.error(error.message || '加载广告模板失败')
    applyTemplateDetail(normalizeTemplateDetail(template))
  }
}

const applyTemplateDetail = (detail) => {
  editingTemplate.value = detail
  const buttonsData = normalizeButtons(detail.buttons)
  Object.assign(templateForm, {
    id: detail.id,
    name: detail.name,
    mode: detail.mode,
    status: detail.status,
    customHtml: detail.customHtml,
    forwardMessageUrl: detail.forwardMessageUrl,
    forwardFromChatId: detail.forwardFromChatId,
    forwardMessageIdsText: detail.forwardMessageIds.join(','),
    buttonsPerRow: buttonsData.buttonsPerRow,
    buttons: buttonsData.buttons,
    files: detail.files
  })
}

const normalizeTemplateDetail = (template) => {
  return {
    id: template?.id ?? null,
    name: template?.name || '',
    mode: template?.mode || 'CUSTOM',
    status: template?.status || 'ACTIVE',
    customHtml: template?.customHtml || '',
    forwardMessageUrl: template?.forwardMessageUrl || '',
    forwardFromChatId: template?.forwardFromChatId || '',
    forwardMessageIds: normalizeIdList(template?.forwardMessageIds),
    buttons: normalizeButtonPayload(template?.buttons),
    files: Array.isArray(template?.files) ? template.files : []
  }
}

const normalizeIdList = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => Number(item)).filter((item) => Number.isInteger(item) && item > 0)
  }
  if (typeof value === 'string') {
    return parseMessageIds(value)
  }
  return []
}

const normalizeButtonPayload = (buttons) => {
  if (typeof buttons !== 'string') return buttons
  try {
    return JSON.parse(buttons)
  } catch {
    return null
  }
}

const normalizeButtons = (buttons) => {
  if (buttons && !Array.isArray(buttons)) {
    return {
      buttonsPerRow: Math.max(Number(buttons.buttonsPerRow) || 1, 1),
      buttons: Array.isArray(buttons.buttons) ? buttons.buttons : []
    }
  }
  return { buttonsPerRow: 1, buttons: Array.isArray(buttons) ? buttons : [] }
}

const addButton = () => {
  templateForm.buttons.push({ text: '', url: '' })
}

const removeButton = (index) => {
  templateForm.buttons.splice(index, 1)
}

const buildTemplatePayload = () => {
  const buttons = templateForm.buttons
    .map((button) => ({ text: button.text.trim(), url: button.url.trim() }))
    .filter((button) => button.text || button.url)

  if (buttons.some((button) => !button.text || !button.url)) {
    throw new Error('按钮文字和链接必须同时填写')
  }
  if (templateForm.mode === 'CUSTOM' && mediaCount.value > 1 && buttons.length > 0) {
    throw new Error('Telegram 不支持多媒体组直接附加按钮。请移除按钮，或只保留 1 个媒体文件。')
  }

  return {
    name: templateForm.name.trim(),
    mode: templateForm.mode,
    status: templateForm.status,
    customHtml: templateForm.customHtml,
    forwardMessageUrl: templateForm.forwardMessageUrl.trim() || null,
    forwardFromChatId: templateForm.forwardFromChatId.trim() || null,
    forwardMessageIds: parseMessageIds(templateForm.forwardMessageIdsText),
    buttons: buttons.length
      ? {
          buttonsPerRow: Math.max(Number(templateForm.buttonsPerRow) || 1, 1),
          buttons
        }
      : null
  }
}

const parseMessageIds = (value) => {
  return value
    .split(',')
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isInteger(item) && item > 0)
}

const saveTemplate = async () => {
  const valid = await formRef.value?.validate?.().catch(() => false)
  if (!valid) return

  saving.value = true
  try {
    const payload = buildTemplatePayload()
    const res = templateForm.id
      ? await adApi.updateTemplate(templateForm.id, payload)
      : await adApi.createTemplate(payload)

    if (res.code !== 200) {
      ElMessage.error(res.message || '保存失败')
      return
    }

    const templateId = res.data.id
    const rawFiles = uploadFiles.value.map((item) => item.raw).filter(Boolean)
    if (rawFiles.length > 0) {
      const uploadRes = await adApi.uploadTemplateFiles(templateId, rawFiles)
      if (uploadRes.code !== 200) {
        ElMessage.error(uploadRes.message || '媒体上传失败')
        return
      }
    }

    ElMessage.success('广告模板保存成功')
    showTemplateDialog.value = false
    await loadTemplates()
  } catch (error) {
    ElMessage.error(error.message || '保存失败')
  } finally {
    saving.value = false
  }
}

const deleteTemplate = async (template) => {
  await ElMessageBox.confirm(`确定删除广告模板「${template.name}」吗？`, '确认删除', {
    type: 'warning'
  })
  const res = await adApi.deleteTemplate(template.id)
  if (res.code === 200) {
    ElMessage.success('删除成功')
    await loadAll()
  } else {
    ElMessage.error(res.message || '删除失败')
  }
}

const sendNow = async (template) => {
  sendingId.value = template.id
  try {
    const res = await adApi.sendNow(template.id)
    if (res.code === 200) {
      ElMessage.success('发送成功')
      await loadLogs()
    } else {
      ElMessage.error(res.message || '发送失败')
    }
  } finally {
    sendingId.value = null
  }
}

const deleteTemplateFile = async (file) => {
  if (!templateForm.id) return
  const res = await adApi.deleteTemplateFile(templateForm.id, file.id)
  if (res.code === 200) {
    templateForm.files = templateForm.files.filter((item) => item.id !== file.id)
    ElMessage.success('媒体已删除')
  } else {
    ElMessage.error(res.message || '删除失败')
  }
}

const moveFile = async (index, direction) => {
  const nextIndex = index + direction
  if (nextIndex < 0 || nextIndex >= templateForm.files.length) return
  const files = [...templateForm.files]
  const current = files[index]
  files[index] = files[nextIndex]
  files[nextIndex] = current
  templateForm.files = files
  if (templateForm.id) {
    await adApi.updateFileOrder(templateForm.id, files.map((file) => file.id))
  }
}

const beforeUpload = (file) => {
  const isMedia = file.type.startsWith('image/') || file.type.startsWith('video/')
  if (!isMedia) {
    ElMessage.error('只支持图片和影片')
    return false
  }
  const limitMb = file.type.startsWith('video/') ? 50 : 10
  if (file.size > limitMb * 1024 * 1024) {
    ElMessage.error(`文件不能超过 ${limitMb}MB`)
    return false
  }
  return true
}

const getFileUrl = (file) => {
  if (file.raw) return URL.createObjectURL(file.raw)
  if (file.url?.startsWith('/uploads')) return `${window.location.origin}${file.url}`
  return file.url
}

const isImageFile = (file) => {
  return file.fileType === 'image' || file.raw?.type?.startsWith('image/')
}

const formatFileSize = (bytes) => {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / Math.pow(1024, index)).toFixed(1)} ${units[index]}`
}

const resetScheduleForm = () => {
  Object.assign(scheduleForm, {
    id: null,
    templateId: templates.value[0]?.id || null,
    enabled: true,
    scheduleType: 'ONCE',
    runAt: '',
    timeOfDay: '',
    weekdays: [],
    intervalMinutes: 60
  })
}

const openCreateSchedule = () => {
  resetScheduleForm()
  showScheduleDialog.value = true
}

const openEditSchedule = (schedule) => {
  Object.assign(scheduleForm, {
    id: schedule.id,
    templateId: schedule.templateId,
    enabled: schedule.enabled,
    scheduleType: schedule.scheduleType,
    runAt: schedule.runAt || '',
    timeOfDay: schedule.timeOfDay || '',
    weekdays: schedule.weekdays || [],
    intervalMinutes: schedule.intervalMinutes || 60
  })
  showScheduleDialog.value = true
}

const saveSchedule = async () => {
  const valid = await scheduleFormRef.value?.validate?.().catch(() => false)
  if (!valid) return

  const payload = {
    templateId: scheduleForm.templateId,
    enabled: scheduleForm.enabled,
    scheduleType: scheduleForm.scheduleType,
    runAt: scheduleForm.runAt || null,
    timeOfDay: scheduleForm.timeOfDay || null,
    weekdays: scheduleForm.weekdays,
    intervalMinutes: scheduleForm.intervalMinutes
  }

  const res = scheduleForm.id
    ? await adApi.updateSchedule(scheduleForm.id, payload)
    : await adApi.createSchedule(payload)
  if (res.code === 200) {
    ElMessage.success('定时任务保存成功')
    showScheduleDialog.value = false
    await loadSchedules()
  } else {
    ElMessage.error(res.message || '保存失败')
  }
}

const deleteSchedule = async (schedule) => {
  await ElMessageBox.confirm('确定删除该定时任务吗？', '确认删除', { type: 'warning' })
  const res = await adApi.deleteSchedule(schedule.id)
  if (res.code === 200) {
    ElMessage.success('删除成功')
    await loadSchedules()
  } else {
    ElMessage.error(res.message || '删除失败')
  }
}

const formatDateTime = (value) => {
  if (!value) return '-'
  return new Date(value).toLocaleString()
}

const formatMode = (mode) => {
  return mode === 'FORWARD' ? '连结' : '自定义'
}

onMounted(loadAll)

onBeforeUnmount(() => {
  editorRef.value?.destroy?.()
})
</script>

<template>
  <div class="ad-page">
    <div class="page-head">
      <div>
        <h2 class="page-title">广告模板</h2>
        <p class="page-subtitle">编辑 Telegram 广告内容、上传多媒体，并配置定时发送。</p>
      </div>
      <div class="head-actions">
        <el-button :icon="Refresh" @click="loadAll">刷新</el-button>
        <el-button type="primary" :icon="Plus" @click="openCreateTemplate">新建广告</el-button>
      </div>
    </div>

    <el-row :gutter="16">
      <el-col :span="16">
        <el-card class="panel" shadow="never">
          <template #header>
            <div class="panel-head">
              <span>模板列表</span>
              <el-tag type="info">{{ templates.length }} 个</el-tag>
            </div>
          </template>
          <el-table v-loading="loading" :data="templates" stripe>
            <el-table-column prop="name" label="名称" min-width="180" />
            <el-table-column prop="mode" label="模式" width="110">
              <template #default="{ row }">
                <el-tag :type="row.mode === 'FORWARD' ? 'warning' : 'success'">
                  {{ formatMode(row.mode) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.status === 'ACTIVE' ? 'success' : 'info'">
                  {{ row.status === 'ACTIVE' ? '启用' : '停用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="媒体" width="100">
              <template #default="{ row }">{{ row.files?.length || 0 }}</template>
            </el-table-column>
            <el-table-column label="更新时间" width="190">
              <template #default="{ row }">{{ formatDateTime(row.updatedAt) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="250" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" @click="openEditTemplate(row)">编辑</el-button>
                <el-button link type="success" :loading="sendingId === row.id" @click="sendNow(row)">发送</el-button>
                <el-button link type="danger" @click="deleteTemplate(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card class="panel" shadow="never">
          <template #header>
            <div class="panel-head">
              <span>发送约束</span>
            </div>
          </template>
          <el-descriptions :column="1" border size="small">
            <el-descriptions-item label="富文本">HTML 白名单由后端过滤</el-descriptions-item>
            <el-descriptions-item label="多媒体">每组最多 10 个，后端自动分组</el-descriptions-item>
            <el-descriptions-item label="图片">JPG / PNG / GIF / WEBP，单个 10MB</el-descriptions-item>
            <el-descriptions-item label="影片">MP4 / MOV，单个 50MB</el-descriptions-item>
            <el-descriptions-item label="按钮">按钮只支持无媒体或单个媒体；多媒体组不能附加按钮</el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="panel schedule-panel" shadow="never">
      <template #header>
        <div class="panel-head">
          <span>定时任务</span>
          <el-button size="small" type="primary" :icon="Plus" @click="openCreateSchedule">新增定时</el-button>
        </div>
      </template>
      <el-table :data="schedules" stripe>
        <el-table-column prop="templateName" label="模板" min-width="180" />
        <el-table-column prop="scheduleType" label="类型" width="100" />
        <el-table-column label="启用" width="80">
          <template #default="{ row }">{{ row.enabled ? '是' : '否' }}</template>
        </el-table-column>
        <el-table-column label="下次发送" width="190">
          <template #default="{ row }">{{ formatDateTime(row.nextRunAt) }}</template>
        </el-table-column>
        <el-table-column prop="lastStatus" label="上次状态" width="120" />
        <el-table-column prop="lastError" label="错误" min-width="160" show-overflow-tooltip />
        <el-table-column label="操作" width="160">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEditSchedule(row)">编辑</el-button>
            <el-button link type="danger" @click="deleteSchedule(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-card class="panel schedule-panel" shadow="never">
      <template #header>
        <div class="panel-head">
          <span>发送日志</span>
        </div>
      </template>
      <el-table :data="logs" stripe>
        <el-table-column prop="templateId" label="模板ID" width="90" />
        <el-table-column prop="mode" label="模式" width="110">
          <template #default="{ row }">{{ formatMode(row.mode) }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="110" />
        <el-table-column label="消息ID" min-width="160">
          <template #default="{ row }">{{ row.telegramMessageIds?.join(', ') || '-' }}</template>
        </el-table-column>
        <el-table-column prop="error" label="错误" min-width="180" show-overflow-tooltip />
        <el-table-column label="时间" width="190">
          <template #default="{ row }">{{ formatDateTime(row.sentAt) }}</template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="showTemplateDialog" :title="templateForm.id ? '编辑广告模板' : '新建广告模板'" width="980px" destroy-on-close>
      <el-form ref="formRef" :model="templateForm" :rules="templateRules" label-width="120px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="模板名称" prop="name">
              <el-input v-model="templateForm.name" maxlength="100" show-word-limit />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="发送模式" prop="mode">
              <el-radio-group v-model="templateForm.mode">
                <el-radio label="CUSTOM">自定义</el-radio>
                <el-radio label="FORWARD">连结</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="状态">
              <el-switch v-model="templateForm.status" active-value="ACTIVE" inactive-value="INACTIVE" active-text="启用" inactive-text="停用" />
            </el-form-item>
          </el-col>
        </el-row>

        <template v-if="templateForm.mode === 'FORWARD'">
          <el-alert
            class="rule-alert"
            type="warning"
            :closable="false"
            show-icon
            title="连结模式使用 Telegram copyMessage 复制来源消息，不显示来源。可直接粘贴消息 URL；后端会解析 chat_id 和 message_id。Bot 必须有权限访问来源消息。"
          />
          <el-form-item label="消息 URL" class="form-block">
            <el-input
              v-model="templateForm.forwardMessageUrl"
              placeholder="例如 https://t.me/channel_name/123 或 https://t.me/c/1234567890/123"
              clearable
            />
          </el-form-item>
          <el-form-item label="来源 chat_id" class="form-block">
            <el-input v-model="templateForm.forwardFromChatId" placeholder="@channel 或 -100xxxxxxxxxx；填写 URL 时可留空" />
          </el-form-item>
          <el-form-item label="Message IDs">
            <el-input v-model="templateForm.forwardMessageIdsText" placeholder="多个 ID 用英文逗号分隔；填写 URL 时可留空" />
          </el-form-item>
        </template>

        <template v-else>
          <el-alert
            class="rule-alert"
            type="warning"
            :closable="false"
            show-icon
            title="Telegram 规则：多张图片或影片会作为媒体组发送，但媒体组不能附加 inline 按钮。需要按钮时只能使用无媒体或单个媒体。"
          />

          <el-form-item label="广告内容">
            <div class="editor-shell">
              <Toolbar :editor="editorRef" :defaultConfig="toolbarConfig" mode="default" class="editor-toolbar" />
              <Editor
                v-model="templateForm.customHtml"
                :defaultConfig="editorConfig"
                mode="default"
                class="editor-body"
                @onCreated="handleEditorCreated"
              />
            </div>
          </el-form-item>

          <el-form-item label="媒体上传">
            <div class="media-editor">
              <el-upload
                v-model:file-list="uploadFiles"
                action="#"
                :auto-upload="false"
                :before-upload="beforeUpload"
                multiple
                drag
                class="upload-box"
              >
                <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
                <div class="el-upload__text">拖拽图片或影片到此处，或点击选择</div>
                <template #tip>
                  <div class="el-upload__tip">支持多张图片和多个影片；保存模板时一起上传。</div>
                </template>
              </el-upload>

              <div v-if="templateForm.files.length || uploadFiles.length" class="media-grid">
                <div v-for="(file, index) in templateForm.files" :key="file.id" class="media-item">
                  <el-image v-if="isImageFile(file)" :src="getFileUrl(file)" fit="cover" class="media-thumb" />
                  <div v-else class="video-thumb"><el-icon><VideoCamera /></el-icon></div>
                  <div class="media-name" :title="file.fileName">{{ file.fileName }}</div>
                  <div class="media-actions">
                    <el-button link size="small" :disabled="index === 0" @click="moveFile(index, -1)">上移</el-button>
                    <el-button link size="small" :disabled="index === templateForm.files.length - 1" @click="moveFile(index, 1)">下移</el-button>
                    <el-button link type="danger" size="small" :icon="Delete" @click="deleteTemplateFile(file)" />
                  </div>
                </div>
                <div v-for="file in uploadFiles" :key="file.uid" class="media-item pending">
                  <el-image v-if="isImageFile(file)" :src="getFileUrl(file)" fit="cover" class="media-thumb" />
                  <div v-else class="video-thumb"><el-icon><VideoCamera /></el-icon></div>
                  <div class="media-name" :title="file.name">{{ file.name }}</div>
                  <div class="media-size">{{ formatFileSize(file.size) }}</div>
                </div>
              </div>
            </div>
          </el-form-item>

          <el-form-item label="Inline 按钮">
            <div class="button-editor">
              <el-alert
                v-if="hasMultiMediaButtonConflict"
                class="button-conflict-alert"
                type="error"
                :closable="false"
                show-icon
                title="当前选择了多个媒体文件并配置了按钮。系统不会拆分发送按钮文案；请移除按钮，或只保留 1 个媒体文件。"
              />
              <div class="button-toolbar">
                <el-input-number v-model="templateForm.buttonsPerRow" :min="1" :max="8" size="small" />
                <el-button size="small" type="primary" plain :icon="Plus" @click="addButton">添加按钮</el-button>
              </div>
              <div v-for="(button, index) in templateForm.buttons" :key="index" class="button-row">
                <el-input v-model="button.text" placeholder="按钮文字" />
                <el-input v-model="button.url" placeholder="https:// 或 tg:// 链接" />
                <el-button type="danger" :icon="Delete" circle @click="removeButton(index)" />
              </div>
            </div>
          </el-form-item>
        </template>
      </el-form>

      <template #footer>
        <el-button @click="showTemplateDialog = false">取消</el-button>
        <el-button type="primary" :loading="saving" :disabled="hasMultiMediaButtonConflict" @click="saveTemplate">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showScheduleDialog" title="定时发送" width="620px">
      <el-form ref="scheduleFormRef" :model="scheduleForm" :rules="scheduleRules" label-width="110px">
        <el-form-item label="广告模板" prop="templateId">
          <el-select v-model="scheduleForm.templateId" filterable placeholder="请选择模板" style="width: 100%">
            <el-option v-for="template in activeTemplates" :key="template.id" :label="template.name" :value="template.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="scheduleForm.enabled" />
        </el-form-item>
        <el-form-item label="定时类型" prop="scheduleType">
          <el-radio-group v-model="scheduleForm.scheduleType">
            <el-radio label="ONCE">一次</el-radio>
            <el-radio label="DAILY">每日</el-radio>
            <el-radio label="WEEKLY">每周</el-radio>
            <el-radio label="INTERVAL">间隔</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="scheduleForm.scheduleType === 'ONCE'" label="发送时间">
          <el-date-picker v-model="scheduleForm.runAt" type="datetime" value-format="YYYY-MM-DDTHH:mm:ss" style="width: 100%" />
        </el-form-item>
        <el-form-item v-if="['DAILY', 'WEEKLY'].includes(scheduleForm.scheduleType)" label="发送时刻">
          <el-time-picker v-model="scheduleForm.timeOfDay" value-format="HH:mm" format="HH:mm" style="width: 100%" />
        </el-form-item>
        <el-form-item v-if="scheduleForm.scheduleType === 'WEEKLY'" label="星期">
          <el-checkbox-group v-model="scheduleForm.weekdays">
            <el-checkbox :label="0">一</el-checkbox>
            <el-checkbox :label="1">二</el-checkbox>
            <el-checkbox :label="2">三</el-checkbox>
            <el-checkbox :label="3">四</el-checkbox>
            <el-checkbox :label="4">五</el-checkbox>
            <el-checkbox :label="5">六</el-checkbox>
            <el-checkbox :label="6">日</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item v-if="scheduleForm.scheduleType === 'INTERVAL'" label="间隔分钟">
          <el-input-number v-model="scheduleForm.intervalMinutes" :min="1" :max="10080" />
        </el-form-item>
        <el-alert v-if="selectedTemplate" type="info" :closable="false" :title="`当前模板：${selectedTemplate.name}`" />
      </el-form>
      <template #footer>
        <el-button @click="showScheduleDialog = false">取消</el-button>
        <el-button type="primary" @click="saveSchedule">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.ad-page {
  padding: 20px;
}

.page-head,
.panel-head,
.head-actions,
.button-toolbar,
.button-row,
.media-actions {
  display: flex;
  align-items: center;
}

.page-head,
.panel-head {
  justify-content: space-between;
  gap: 12px;
}

.page-title {
  margin: 0;
  color: #303133;
  font-size: 24px;
}

.page-subtitle {
  margin: 6px 0 0;
  color: #606266;
  font-size: 13px;
}

.panel {
  border-radius: 8px;
}

.schedule-panel {
  margin-top: 16px;
}

.form-block {
  margin-top: 16px;
}

.rule-alert {
  margin-bottom: 16px;
}

.editor-shell {
  width: 100%;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  overflow: hidden;
}

.editor-toolbar {
  border-bottom: 1px solid #dcdfe6;
}

.editor-body {
  height: 260px;
  overflow-y: auto;
}

.media-editor,
.upload-box,
.button-editor {
  width: 100%;
}

.media-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(128px, 1fr));
  gap: 12px;
  margin-top: 14px;
}

.media-item {
  padding: 8px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  background: #fafafa;
}

.media-item.pending {
  border-style: dashed;
}

.media-thumb,
.video-thumb {
  width: 100%;
  height: 88px;
  border-radius: 6px;
}

.video-thumb {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #eef1f5;
  color: #606266;
  font-size: 28px;
}

.media-name,
.media-size {
  margin-top: 6px;
  overflow: hidden;
  color: #606266;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.media-actions {
  justify-content: center;
  gap: 4px;
  margin-top: 4px;
}

.button-toolbar {
  justify-content: space-between;
  margin-bottom: 10px;
}

.button-conflict-alert {
  margin-bottom: 10px;
}

.button-row {
  gap: 8px;
  margin-bottom: 8px;
}

@media (max-width: 900px) {
  .page-head {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
