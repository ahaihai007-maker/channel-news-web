<template>
  <div class="pipeline-page">
    <h2 class="page-title">AI 管线处理</h2>

    <el-card class="info-card">
      <el-alert type="info" :closable="false" show-icon>
        <template #title>
          普通待处理文章可直接使用 AI 管线送审；抓取阶段广告检测待复核文章需先人工确认，再送审、退回普通管线或确认广告。
        </template>
      </el-alert>
    </el-card>

    <el-card class="list-card">
      <el-tabs v-model="activeQueue" @tab-change="handleQueueChange">
        <el-tab-pane label="普通待处理" name="draft" />
        <el-tab-pane label="广告复核" name="ad_review" />
      </el-tabs>

      <div class="batch-bar" v-if="!isAdReviewQueue && selection.length > 0">
        <span>已选 {{ selection.length }} 篇</span>
        <el-select v-model="batchPipeline" placeholder="选择风格" size="small" style="width: 150px; margin-left: 12px;">
          <el-option v-for="p in pipelineOptions" :key="p.value" :label="p.label" :value="p.value" />
        </el-select>
        <el-button type="success" size="small" @click="handleBatchProcess" :loading="batchProcessing" style="margin-left: 12px;">
          批量处理
        </el-button>
      </div>

      <template #header>
        <div class="card-header">
          <span>{{ queueTitle }} ({{ total }})</span>
          <el-select v-model="sourceFilter" placeholder="筛选频道" clearable style="width: 250px;" @change="loadArticles">
            <el-option v-for="ch in channels" :key="ch" :label="ch" :value="ch" />
          </el-select>
        </div>
      </template>

      <el-table ref="tableRef" :data="articles" @selection-change="handleSelectionChange" v-loading="loading"
        highlight-current-row @row-click="openDialog">
        <el-table-column v-if="!isAdReviewQueue" type="selection" width="50" />
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="sourceChannel" label="来源频道" width="150" />
        <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
        <el-table-column prop="contentPreview" label="内容预览" min-width="250" show-overflow-tooltip />
        <el-table-column v-if="isAdReviewQueue" prop="rejectReason" label="广告检测原因" min-width="260" show-overflow-tooltip />
        <el-table-column label="附件" width="70" align="center">
          <template #default="scope">
            <el-icon v-if="scope.row.hasMedia"><PictureFilled /></el-icon>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" :width="isAdReviewQueue ? 110 : 190" fixed="right">
          <template #default="scope">
            <div class="operation-buttons" @click.stop>
              <el-tooltip content="打开原文与处理结果对照窗口，可选择处理风格并预览" placement="top">
                <el-button
                  type="primary"
                  size="small"
                  plain
                  :disabled="isRowProcessing(scope.row.id)"
                  @click="openDialog(scope.row)"
                >
                  打开处理
                </el-button>
              </el-tooltip>

              <el-popconfirm
                v-if="!isAdReviewQueue"
                width="260"
                title="将使用标准新闻直接处理并送审，确定继续？"
                confirm-button-text="确认快处理"
                cancel-button-text="取消"
                @confirm="quickProcess(scope.row)"
              >
                <template #reference>
                  <el-button
                    type="success"
                    size="small"
                    :loading="isRowProcessing(scope.row.id)"
                  :disabled="isRowProcessing(scope.row.id)"
                >
                    快处理
                  </el-button>
                </template>
              </el-popconfirm>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-if="total > pageSize"
        v-model:current-page="pageNum"
        :page-size="pageSize"
        :total="total"
        layout="total, prev, pager, next"
        @current-change="loadArticles"
        style="margin-top: 20px; justify-content: center;"
      />
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="`文章 #${dialogArticle?.id} — 来源: ${dialogArticle?.sourceChannel || '-'}`"
      width="96vw"
      top="2vh"
      class="pipeline-process-dialog"
      destroy-on-close
    >
      <div class="dialog-body">
        <div class="dialog-left">
          <div class="panel-header">原文</div>
          <div class="original-content">
            <el-alert
              v-if="isDialogAdReview"
              class="ad-review-reason"
              title="广告检测原因"
              :description="dialogArticle?.rejectReason || '未记录检测原因'"
              type="warning"
              :closable="false"
              show-icon
            />
            <h4>{{ dialogArticle?.title }}</h4>
            <div v-if="dialogFiles.length > 0" class="media-section">
              <div class="media-title">附件预览</div>
              <div v-if="dialogImageFiles.length > 0" class="image-grid">
                <el-image
                  v-for="file in dialogImageFiles"
                  :key="file.id"
                  :src="getFileViewUrl(file.url)"
                  fit="cover"
                  class="preview-image"
                  :preview-src-list="dialogImageFiles.map(item => getFileViewUrl(item.url))"
                />
              </div>
              <div v-if="dialogVideoFiles.length > 0" class="video-list">
                <video
                  v-for="file in dialogVideoFiles"
                  :key="file.id"
                  :src="getFileViewUrl(file.url)"
                  controls
                  class="preview-video"
                />
              </div>
              <div v-if="dialogOtherFiles.length > 0" class="file-list">
                <div v-for="file in dialogOtherFiles" :key="file.id" class="file-row">
                  {{ file.fileName || file.originalName || '未命名文件' }}
                </div>
              </div>
            </div>
            <div v-html="dialogOriginalHtml"></div>
          </div>
        </div>
        <div class="dialog-right">
          <div class="pipeline-select">
            <el-select v-model="dialogPipeline" placeholder="选择风格" style="width: 160px;">
              <el-option v-for="p in pipelineOptions" :key="p.value" :label="p.label" :value="p.value" />
            </el-select>
            <el-button type="primary" @click="executePreview" :loading="dialogProcessing" :disabled="!dialogPipeline">
              执行处理
            </el-button>
          </div>

          <div class="panel-header">处理结果</div>
          <div class="result-area" v-if="dialogResult">
            <el-form label-position="top" class="result-editor">
              <el-form-item label="标题">
                <el-input v-model="dialogResultTitle" maxlength="255" show-word-limit />
              </el-form-item>
              <el-form-item label="正文">
                <el-input
                  v-model="dialogResult"
                  type="textarea"
                  :rows="22"
                  resize="vertical"
                  show-word-limit
                />
              </el-form-item>
            </el-form>
            <div v-if="dialogFiles.length > 0" class="media-section result-media-section">
              <div class="media-title">随文附件预览</div>
              <div v-if="dialogImageFiles.length > 0" class="image-grid compact">
                <el-image
                  v-for="file in dialogImageFiles"
                  :key="file.id"
                  :src="getFileViewUrl(file.url)"
                  fit="cover"
                  class="preview-image compact-image"
                  :preview-src-list="dialogImageFiles.map(item => getFileViewUrl(item.url))"
                />
              </div>
              <div v-if="dialogVideoFiles.length > 0" class="video-list">
                <video
                  v-for="file in dialogVideoFiles"
                  :key="file.id"
                  :src="getFileViewUrl(file.url)"
                  controls
                  class="preview-video"
                />
              </div>
            </div>
          </div>
          <div class="result-empty" v-else-if="!dialogProcessing">
            选择风格后点击「执行处理」
          </div>
          <div class="result-empty" v-else>
            <el-icon class="is-loading"><Loading /></el-icon> AI 正在处理，请稍候...
          </div>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="retryPreview" :disabled="!dialogResult || dialogProcessing" :loading="dialogProcessing">重试</el-button>
          <el-select v-model="dialogPipeline" placeholder="换个方式" size="small" style="width: 140px; margin: 0 8px;" @change="switchPipeline">
            <el-option v-for="p in pipelineOptions" :key="p.value" :label="p.label" :value="p.value" />
          </el-select>
          <div style="flex:1" />
          <el-button @click="dialogVisible = false">关闭</el-button>
          <el-button
            v-if="isDialogAdReview"
            type="danger"
            plain
            @click="confirmAd"
            :loading="reviewActionLoading"
          >
            确认广告
          </el-button>
          <el-button
            v-if="isDialogAdReview"
            type="warning"
            plain
            @click="releaseToPipeline"
            :loading="reviewActionLoading"
          >
            退回普通 AI 管线
          </el-button>
          <el-button type="success" @click="confirmAndSubmit" :disabled="!canSubmitDialogResult" :loading="dialogSubmitting">
            {{ isDialogAdReview ? '确认非广告并送审' : '送审' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { PictureFilled, Loading } from '@element-plus/icons-vue'
import { aiPromptApi, pipelineApi } from '../../services/api.js'

const fixedPipelineOptions = [
  { label: '标准新闻', value: 'standard' },
  { label: '新闻观点评论', value: 'news_view_commentart' },
]
const fallbackPromptOptions = [
  { label: '园区爆款', value: 'clickbait' },
  { label: '社交病毒', value: 'viral' },
  { label: '极简摘要', value: 'summary' },
  { label: '心理框架', value: 'psycho' },
  { label: '流量收割', value: 'traffic' },
]
const pipelineOptions = ref([...fixedPipelineOptions, ...fallbackPromptOptions])

const articles = ref([])
const loading = ref(false)
const activeQueue = ref('draft')
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(20)
const sourceFilter = ref('')
const channels = ref([])
const selection = ref([])
const batchPipeline = ref('standard')
const batchProcessing = ref(false)
const processingIds = ref(new Set())
const tableRef = ref(null)

const dialogVisible = ref(false)
const dialogArticle = ref(null)
const dialogQueue = ref('draft')
const dialogOriginalHtml = ref('')
const dialogPipeline = ref('standard')
const dialogResult = ref('')
const dialogResultTitle = ref('')
const dialogProcessing = ref(false)
const dialogSubmitting = ref(false)
const reviewActionLoading = ref(false)
const dialogFiles = ref([])

const isAdReviewQueue = computed(() => activeQueue.value === 'ad_review')
const isDialogAdReview = computed(() => dialogQueue.value === 'ad_review')
const queueTitle = computed(() => isAdReviewQueue.value ? '广告复核文章' : '普通待处理文章')
const dialogImageFiles = computed(() => dialogFiles.value.filter(file => file.fileType === 'image'))
const dialogVideoFiles = computed(() => dialogFiles.value.filter(file => file.fileType === 'video'))
const dialogOtherFiles = computed(() => dialogFiles.value.filter(file => file.fileType !== 'image' && file.fileType !== 'video'))
const canSubmitDialogResult = computed(() => {
  return Boolean(dialogResult.value.trim() && dialogResultTitle.value.trim() && !dialogProcessing.value)
})

const getFileViewUrl = (url) => {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return `${window.location.protocol}//${window.location.host}${url}`
}

const loadArticles = async () => {
  loading.value = true
  try {
    const params = { page: pageNum.value, pageSize: pageSize.value }
    if (sourceFilter.value) params.source_channel = sourceFilter.value
    const res = isAdReviewQueue.value
      ? await pipelineApi.getAdReviewArticles(params)
      : await pipelineApi.getArticles(params)
    if (res.code === 200) {
      articles.value = res.data.list || []
      total.value = res.data.total
      const channelSet = new Set()
      articles.value.forEach(a => { if (a.sourceChannel) channelSet.add(a.sourceChannel) })
      channels.value = [...channelSet]
    } else {
      ElMessage.error(res.message || '加载失败')
    }
  } catch (e) {
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

const loadPipelineOptions = async () => {
  try {
    const res = await aiPromptApi.getList()
    if (res.code !== 200) return
    const promptOptions = (res.data || [])
      .filter((prompt) => prompt.isActive && prompt.pipelineType !== 'auxiliary')
      .map((prompt) => ({
        label: prompt.name,
        value: prompt.promptKey
      }))
    pipelineOptions.value = [...fixedPipelineOptions, ...promptOptions]
  } catch (e) {
    pipelineOptions.value = [...fixedPipelineOptions, ...fallbackPromptOptions]
  }
}

const handleSelectionChange = (val) => {
  selection.value = isAdReviewQueue.value ? [] : val
}

const handleQueueChange = () => {
  pageNum.value = 1
  selection.value = []
  tableRef.value?.clearSelection()
  loadArticles()
}

const openDialog = async (row) => {
  dialogArticle.value = row
  dialogQueue.value = activeQueue.value
  dialogOriginalHtml.value = ''
  dialogResult.value = ''
  dialogResultTitle.value = ''
  dialogFiles.value = []
  dialogPipeline.value = 'standard'
  dialogVisible.value = true

  try {
    const res = isDialogAdReview.value
      ? await pipelineApi.getAdReviewArticleDetail(row.id)
      : await pipelineApi.getArticleDetail(row.id)
    if (res.code === 200) {
      dialogArticle.value = { ...row, ...res.data }
      dialogOriginalHtml.value = res.data.contentHtml || ''
      dialogFiles.value = res.data.files || []
    } else {
      ElMessage.error(res.message || '文章详情加载失败')
    }
  } catch (e) {
    dialogOriginalHtml.value = `<p>${row.contentPreview}</p>`
    ElMessage.error('文章详情加载失败')
  }
}

const executePreview = async () => {
  if (!dialogArticle.value || !dialogPipeline.value) return
  dialogProcessing.value = true
  dialogResult.value = ''
  dialogResultTitle.value = ''
  try {
    const res = isDialogAdReview.value
      ? await pipelineApi.previewAdReview(dialogArticle.value.id, dialogPipeline.value)
      : await pipelineApi.preview(dialogArticle.value.id, dialogPipeline.value)
    if (res.code === 200) {
      dialogResult.value = res.data.contentPlain
      dialogResultTitle.value = res.data.title
    } else {
      ElMessage.warning(res.message || '处理失败')
    }
  } catch (e) {
    ElMessage.error('处理失败')
  } finally {
    dialogProcessing.value = false
  }
}

const retryPreview = () => {
  executePreview()
}

const switchPipeline = () => {
  executePreview()
}

const isRowProcessing = (id) => {
  return processingIds.value.has(id)
}

const confirmAndSubmit = async () => {
  if (!dialogArticle.value || !dialogPipeline.value) return
  if (!canSubmitDialogResult.value) {
    ElMessage.warning('标题和正文不能为空')
    return
  }
  dialogSubmitting.value = true
  try {
    const processData = {
      title: dialogResultTitle.value.trim(),
      content: dialogResult.value.trim()
    }
    const res = isDialogAdReview.value
      ? await pipelineApi.processAdReview(dialogArticle.value.id, dialogPipeline.value, processData)
      : await pipelineApi.process(dialogArticle.value.id, dialogPipeline.value, processData)
    if (res.code === 200) {
      ElMessage.success('处理完成，已提交待审核')
      dialogVisible.value = false
      loadArticles()
    } else {
      ElMessage.error(res.message || '送审失败')
    }
  } catch (e) {
    ElMessage.error('送审失败')
  } finally {
    dialogSubmitting.value = false
  }
}

const releaseToPipeline = async () => {
  if (!dialogArticle.value || reviewActionLoading.value) return
  reviewActionLoading.value = true
  try {
    const res = await pipelineApi.releaseAdReview(dialogArticle.value.id)
    if (res.code === 200) {
      ElMessage.success('已退回普通 AI 管线')
      dialogVisible.value = false
      loadArticles()
    } else {
      ElMessage.error(res.message || '退回失败')
    }
  } catch (e) {
    ElMessage.error('退回失败')
  } finally {
    reviewActionLoading.value = false
  }
}

const confirmAd = async () => {
  if (!dialogArticle.value || reviewActionLoading.value) return
  try {
    await ElMessageBox.confirm(
      '确认后文章将进入已拒绝状态，并保留正文、附件和检测原因。是否继续？',
      '确认广告',
      {
        confirmButtonText: '确认广告',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
  } catch (e) {
    return
  }

  reviewActionLoading.value = true
  try {
    const res = await pipelineApi.rejectAdReview(dialogArticle.value.id)
    if (res.code === 200) {
      ElMessage.success('已确认广告')
      dialogVisible.value = false
      loadArticles()
    } else {
      ElMessage.error(res.message || '确认失败')
    }
  } catch (e) {
    ElMessage.error('确认失败')
  } finally {
    reviewActionLoading.value = false
  }
}

const quickProcess = async (row) => {
  if (isRowProcessing(row.id)) return
  processingIds.value.add(row.id)
  try {
    const res = await pipelineApi.process(row.id, 'standard')
    if (res.code === 200) {
      ElMessage.success('处理完成，已提交待审核')
      loadArticles()
    } else {
      ElMessage.error(res.message || '处理失败')
    }
  } catch (e) {
    ElMessage.error('处理失败')
  } finally {
    processingIds.value.delete(row.id)
  }
}

const handleBatchProcess = async () => {
  if (!batchPipeline.value) {
    ElMessage.warning('请选择处理风格')
    return
  }
  batchProcessing.value = true
  try {
    const ids = selection.value.map(s => s.id)
    const res = await pipelineApi.batchProcess(ids, batchPipeline.value)
    if (res.code === 200) {
      ElMessage.success(`批量处理完成 ${res.data.processed} 篇`)
      loadArticles()
    } else {
      ElMessage.error(res.message || '处理失败')
    }
  } catch (e) {
    ElMessage.error('处理失败')
  } finally {
    batchProcessing.value = false
  }
}

onMounted(() => {
  loadPipelineOptions()
  loadArticles()
})
</script>

<style scoped>
.pipeline-page {
  padding: 20px;
}

.page-title {
  margin-bottom: 20px;
  font-size: 24px;
  color: #303133;
}

.info-card {
  margin-bottom: 20px;
}

.batch-bar {
  margin-bottom: 12px;
  padding: 12px 16px;
  background: #f0f9eb;
  border-radius: 6px;
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #606266;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dialog-body {
  display: flex;
  gap: 18px;
  height: 74vh;
  min-height: 560px;
}

.dialog-left {
  flex: 0 0 46%;
  overflow-y: auto;
  padding: 14px;
  background: #f5f7fa;
  border-radius: 6px;
}

.dialog-right {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 14px;
  background: #f5f7fa;
  border-radius: 6px;
}

.panel-header {
  font-weight: 600;
  font-size: 14px;
  color: #303133;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e4e7ed;
}

.pipeline-select {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}

.original-content h4 {
  font-size: 16px;
  margin-bottom: 10px;
  color: #303133;
}

.original-content {
  line-height: 1.8;
  color: #606266;
  font-size: 14px;
}

.ad-review-reason {
  margin-bottom: 14px;
}

.result-area {
  flex: 1;
  line-height: 1.8;
  color: #606266;
  font-size: 14px;
  overflow-y: auto;
}

.result-editor {
  margin-bottom: 14px;
}

.result-editor :deep(.el-form-item) {
  margin-bottom: 14px;
}

.result-editor :deep(.el-textarea__inner) {
  min-height: 440px !important;
  line-height: 1.7;
}

.media-section {
  margin: 12px 0 16px;
  padding: 12px;
  background: #ffffff;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
}

.result-media-section {
  margin-top: 4px;
}

.media-title {
  margin-bottom: 10px;
  font-size: 13px;
  font-weight: 600;
  color: #606266;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 8px;
}

.image-grid.compact {
  grid-template-columns: repeat(auto-fill, minmax(88px, 1fr));
}

.preview-image {
  width: 100%;
  height: 120px;
  border-radius: 6px;
  cursor: pointer;
  background: #f5f7fa;
}

.compact-image {
  height: 88px;
}

.video-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 10px;
}

.preview-video {
  width: 100%;
  max-height: 220px;
  border-radius: 6px;
  background: #000000;
}

.file-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 10px;
}

.file-row {
  padding: 6px 8px;
  color: #606266;
  background: #f5f7fa;
  border-radius: 4px;
  word-break: break-all;
}

.result-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #909399;
  font-size: 14px;
  gap: 8px;
}

.operation-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}

.operation-buttons :deep(.el-button + .el-button) {
  margin-left: 0;
}

.dialog-footer {
  display: flex;
  align-items: center;
}

:deep(.pipeline-process-dialog .el-dialog__body) {
  padding: 16px 20px;
}

@media (max-width: 980px) {
  .dialog-body {
    flex-direction: column;
    height: 76vh;
    min-height: 0;
  }

  .dialog-left {
    flex: 0 0 auto;
    max-height: 36%;
  }

  .dialog-right {
    min-height: 0;
  }

  .result-editor :deep(.el-textarea__inner) {
    min-height: 320px !important;
  }
}
</style>
