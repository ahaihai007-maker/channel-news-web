<template>
  <div class="sticker-library-page">
    <div class="page-header">
      <div>
        <h2>互动贴图库</h2>
        <p>通过 Telegram 贴图包链接导入，并为 AI 补充明确的使用语义。</p>
      </div>
      <el-button :loading="analysisConfigLoading" :disabled="batchBusy" @click="openAnalysisConfig">AI 解析设置</el-button>
    </div>

    <el-card class="import-card" shadow="never">
      <div class="import-row">
        <el-input
          v-model.trim="importUrl"
          placeholder="https://t.me/addstickers/guoguo777899"
          clearable
          @keyup.enter="importLibrary"
        />
        <el-button type="primary" :loading="importing" @click="importLibrary">解析并导入</el-button>
      </div>
      <div class="field-help">仅支持 https://t.me/addstickers/&lt;贴图包名称&gt;，不需要提供 file_id。</div>
    </el-card>

    <div class="library-layout">
      <el-card class="library-sidebar" shadow="never">
        <template #header>
          <div class="panel-header">
            <strong>贴图库</strong>
            <el-button text :loading="librariesLoading" @click="loadLibraries">刷新</el-button>
          </div>
        </template>
        <el-empty v-if="!librariesLoading && libraries.length === 0" description="暂无贴图库" :image-size="72" />
        <div v-else v-loading="librariesLoading" class="library-list">
          <button
            v-for="library in libraries"
            :key="library.id"
            type="button"
            class="library-item"
            :class="{ active: selectedLibraryId === library.id }"
            :disabled="batchBusy"
            @click="selectLibrary(library.id)"
          >
            <span class="library-title">{{ library.displayName || library.telegramTitle || library.sourceSetName }}</span>
            <span class="library-meta">
              <el-tag size="small" :type="libraryStatusType(library.status)">{{ libraryStatusLabel(library.status) }}</el-tag>
              <span>{{ library.stickerCount ?? library.stickers?.length ?? 0 }} 张</span>
            </span>
          </button>
        </div>
      </el-card>

      <el-card class="library-content" shadow="never">
        <el-empty v-if="!selectedLibraryId" description="选择贴图库后查看贴图" />
        <template v-else>
          <div v-loading="detailLoading" class="library-detail">
            <div class="detail-header">
              <div class="detail-copy">
                <el-input
                  v-model.trim="libraryForm.displayName"
                  class="library-name-input"
                  maxlength="100"
                  placeholder="贴图库显示名称"
                  :disabled="currentLibrary?.status === 'ARCHIVED'"
                />
                <el-input
                  v-model.trim="libraryForm.description"
                  maxlength="500"
                  placeholder="贴图库说明（可选）"
                  :disabled="currentLibrary?.status === 'ARCHIVED'"
                />
                <span class="source-name">{{ currentLibrary?.sourceUrl || currentLibrary?.sourceSetName }}</span>
              </div>
              <div class="detail-actions">
                <el-button
                  :loading="librarySaving"
                  :disabled="currentLibrary?.status === 'ARCHIVED' || batchBusy"
                  @click="saveLibrary"
                >保存资料</el-button>
                <el-button
                  v-if="currentLibrary?.status !== 'ACTIVE' && currentLibrary?.status !== 'ARCHIVED'"
                  type="success"
                  :loading="librarySaving"
                  :disabled="batchBusy"
                  @click="activateLibrary"
                >启用贴图库</el-button>
                <el-button
                  v-if="currentLibrary?.status === 'ACTIVE'"
                  :loading="librarySaving"
                  :disabled="batchBusy"
                  @click="deactivateLibrary"
                >停用贴图库</el-button>
                <el-button
                  :loading="syncing"
                  :disabled="currentLibrary?.status === 'ARCHIVED' || batchBusy"
                  @click="syncLibrary"
                >同步 Telegram</el-button>
                <el-button
                  type="primary"
                  plain
                  :loading="batchBusy"
                  :disabled="analyzableStickers.length === 0 || batchBusy"
                  @click="startBatchAnalysis"
                >AI 填写未完成贴图（{{ analyzableStickers.length }}）</el-button>
                <el-button
                  v-if="failedAnalysisItems.length > 0 && !batchBusy"
                  type="warning"
                  plain
                  @click="retryFailedAnalysis"
                >重试失败项目（{{ failedAnalysisItems.length }}）</el-button>
                <el-button
                  v-if="currentLibrary?.status !== 'ARCHIVED'"
                  type="danger"
                  plain
                  :disabled="batchBusy"
                  @click="archiveLibrary"
                >归档</el-button>
              </div>
            </div>

            <div class="toolbar">
              <el-radio-group v-model="statusFilter" size="small">
                <el-radio-button value="all">全部 {{ stickers.length }}</el-radio-button>
                <el-radio-button value="incomplete">缺少说明 {{ filterCounts.incomplete }}</el-radio-button>
                <el-radio-button value="enabled">已启用 {{ filterCounts.enabled }}</el-radio-button>
                <el-radio-button value="failed">预览失败 {{ filterCounts.failed }}</el-radio-button>
                <el-radio-button value="unavailable">不可用 {{ filterCounts.unavailable }}</el-radio-button>
              </el-radio-group>
              <el-input v-model.trim="keyword" class="search-input" clearable placeholder="搜索名称、含义或关键词" />
            </div>

            <el-empty v-if="!detailLoading && filteredStickers.length === 0" description="当前筛选条件下没有贴图" />
            <div v-else class="sticker-grid">
              <article
                v-for="sticker in filteredStickers"
                :key="sticker.id"
                class="sticker-card"
                :class="{ unavailable: !isStickerAvailable(sticker) }"
                @click="openStickerEditor(sticker)"
              >
                <div class="preview-box">
                  <TelegramStickerPreview :sticker="sticker" :alt="sticker.displayName || 'Telegram 贴图'" />
                </div>
                <div class="sticker-card-body">
                  <div class="sticker-title-row">
                    <strong>{{ sticker.displayName || '未命名贴图' }}</strong>
                    <el-switch
                      :model-value="Boolean(sticker.enabled)"
                      :disabled="batchBusy || currentLibrary?.status === 'ARCHIVED' || !canEnableSticker(sticker) || !isStickerAvailable(sticker)"
                      @click.stop
                      @change="toggleSticker(sticker, $event)"
                    />
                  </div>
                  <p>{{ sticker.meaning || '尚未填写含义' }}</p>
                  <div class="tag-row">
                    <el-tag size="small" type="info">{{ formatLabel(sticker.format) }}</el-tag>
                    <el-tag v-if="!canEnableSticker(sticker)" size="small" type="warning">缺少说明</el-tag>
                    <el-tag v-if="sticker.previewStatus === 'FAILED'" size="small" type="danger">预览失败</el-tag>
                    <el-tag v-if="sticker.telegramStatus !== 'AVAILABLE'" size="small" type="danger">不可用</el-tag>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </template>
      </el-card>
    </div>

    <el-drawer v-model="editorVisible" title="贴图语义说明" size="min(520px, 92vw)" destroy-on-close>
      <div v-if="editingSticker" class="sticker-editor">
        <div class="drawer-preview">
          <TelegramStickerPreview
            :sticker="editingSticker"
            :alt="stickerForm.displayName || 'Telegram 贴图'"
            always-play
          />
        </div>
        <div class="drawer-analysis-actions">
          <el-button
            type="primary"
            plain
            :loading="singleAnalysisLoading"
            :disabled="singleAnalysisLoading || !isStickerAnalyzable(editingSticker)"
            @click="analyzeEditingSticker"
          >AI 解析并填入空白字段</el-button>
          <span class="field-help">只填入当前为空的字段，不会自动保存或启用。</span>
        </div>
        <el-alert
          v-if="singleAnalysisResult"
          type="info"
          :closable="false"
          :title="`AI 置信度：${confidenceLabel(singleAnalysisResult.confidence)}`"
        >
          <template v-if="singleAnalysisResult.visualDescription" #default>
            {{ singleAnalysisResult.visualDescription }}
          </template>
        </el-alert>
        <el-form ref="stickerFormRef" :model="stickerForm" :rules="stickerRules" label-position="top">
          <el-form-item label="名称" prop="displayName">
            <el-input v-model.trim="stickerForm.displayName" maxlength="100" show-word-limit />
          </el-form-item>
          <el-form-item label="含义" prop="meaning">
            <el-input v-model.trim="stickerForm.meaning" type="textarea" :rows="3" maxlength="500" show-word-limit />
          </el-form-item>
          <el-form-item label="适用场景" prop="useWhen">
            <el-input v-model.trim="stickerForm.useWhen" type="textarea" :rows="3" maxlength="500" show-word-limit />
          </el-form-item>
          <el-form-item label="禁止场景" prop="avoidWhen">
            <el-input v-model.trim="stickerForm.avoidWhen" type="textarea" :rows="2" maxlength="2000" show-word-limit />
          </el-form-item>
          <el-form-item label="关键词">
            <el-select
              v-model="stickerForm.keywords"
              multiple
              filterable
              allow-create
              default-first-option
              :multiple-limit="20"
              placeholder="输入关键词后按 Enter"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="提供给 AI 使用">
            <el-switch
              v-model="stickerForm.enabled"
              :disabled="!isStickerAvailable(editingSticker)"
            />
            <span v-if="!isStickerAvailable(editingSticker)" class="inline-help">Telegram 已移除或贴图无效，不能启用。</span>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button :disabled="singleAnalysisLoading" @click="editorVisible = false">取消</el-button>
        <el-button type="primary" :loading="stickerSaving" :disabled="singleAnalysisLoading" @click="saveSticker">保存贴图</el-button>
      </template>
    </el-drawer>

    <el-dialog
      v-model="analysisConfigVisible"
      title="贴图 AI 解析设置"
      width="min(520px, 92vw)"
      :close-on-click-modal="!analysisConfigSaving"
    >
      <div v-loading="analysisConfigLoading" class="analysis-config-form">
        <el-form label-position="top">
          <el-form-item label="多模态模型 ID">
            <el-input
              v-model.trim="analysisConfig.modelId"
              placeholder="例如：供应商/支持图片输入的模型 ID"
              maxlength="200"
            />
            <div class="field-help">该模型只用于解析贴图画面，不影响互动线路的视觉模型。</div>
          </el-form-item>
          <el-form-item label="OpenRouter API Key">
            <el-tag :type="analysisConfig.apiKeyConfigured ? 'success' : 'danger'">
              {{ analysisConfig.apiKeyConfigured ? '已配置' : '未配置，请先到 AI 设置配置' }}
            </el-tag>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="analysisConfigVisible = false">取消</el-button>
        <el-button type="primary" :loading="analysisConfigSaving" :disabled="batchBusy" @click="saveAnalysisConfig">保存设置</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="batchProgress.visible"
      title="AI 批量填写贴图资讯"
      width="min(680px, 94vw)"
      :show-close="!batchProgress.running"
      :close-on-click-modal="!batchProgress.running"
      :close-on-press-escape="!batchProgress.running"
    >
      <el-progress :percentage="batchProgressPercentage" :status="batchProgress.failed ? 'warning' : undefined" />
      <div class="batch-summary">
        <span>总数 {{ batchProgress.total }}</span>
        <span>成功 {{ batchProgress.success }}</span>
        <span>失败 {{ batchProgress.failed }}</span>
        <span>跳过 {{ batchProgress.skipped }}</span>
      </div>
      <div class="batch-items">
        <div v-for="item in batchProgress.items" :key="item.stickerId" class="batch-item">
          <span>{{ item.label }}</span>
          <div class="batch-item-result">
            <span v-if="item.error" class="batch-error">{{ item.error }}</span>
            <el-tag size="small" :type="analysisStatusType(item.status)">
              {{ analysisStatusLabel(item.status) }}
            </el-tag>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button v-if="batchProgress.running" type="warning" @click="cancelBatchAnalysis">停止后续项目</el-button>
        <el-button
          v-if="!batchProgress.running && failedAnalysisItems.length > 0"
          type="warning"
          plain
          @click="retryFailedAnalysis"
        >重试失败项目</el-button>
        <el-button v-if="!batchProgress.running" @click="batchProgress.visible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import TelegramStickerPreview from '../../components/admin/interaction-stickers/TelegramStickerPreview.vue'
import { interactionStickerApi } from '../../services/api.js'
import { captureStickerFrames } from '../../utils/stickerFrameCapture.js'

const ADD_STICKERS_URL = /^https:\/\/t\.me\/addstickers\/[A-Za-z0-9_]{1,64}\/?$/i
const ANALYSIS_CONCURRENCY = 2
const ANALYSIS_TEXT_FIELDS = ['displayName', 'meaning', 'useWhen', 'avoidWhen']

const libraries = ref([])
const selectedLibraryId = ref(null)
const currentLibrary = ref(null)
const stickers = ref([])
const importUrl = ref('')
const importing = ref(false)
const librariesLoading = ref(false)
const detailLoading = ref(false)
const syncing = ref(false)
const librarySaving = ref(false)
const stickerSaving = ref(false)
const editorVisible = ref(false)
const editingSticker = ref(null)
const stickerFormRef = ref(null)
const statusFilter = ref('all')
const keyword = ref('')
const analysisConfigVisible = ref(false)
const analysisConfigLoading = ref(false)
const analysisConfigSaving = ref(false)
const singleAnalysisLoading = ref(false)
const singleAnalysisResult = ref(null)

const libraryForm = reactive({ displayName: '', description: '' })
const analysisConfig = reactive({ modelId: '', apiKeyConfigured: false })
const batchProgress = reactive({
  visible: false,
  starting: false,
  running: false,
  cancelRequested: false,
  total: 0,
  completed: 0,
  success: 0,
  failed: 0,
  skipped: 0,
  items: []
})
const stickerForm = reactive({
  displayName: '',
  meaning: '',
  useWhen: '',
  avoidWhen: '',
  keywords: [],
  enabled: false
})

const stickerRules = {
  displayName: [{ required: true, message: '请输入贴图名称', trigger: 'blur' }],
  meaning: [{ required: true, message: '请输入贴图含义', trigger: 'blur' }],
  useWhen: [{ required: true, message: '请输入适用场景', trigger: 'blur' }],
  avoidWhen: [{ required: true, message: '请输入禁止场景', trigger: 'blur' }]
}

const requireSuccess = (response) => {
  if (response.code !== 200) throw new Error(response.message || '请求失败')
  return response.data
}

const responseItems = (data, key) => {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.[key])) return data[key]
  if (Array.isArray(data?.items)) return data.items
  return []
}

const libraryStatusLabel = (status) => ({ DRAFT: '草稿', ACTIVE: '已启用', ARCHIVED: '已归档' }[status] || status || '草稿')
const libraryStatusType = (status) => ({ ACTIVE: 'success', ARCHIVED: 'info', DRAFT: 'warning' }[status] || 'info')
const formatLabel = (format) => ({ STATIC: '静态', ANIMATED: '动画', VIDEO: '视频' }[format] || format || '未知')
const isStickerAvailable = (sticker) => sticker.telegramStatus === 'AVAILABLE'
const confidenceLabel = (confidence) => ({ HIGH: '高', MEDIUM: '中', LOW: '低' }[confidence] || '未知')
const analysisStatusLabel = (status) => ({
  WAITING: '等待中',
  CAPTURING: '抽取画面',
  ANALYZING: '模型解析',
  SUCCESS: '成功',
  FAILED: '失败',
  SKIPPED: '已跳过'
}[status] || status)
const analysisStatusType = (status) => ({
  SUCCESS: 'success',
  FAILED: 'danger',
  SKIPPED: 'info',
  CAPTURING: 'primary',
  ANALYZING: 'primary',
  WAITING: 'info'
}[status] || 'info')
const canEnableSticker = (sticker) => Boolean(
  sticker.displayName?.trim()
  && sticker.meaning?.trim()
  && sticker.useWhen?.trim()
  && sticker.avoidWhen?.trim()
)
const hasMissingAnalysisFields = (sticker) => (
  ANALYSIS_TEXT_FIELDS.some((field) => !sticker?.[field]?.trim())
  || !Array.isArray(sticker?.keywords)
  || sticker.keywords.length === 0
)
const isStickerAnalyzable = (sticker) => Boolean(
  sticker
  && currentLibrary.value?.status !== 'ARCHIVED'
  && sticker.telegramStatus === 'AVAILABLE'
  && sticker.previewStatus === 'SUCCESS'
  && !sticker.enabled
  && hasMissingAnalysisFields(sticker)
)

const filterCounts = computed(() => ({
  incomplete: stickers.value.filter((item) => !canEnableSticker(item)).length,
  enabled: stickers.value.filter((item) => item.enabled).length,
  failed: stickers.value.filter((item) => item.previewStatus === 'FAILED').length,
  unavailable: stickers.value.filter((item) => item.telegramStatus !== 'AVAILABLE').length
}))

const analyzableStickers = computed(() => stickers.value.filter(isStickerAnalyzable))
const failedAnalysisItems = computed(() => batchProgress.items.filter((item) => item.status === 'FAILED'))
const batchBusy = computed(() => batchProgress.starting || batchProgress.running)
const batchProgressPercentage = computed(() => (
  batchProgress.total ? Math.round((batchProgress.completed / batchProgress.total) * 100) : 0
))

const filteredStickers = computed(() => {
  const query = keyword.value.toLowerCase()
  return stickers.value.filter((sticker) => {
    const matchesStatus = statusFilter.value === 'all'
      || (statusFilter.value === 'incomplete' && !canEnableSticker(sticker))
      || (statusFilter.value === 'enabled' && sticker.enabled)
      || (statusFilter.value === 'failed' && sticker.previewStatus === 'FAILED')
      || (statusFilter.value === 'unavailable' && sticker.telegramStatus !== 'AVAILABLE')
    if (!matchesStatus) return false
    if (!query) return true
    return [sticker.displayName, sticker.meaning, ...(sticker.keywords || [])]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(query)
  })
})

const setLibraryDetail = (data) => {
  const library = data?.library || data
  currentLibrary.value = library
  stickers.value = responseItems(data?.stickers ? data : library, 'stickers')
  libraryForm.displayName = library?.displayName || library?.telegramTitle || ''
  libraryForm.description = library?.description || ''
}

const loadAnalysisConfig = async () => {
  analysisConfigLoading.value = true
  try {
    const data = requireSuccess(await interactionStickerApi.getAnalysisConfig())
    Object.assign(analysisConfig, {
      modelId: data?.modelId || '',
      apiKeyConfigured: Boolean(data?.apiKeyConfigured)
    })
    return data
  } catch (error) {
    ElMessage.error(error.response?.data?.message || error.message || 'AI 解析设置加载失败')
    return null
  } finally {
    analysisConfigLoading.value = false
  }
}

const openAnalysisConfig = async () => {
  if (batchBusy.value) return
  analysisConfigVisible.value = true
  await loadAnalysisConfig()
}

const saveAnalysisConfig = async () => {
  if (batchBusy.value) return
  if (!analysisConfig.modelId.trim()) {
    ElMessage.warning('请输入支持图片输入的多模态模型 ID')
    return
  }
  analysisConfigSaving.value = true
  try {
    const data = requireSuccess(await interactionStickerApi.updateAnalysisConfig({
      modelId: analysisConfig.modelId.trim()
    }))
    Object.assign(analysisConfig, {
      modelId: data?.modelId || analysisConfig.modelId.trim(),
      apiKeyConfigured: Boolean(data?.apiKeyConfigured)
    })
    analysisConfigVisible.value = false
    ElMessage.success('贴图 AI 解析设置已保存')
  } catch (error) {
    ElMessage.error(error.response?.data?.message || error.message || 'AI 解析设置保存失败')
  } finally {
    analysisConfigSaving.value = false
  }
}

const ensureAnalysisConfigured = async () => {
  const config = await loadAnalysisConfig()
  if (!config) return false
  if (!config.modelId) {
    analysisConfigVisible.value = true
    ElMessage.warning('请先配置贴图多模态解析模型')
    return false
  }
  if (!config.apiKeyConfigured) {
    analysisConfigVisible.value = true
    ElMessage.warning('请先到 AI 设置配置 OpenRouter API Key')
    return false
  }
  return true
}

const loadLibraries = async () => {
  librariesLoading.value = true
  try {
    const data = requireSuccess(await interactionStickerApi.getLibraries())
    libraries.value = responseItems(data, 'libraries')
    if (selectedLibraryId.value && !libraries.value.some((item) => item.id === selectedLibraryId.value)) {
      selectedLibraryId.value = null
      currentLibrary.value = null
      stickers.value = []
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.message || error.message || '贴图库加载失败')
  } finally {
    librariesLoading.value = false
  }
}

const selectLibrary = async (id) => {
  if (batchBusy.value && id !== selectedLibraryId.value) {
    ElMessage.warning('批量解析执行中，不能切换贴图库')
    return
  }
  selectedLibraryId.value = id
  detailLoading.value = true
  try {
    const data = requireSuccess(await interactionStickerApi.getLibrary(id))
    setLibraryDetail(data)
  } catch (error) {
    ElMessage.error(error.response?.data?.message || error.message || '贴图库详情加载失败')
  } finally {
    detailLoading.value = false
  }
}

const importLibrary = async () => {
  if (!ADD_STICKERS_URL.test(importUrl.value)) {
    ElMessage.warning('请输入有效的 Telegram addstickers 链接')
    return
  }
  importing.value = true
  try {
    const response = await interactionStickerApi.importSet({ sourceUrl: importUrl.value })
    if (response.code === 409) {
      ElMessage.warning(response.message || '该贴图包已导入，请使用同步功能')
      if (response.data?.libraryId) await selectLibrary(response.data.libraryId)
      return
    }
    const data = requireSuccess(response)
    ElMessage.success('贴图包已导入，请补充每张贴图的语义说明')
    importUrl.value = ''
    await loadLibraries()
    const id = data?.id || data?.library?.id
    if (id) await selectLibrary(id)
  } catch (error) {
    ElMessage.error(error.response?.data?.message || error.message || '贴图包导入失败')
  } finally {
    importing.value = false
  }
}

const saveLibraryPayload = async (extra = {}) => {
  const data = requireSuccess(await interactionStickerApi.updateLibrary(selectedLibraryId.value, {
    displayName: libraryForm.displayName,
    description: libraryForm.description,
    status: currentLibrary.value?.status || 'DRAFT',
    ...extra
  }))
  setLibraryDetail(data)
  await loadLibraries()
}

const saveLibrary = async () => {
  if (!libraryForm.displayName) {
    ElMessage.warning('请输入贴图库显示名称')
    return
  }
  librarySaving.value = true
  try {
    await saveLibraryPayload()
    ElMessage.success('贴图库资料已保存')
  } catch (error) {
    ElMessage.error(error.response?.data?.message || error.message || '贴图库保存失败')
  } finally {
    librarySaving.value = false
  }
}

const activateLibrary = async () => {
  librarySaving.value = true
  try {
    await saveLibraryPayload({ status: 'ACTIVE' })
    ElMessage.success('贴图库已启用')
  } catch (error) {
    ElMessage.error(error.response?.data?.message || error.message || '贴图库启用失败')
  } finally {
    librarySaving.value = false
  }
}

const deactivateLibrary = async () => {
  librarySaving.value = true
  try {
    await saveLibraryPayload({ status: 'DRAFT' })
    ElMessage.success('贴图库已停用')
  } catch (error) {
    ElMessage.error(error.response?.data?.message || error.message || '贴图库停用失败')
  } finally {
    librarySaving.value = false
  }
}

const syncLibrary = async () => {
  syncing.value = true
  try {
    requireSuccess(await interactionStickerApi.syncLibrary(selectedLibraryId.value))
    ElMessage.success('Telegram 贴图包已同步')
    await selectLibrary(selectedLibraryId.value)
    await loadLibraries()
  } catch (error) {
    ElMessage.error(error.response?.data?.message || error.message || '贴图包同步失败')
  } finally {
    syncing.value = false
  }
}

const archiveLibrary = async () => {
  try {
    await ElMessageBox.confirm('归档后不能再为新线路选择该贴图库，历史资料会保留。', '归档贴图库', { type: 'warning' })
    requireSuccess(await interactionStickerApi.archiveLibrary(selectedLibraryId.value))
    ElMessage.success('贴图库已归档')
    await selectLibrary(selectedLibraryId.value)
    await loadLibraries()
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      ElMessage.error(error.response?.data?.message || error.message || '贴图库归档失败')
    }
  }
}

const openStickerEditor = (sticker) => {
  if (singleAnalysisLoading.value) {
    ElMessage.warning('当前贴图正在解析，完成前不能切换编辑项目')
    return
  }
  if (batchBusy.value) {
    ElMessage.warning('批量解析执行中，暂不能编辑贴图')
    return
  }
  if (currentLibrary.value?.status === 'ARCHIVED') {
    ElMessage.warning('已归档贴图库为只读状态')
    return
  }
  editingSticker.value = sticker
  Object.assign(stickerForm, {
    displayName: sticker.displayName || '',
    meaning: sticker.meaning || '',
    useWhen: sticker.useWhen || '',
    avoidWhen: sticker.avoidWhen || '',
    keywords: Array.isArray(sticker.keywords) ? [...sticker.keywords] : [],
    enabled: Boolean(sticker.enabled)
  })
  singleAnalysisResult.value = null
  editorVisible.value = true
}

const mergeStickerUpdate = (stickerId, updated) => {
  if (!updated) return
  const existing = stickers.value.find((item) => item.id === stickerId)
  if (existing) Object.assign(existing, updated)
  if (editingSticker.value?.id === stickerId) Object.assign(editingSticker.value, updated)
}

const updateSticker = async (sticker, payload) => {
  const data = requireSuccess(await interactionStickerApi.updateSticker(sticker.id, payload))
  const updated = data?.sticker || data
  mergeStickerUpdate(sticker.id, updated)
}

const requestStickerAnalysis = async (sticker, applyMode, onStatus = () => {}) => {
  onStatus('CAPTURING')
  const frames = await captureStickerFrames(sticker)
  onStatus('ANALYZING')
  const payload = { frames, applyMode }
  if (sticker.updatedAt) payload.expectedUpdatedAt = sticker.updatedAt
  return requireSuccess(await interactionStickerApi.analyzeSticker(sticker.id, payload))
}

const fillBlankStickerFormFields = (suggestion) => {
  let filled = 0
  for (const field of ANALYSIS_TEXT_FIELDS) {
    if (!stickerForm[field]?.trim() && suggestion?.[field]?.trim()) {
      stickerForm[field] = suggestion[field].trim()
      filled += 1
    }
  }
  if (stickerForm.keywords.length === 0 && Array.isArray(suggestion?.keywords) && suggestion.keywords.length > 0) {
    stickerForm.keywords = [...suggestion.keywords]
    filled += 1
  }
  return filled
}

const analyzeEditingSticker = async () => {
  if (singleAnalysisLoading.value) return
  const targetSticker = editingSticker.value
  const targetStickerId = targetSticker?.id
  if (!targetSticker || !isStickerAnalyzable(targetSticker)) return
  singleAnalysisLoading.value = true
  try {
    if (!await ensureAnalysisConfigured()) return
    if (!editorVisible.value || editingSticker.value?.id !== targetStickerId) return
    const data = await requestStickerAnalysis(targetSticker, 'PREVIEW')
    if (!editorVisible.value || editingSticker.value?.id !== targetStickerId) return
    if (!data?.suggestion) throw new Error('模型未返回贴图建议')
    const filled = fillBlankStickerFormFields(data.suggestion)
    singleAnalysisResult.value = data.suggestion
    if (filled > 0) ElMessage.success(`AI 已填入 ${filled} 项空白资讯，请检查后保存`)
    else ElMessage.warning('当前表单没有可填入的空白字段')
  } catch (error) {
    ElMessage.error(error.response?.data?.message || error.message || '贴图 AI 解析失败')
  } finally {
    singleAnalysisLoading.value = false
  }
}

const progressItemLabel = (sticker) => (
  sticker.displayName || `贴图 ${Number.isInteger(sticker.sortOrder) ? sticker.sortOrder + 1 : sticker.id}`
)

const resetBatchProgress = (targets) => {
  Object.assign(batchProgress, {
    visible: true,
    running: true,
    cancelRequested: false,
    total: targets.length,
    completed: 0,
    success: 0,
    failed: 0,
    skipped: 0,
    items: targets.map((sticker) => ({
      stickerId: sticker.id,
      label: progressItemLabel(sticker),
      status: 'WAITING',
      error: ''
    }))
  })
}

const runBatchAnalysis = async (targets) => {
  resetBatchProgress(targets)
  let cursor = 0

  const worker = async () => {
    while (!batchProgress.cancelRequested) {
      const index = cursor
      cursor += 1
      if (index >= targets.length) return

      const sticker = targets[index]
      const progressItem = batchProgress.items[index]
      try {
        const data = await requestStickerAnalysis(sticker, 'FILL_MISSING', (status) => {
          progressItem.status = status
        })
        mergeStickerUpdate(sticker.id, data?.sticker)
        progressItem.status = 'SUCCESS'
        batchProgress.success += 1
      } catch (error) {
        progressItem.status = 'FAILED'
        progressItem.error = error.response?.data?.message || error.message || '解析失败'
        batchProgress.failed += 1
      } finally {
        batchProgress.completed += 1
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(ANALYSIS_CONCURRENCY, targets.length) }, () => worker()))

  if (batchProgress.cancelRequested) {
    for (const item of batchProgress.items) {
      if (item.status === 'WAITING') {
        item.status = 'SKIPPED'
        batchProgress.skipped += 1
        batchProgress.completed += 1
      }
    }
  }
  batchProgress.running = false
  await loadLibraries()

  if (batchProgress.cancelRequested) {
    ElMessage.warning(`批量解析已停止，成功 ${batchProgress.success}，失败 ${batchProgress.failed}，跳过 ${batchProgress.skipped}`)
  } else if (batchProgress.failed > 0) {
    ElMessage.warning(`批量解析完成，成功 ${batchProgress.success}，失败 ${batchProgress.failed}`)
  } else {
    ElMessage.success(`批量解析完成，成功填写 ${batchProgress.success} 张贴图`)
  }
}

const startBatchAnalysis = async () => {
  if (analyzableStickers.value.length === 0 || batchBusy.value) return
  const libraryId = selectedLibraryId.value
  batchProgress.starting = true
  try {
    if (!await ensureAnalysisConfigured()) return
    if (selectedLibraryId.value !== libraryId || currentLibrary.value?.status === 'ARCHIVED') return
    const targets = [...analyzableStickers.value]
    if (targets.length === 0) return
    await ElMessageBox.confirm(
      `将使用 ${analysisConfig.modelId} 解析 ${targets.length} 张贴图，只填写空白字段且不会自动启用。`,
      'AI 批量填写贴图资讯',
      { type: 'warning', confirmButtonText: '开始解析' }
    )
    if (selectedLibraryId.value !== libraryId) return
    editorVisible.value = false
    await runBatchAnalysis(targets)
  } catch (error) {
    if (error === 'cancel' || error === 'close') return
    ElMessage.error(error.response?.data?.message || error.message || '无法启动批量解析')
  } finally {
    batchProgress.starting = false
  }
}

const cancelBatchAnalysis = () => {
  batchProgress.cancelRequested = true
}

const retryFailedAnalysis = async () => {
  if (batchBusy.value) return
  const failedIds = new Set(failedAnalysisItems.value.map((item) => item.stickerId))
  batchProgress.starting = true
  try {
    await selectLibrary(selectedLibraryId.value)
    const targets = stickers.value.filter((sticker) => failedIds.has(sticker.id) && isStickerAnalyzable(sticker))
    if (targets.length === 0) {
      ElMessage.warning('没有仍符合条件的失败项目')
      return
    }
    if (!await ensureAnalysisConfigured()) return
    await runBatchAnalysis(targets)
  } finally {
    batchProgress.starting = false
  }
}

const saveSticker = async () => {
  try {
    await stickerFormRef.value.validate()
  } catch {
    return
  }
  stickerSaving.value = true
  try {
    await updateSticker(editingSticker.value, { ...stickerForm, keywords: [...stickerForm.keywords] })
    ElMessage.success('贴图说明已保存')
    editorVisible.value = false
    await selectLibrary(selectedLibraryId.value)
    await loadLibraries()
  } catch (error) {
    ElMessage.error(error.response?.data?.message || error.message || '贴图保存失败')
  } finally {
    stickerSaving.value = false
  }
}

const toggleSticker = async (sticker, enabled) => {
  if (enabled && !canEnableSticker(sticker)) {
    ElMessage.warning('填写名称、含义、适用场景和禁止场景后才能启用')
    return
  }
  try {
    await updateSticker(sticker, {
      displayName: sticker.displayName,
      meaning: sticker.meaning,
      useWhen: sticker.useWhen,
      avoidWhen: sticker.avoidWhen || '',
      keywords: sticker.keywords || [],
      enabled
    })
    ElMessage.success(enabled ? '贴图已启用' : '贴图已停用')
    await selectLibrary(selectedLibraryId.value)
    await loadLibraries()
  } catch (error) {
    ElMessage.error(error.response?.data?.message || error.message || '贴图状态更新失败')
  }
}

onMounted(loadLibraries)
</script>

<style scoped>
.sticker-library-page { width: 100%; }

.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 20px; }
.page-header h2 { margin: 0; color: #1f2937; font-size: 24px; }
.page-header p { margin-top: 6px; color: #6b7280; font-size: 14px; }

.import-card { margin-bottom: 20px; border-radius: 8px; }
.import-row { display: flex; gap: 12px; max-width: 840px; }
.field-help, .source-name, .inline-help { color: #6b7280; font-size: 12px; line-height: 1.5; }
.field-help { margin-top: 8px; }

.library-layout { display: grid; grid-template-columns: 260px minmax(0, 1fr); gap: 18px; align-items: start; }
.library-sidebar, .library-content { border-radius: 8px; }
.panel-header, .detail-header, .toolbar, .sticker-title-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.library-list { display: flex; flex-direction: column; gap: 8px; min-height: 160px; }
.library-item { display: flex; flex-direction: column; gap: 8px; width: 100%; padding: 12px; border: 1px solid #e5e7eb; border-radius: 7px; background: #fff; color: #374151; text-align: left; cursor: pointer; }
.library-item:hover, .library-item.active { border-color: #93c5fd; background: #eff6ff; }
.library-item:disabled { cursor: not-allowed; opacity: .65; }
.library-title { overflow: hidden; font-size: 14px; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
.library-meta { display: flex; align-items: center; justify-content: space-between; color: #6b7280; font-size: 12px; }

.library-detail { min-height: 440px; }
.detail-header { align-items: flex-start; padding-bottom: 18px; border-bottom: 1px solid #e5e7eb; }
.detail-copy { display: grid; flex: 1; max-width: 560px; gap: 8px; }
.library-name-input { max-width: 360px; }
.detail-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; }
.toolbar { margin: 18px 0; flex-wrap: wrap; }
.search-input { width: 260px; }

.sticker-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 14px; }
.sticker-card { overflow: hidden; border: 1px solid #e5e7eb; border-radius: 9px; background: #fff; cursor: pointer; transition: border-color .18s ease, box-shadow .18s ease; }
.sticker-card:hover { border-color: #93c5fd; box-shadow: 0 6px 18px rgba(31, 41, 55, .08); }
.sticker-card.unavailable { opacity: .72; }
.preview-box { height: 160px; padding: 12px; background: #f8fafc; box-sizing: border-box; }
.sticker-card-body { padding: 12px; }
.sticker-title-row strong { min-width: 0; overflow: hidden; color: #1f2937; font-size: 14px; text-overflow: ellipsis; white-space: nowrap; }
.sticker-card-body p { min-height: 36px; margin: 8px 0; overflow: hidden; color: #6b7280; font-size: 12px; line-height: 1.5; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
.tag-row { display: flex; flex-wrap: wrap; gap: 5px; }

.sticker-editor { display: flex; flex-direction: column; gap: 20px; }
.drawer-preview { width: 220px; height: 220px; margin: 0 auto; }
.drawer-analysis-actions { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; }
.inline-help { margin-left: 10px; }

.analysis-config-form { min-height: 140px; }
.batch-summary { display: flex; flex-wrap: wrap; gap: 18px; margin: 14px 0; color: #4b5563; font-size: 13px; }
.batch-items { display: flex; flex-direction: column; max-height: 360px; overflow-y: auto; border: 1px solid #e5e7eb; border-radius: 8px; }
.batch-item { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
.batch-item:last-child { border-bottom: 0; }
.batch-item-result { display: flex; align-items: center; justify-content: flex-end; min-width: 0; gap: 8px; }
.batch-error { max-width: 280px; overflow: hidden; color: #b91c1c; text-overflow: ellipsis; white-space: nowrap; }

@media (max-width: 900px) {
  .library-layout { grid-template-columns: 1fr; }
  .library-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); }
  .detail-header { flex-direction: column; }
  .detail-actions { justify-content: flex-start; }
}

@media (max-width: 640px) {
  .page-header { align-items: stretch; flex-direction: column; }
  .import-row { flex-direction: column; }
  .toolbar { align-items: stretch; flex-direction: column; }
  .search-input { width: 100%; }
  .sticker-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .preview-box { height: 130px; }
  .batch-item { align-items: flex-start; flex-direction: column; }
  .batch-item-result { width: 100%; justify-content: space-between; }
}
</style>
