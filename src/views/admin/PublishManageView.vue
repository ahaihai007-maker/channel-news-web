<template>
  <div class="publish-manage-view">
    <PublishManageSearch
      v-model:search-form="searchForm"
      @search="handleSearch"
      @reset="handleReset"
      @refresh="fetchArticles"
    />

    <PublishArticlesTable
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :articles="articles"
      :loading="loading"
      :total="total"
      :selected-count="selectedArticles.length"
      :publishing-id="publishingId"
      :format-date="formatDate"
      @view-detail="viewDetail"
      @publish="publishArticleConfirm"
      @batch-publish="openBatchPublishDialog"
      @selection-change="handleSelectionChange"
      @page-change="fetchArticles"
    />

    <PublishPreviewDialog
      v-model:visible="detailVisible"
      :article="currentArticle"
      :image-files="getImageFiles()"
      :video-files="getVideoFiles()"
      :get-type-label="getTypeLabel"
      :get-file-view-url="getFileViewUrl"
      :format-telegram-time="formatTelegramTime"
      @preview-image="previewImage"
      @publish="publishArticleConfirm"
    />

    <PublishTemplateDialog
      v-model:visible="templateDialogVisible"
      v-model:use-template="useTemplate"
      v-model:selected-template-id="selectedTemplateId"
      v-model:use-emoji-prefix="useEmojiPrefix"
      v-model:selected-region-tag="selectedRegionTag"
      v-model:selected-type-tag="selectedTypeTag"
      v-model:selected-target-channels="selectedTargetChannels"
      :loading="loadingTemplates"
      :templates="templates"
      :region-tags="regionTags"
      :type-tags="typeTags"
      :channel-options="publishChannelOptions"
      :publishing="publishingId === 'batch' || publishingId === currentPublishArticle?.id"
      :preview-loading="previewLoading"
      :preview-message="previewMessage"
      :preview-buttons="previewButtons"
      @preview="generatePublishPreview"
      @confirm="confirmPublishWithTemplate"
    />

    <PublishSubmitDialog
      v-model:visible="submitDialogVisible"
      v-model:file-list="fileList"
      :form="submitForm"
      :submitting="submitting"
      :is-image="isImage"
      :get-file-url="getFileUrl"
      @file-change="handleFileChange"
      @file-remove="handleFileRemove"
      @remove-file="removeFile"
      @submit="handleSubmit"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getApprovedArticles, publishArticle, submitArticleWithFiles, getArticleDetail, messageTemplateApi, tagApi, previewApi, batchApi, telegramConfigApi } from '@/services/api.js'
import { ElImage, ElMessage } from 'element-plus'
import PublishManageSearch from '@/components/admin/publish-manage/PublishManageSearch.vue'
import PublishArticlesTable from '@/components/admin/publish-manage/PublishArticlesTable.vue'
import PublishPreviewDialog from '@/components/admin/publish-manage/PublishPreviewDialog.vue'
import PublishTemplateDialog from '@/components/admin/publish-manage/PublishTemplateDialog.vue'
import PublishSubmitDialog from '@/components/admin/publish-manage/PublishSubmitDialog.vue'

// 详情弹窗
const detailVisible = ref(false)
const currentArticle = ref(null)

// 搜索表单
const searchForm = reactive({
  keyword: '',
  authorType: '',
  dateRange: null
})

// 数据列表
const articles = ref([])
const selectedArticles = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 投稿对话框
const submitDialogVisible = ref(false)
const submitting = ref(false)
const submitForm = reactive({
  title: '',
  content: '',
  summary: '',
  authorUsername: 'bot',
  authMode: 'jwt',
  botToken: '',
  articleType: 'AD'
})

// 文件列表
const fileList = ref([])

// 模板选择对话框
const templateDialogVisible = ref(false)
const currentPublishArticle = ref(null)
const isBatchPublishing = ref(false)
const templates = ref([])
const useTemplate = ref(false)
const selectedTemplateId = ref(null)
const useEmojiPrefix = ref(true)
const loadingTemplates = ref(false)
const previewLoading = ref(false)
const previewMessage = ref('')
const previewButtons = ref([])

// 标签选择
const regionTags = ref([])
const typeTags = ref([])
const publishChannelOptions = ref([])
const selectedTargetChannels = ref([])
const selectedRegionTag = ref(null)
const selectedTypeTag = ref(null)

const buildChannelOptions = (data) => {
  const detailsById = {}
  ;(data.telegramChannelDetails || []).forEach((detail) => {
    if (detail.channelId) detailsById[detail.channelId] = detail
    if (detail.input) detailsById[detail.input] = detail
  })
  return (data.telegramChannels || [])
    .filter(Boolean)
    .map((channel) => {
      const detail = detailsById[channel] || {}
      const title = detail.title || detail.username || channel
      const type = detail.targetType ? ` / ${detail.targetType}` : ''
      return {
        value: channel,
        label: `${title}${type} / ${channel}`
      }
    })
}

// 获取数据
const fetchArticles = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value
    }
    
    if (searchForm.keyword) {
      params.keyword = searchForm.keyword
    }
    if (searchForm.authorType) {
      params.authorType = searchForm.authorType
    }
    // 添加日期范围参数
    if (searchForm.dateRange && searchForm.dateRange.length === 2) {
      const formatDate = (date) => {
        if (date instanceof Date) {
          return date.toISOString().split('T')[0]
        }
        return date
      }
      params.startDate = formatDate(searchForm.dateRange[0])
      params.endDate = formatDate(searchForm.dateRange[1])
    }
    
    const res = await getApprovedArticles(params)
    if (res.code === 200) {
      articles.value = res.data.list || []
      total.value = res.data.total || 0
    }
  } catch (error) {
    console.error('获取列表失败:', error)
    ElMessage.error('获取列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  currentPage.value = 1
  fetchArticles()
}

// 重置
const handleReset = () => {
  searchForm.keyword = ''
  searchForm.authorType = ''
  searchForm.dateRange = null
  currentPage.value = 1
  fetchArticles()
}

// 显示投稿对话框
const showSubmitDialog = () => {
  submitForm.title = ''
  submitForm.content = ''
  submitForm.summary = ''
  submitForm.authMode = 'jwt'
  submitForm.botToken = ''
  submitForm.articleType = 'AD'
  fileList.value = []
  submitDialogVisible.value = true
}

// 判断是否为图片
const isImage = (type) => {
  return type && type.startsWith('image/')
}

// 获取文件预览URL
const getFileUrl = (file) => {
  return URL.createObjectURL(file.raw)
}

// 处理文件变更
const handleFileChange = (uploadFile) => {
  console.log('文件已选择:', uploadFile.name)
}

// 处理文件移除
const handleFileRemove = () => {
  console.log('文件已移除')
}

// 移除文件
const removeFile = (index) => {
  fileList.value.splice(index, 1)
}

// 提交投稿
const handleSubmit = async () => {
  if (!submitForm.title.trim()) {
    ElMessage.warning('请输入标题')
    return
  }
  if (!submitForm.content.trim()) {
    ElMessage.warning('请输入内容')
    return
  }
  if (!submitForm.authorUsername.trim()) {
    ElMessage.warning('请输入作者')
    return
  }
  
  // 验证Bot Token（如果使用Bot认证方式）
  if (submitForm.authMode === 'bot' && !submitForm.botToken.trim()) {
    ElMessage.warning('请输入Bot Token')
    return
  }

  submitting.value = true
  try {
    // 准备文件数据
    const files = fileList.value.map(item => item.raw)
    
    // 确定使用哪种认证方式
    const authToken = submitForm.authMode === 'bot' ? submitForm.botToken : false
    
    const res = await submitArticleWithFiles({
      title: submitForm.title,
      content: submitForm.content,
      summary: submitForm.summary,
      authorUsername: submitForm.authorUsername,
      articleType: submitForm.articleType
    }, files, authToken)
    
    if (res.code === 200) {
      ElMessage.success(`投稿成功！上传了 ${res.data.fileCount || 0} 个文件`)
      submitDialogVisible.value = false
      // 刷新列表
      fetchArticles()
    } else {
      ElMessage.error(res.message || '投稿失败')
    }
  } catch (error) {
    console.error('投稿失败:', error)
    ElMessage.error('投稿失败: ' + (error.message || '未知错误'))
  } finally {
    submitting.value = false
  }
}

// 查看文章详情（弹窗）
const viewDetail = async (row) => {
  // 获取完整文章详情（包含 content 和 files）
  try {
    const res = await getArticleDetail(row.id)
    if (res.code === 200) {
      currentArticle.value = res.data
      detailVisible.value = true
    } else {
      ElMessage.error(res.message || '获取文章详情失败')
    }
  } catch (error) {
    console.error('获取文章详情失败:', error)
    ElMessage.error('获取文章详情失败')
  }
}

// 获取图片文件列表
const getImageFiles = () => {
  if (!currentArticle.value?.files) return []
  return currentArticle.value.files.filter(f => f.fileType === 'image')
}

// 获取视频文件列表
const getVideoFiles = () => {
  if (!currentArticle.value?.files) return []
  return currentArticle.value.files.filter(f => f.fileType === 'video')
}

// 预览图片
const previewImage = (index) => {
  const images = getImageFiles()
  const imageUrls = images.map(f => getFileViewUrl(f.url))
  
  // 使用 Element Plus 的图片预览
  const { preview } = ElImage
  if (preview) {
    preview(imageUrls, index)
  }
}

// 获取文件查看URL
const getFileViewUrl = (url) => {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return `${window.location.protocol}//${window.location.host}${url}`
}

// 正在发布的文章ID
const publishingId = ref(null)

// 加载模板列表
const loadTemplates = async () => {
  loadingTemplates.value = true
  try {
    // 并行加载模板和标签
    const [templateRes, regionRes, typeRes, telegramRes] = await Promise.all([
      messageTemplateApi.getList(),
      tagApi.getRegions(),
      tagApi.getTypes(),
      telegramConfigApi.get()
    ])
    
    if (templateRes.code === 200) {
      templates.value = templateRes.data || []
    }
    
    if (regionRes.code === 200) {
      regionTags.value = regionRes.data || []
    }
    
    if (typeRes.code === 200) {
      typeTags.value = typeRes.data || []
    }

    if (telegramRes.code === 200) {
      publishChannelOptions.value = buildChannelOptions(telegramRes.data || {})
      selectedTargetChannels.value = publishChannelOptions.value.map(channel => channel.value)
    }
  } catch (error) {
    console.error('加载模板或标签失败:', error)
  } finally {
    loadingTemplates.value = false
  }
}

// 打开模板选择对话框
const openTemplateDialog = async (row) => {
  currentPublishArticle.value = row
  isBatchPublishing.value = false
  useTemplate.value = false
  selectedTemplateId.value = null
  useEmojiPrefix.value = true
  selectedRegionTag.value = null
  selectedTypeTag.value = null
  selectedTargetChannels.value = publishChannelOptions.value.map(channel => channel.value)
  previewMessage.value = ''
  previewButtons.value = []
  await loadTemplates()
  templateDialogVisible.value = true
}

const openBatchPublishDialog = async () => {
  if (selectedArticles.value.length === 0) {
    ElMessage.warning('请选择要发布的文章')
    return
  }
  currentPublishArticle.value = selectedArticles.value[0]
  isBatchPublishing.value = true
  useTemplate.value = false
  selectedTemplateId.value = null
  useEmojiPrefix.value = true
  selectedRegionTag.value = null
  selectedTypeTag.value = null
  selectedTargetChannels.value = publishChannelOptions.value.map(channel => channel.value)
  previewMessage.value = ''
  previewButtons.value = []
  await loadTemplates()
  templateDialogVisible.value = true
}

const handleSelectionChange = (rows) => {
  selectedArticles.value = rows
}

const buildPublishPayload = () => ({
  useTemplate: useTemplate.value,
  templateId: useTemplate.value ? selectedTemplateId.value : null,
  useEmoji: useEmojiPrefix.value,
  regionTag: selectedRegionTag.value,
  typeTag: selectedTypeTag.value,
  targetChannels: selectedTargetChannels.value
})

const generatePublishPreview = async () => {
  if (!currentPublishArticle.value) return

  previewLoading.value = true
  try {
    const res = await previewApi.getPreview(currentPublishArticle.value.id, buildPublishPayload())
    if (res.code === 200) {
      previewMessage.value = res.data.fullMessage || res.data.preview?.telegramStyle || ''
      previewButtons.value = res.data.buttonRows || res.data.buttons || []
    } else {
      ElMessage.error(res.message || '生成预览失败')
    }
  } catch (error) {
    ElMessage.error('生成预览失败：' + (error.message || '网络错误'))
  } finally {
    previewLoading.value = false
  }
}

// 确认使用模板发布
const confirmPublishWithTemplate = async () => {
  if (!currentPublishArticle.value) return
   
  publishingId.value = isBatchPublishing.value ? 'batch' : currentPublishArticle.value.id
  templateDialogVisible.value = false
   
  try {
    const payload = buildPublishPayload()
    const res = isBatchPublishing.value
      ? await batchApi.publish(
          selectedArticles.value.map(article => article.id),
          payload.useTemplate,
          payload.templateId,
          payload.useEmoji,
          payload.regionTag,
          payload.typeTag,
          payload.targetChannels
        )
      : await publishArticle(currentPublishArticle.value.id, payload)
    
    if (res.code === 200) {
      ElMessage.success(isBatchPublishing.value ? res.message || '批量发布完成' : res.message || '发布成功')
      selectedArticles.value = []
      fetchArticles()
    } else {
      ElMessage.error(res.message || '发布失败')
    }
  } catch (error) {
    ElMessage.error('发布失败：' + (error.message || '网络错误'))
  } finally {
    publishingId.value = null
    currentPublishArticle.value = null
    isBatchPublishing.value = false
  }
}

const publishArticleConfirm = async (row) => {
  openTemplateDialog(row)
}

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleString('zh-CN')
}

// Telegram 风格时间格式
const formatTelegramTime = (date) => {
  if (!date) return ''
  const d = new Date(date)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  
  const hours = d.getHours().toString().padStart(2, '0')
  const minutes = d.getMinutes().toString().padStart(2, '0')
  const timeStr = `${hours}:${minutes}`
  
  if (isToday) {
    return timeStr
  } else {
    const month = (d.getMonth() + 1).toString().padStart(2, '0')
    const day = d.getDate().toString().padStart(2, '0')
    return `${month}月${day}日 ${timeStr}`
  }
}

// 获取文章类型标签
const getTypeLabel = (type) => {
  const map = {
    'SUBMISSION': '网友投稿',
    'BOT': '机器人抓取',
    'MANUAL': '手动投稿',
    'AD': '付费广告'
  }
  return map[type] || '未知'
}

onMounted(() => {
  fetchArticles()
})
</script>

<style scoped>
.publish-manage-view {
  padding: 20px 0;
}
</style>
