<template>
  <div class="article-manage-view">
    <ArticleManageSearch
      v-model:search-form="searchForm"
      @status-change="handleStatusChange"
      @search="handleSearch"
      @reset="handleReset"
      @refresh="fetchArticles"
      @open-submit="showSubmitDialog"
    />

    <ArticleManageTable
      ref="articleTableRef"
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :articles="articles"
      :loading="loading"
      :total="total"
      :selected-articles="selectedArticles"
      :batch-loading="batchLoading"
      :publishing-id="publishingId"
      :status="searchForm.status"
      :status-title="getStatusTitle()"
      :get-type-label="getTypeLabel"
      :get-type-tag-type="getTypeTagType"
      :get-status-label="getStatusLabel"
      :get-status-tag-type="getStatusTagType"
      :format-date="formatDate"
      @selection-change="handleSelectionChange"
      @view-detail="viewDetail"
      @review="reviewArticle"
      @publish="publishArticleConfirm"
      @preview="openPreviewDialog"
      @batch-approve="handleBatchApprove"
      @batch-reject="handleBatchReject"
      @batch-publish="handleBatchPublish"
      @batch-delete="handleBatchDelete"
      @clear-selection="clearSelection"
      @page-change="fetchArticles"
    />

    <QuickSubmitDialog
      v-model:visible="submitDialogVisible"
      :form="submitForm"
      :submitting="submitting"
      @submit="handleSubmit"
    />

    <TelegramArticlePreviewDialog
      v-model:visible="detailVisible"
      :article="currentArticle"
      :image-files="getImageFiles()"
      :video-files="getVideoFiles()"
      :get-type-label="getTypeLabel"
      :get-file-view-url="getFileViewUrl"
      :format-telegram-time="formatTelegramTime"
      @publish="publishArticleConfirm"
      @review="reviewArticle"
    />

    <MessagePreviewDialog
      v-model:visible="previewDialogVisible"
      v-model:region-tag="previewRegionTag"
      v-model:type-tag="previewTypeTag"
      :loading="previewLoading"
      :preview-data="previewData"
      :region-tags="previewRegionTags"
      :type-tags="previewTypeTags"
      @generate="generatePreview"
      @close="closePreviewDialog"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getPendingReviews, getApprovedArticles, getPublishingArticles, getAllArticles, submitArticleWithFiles, getArticleDetail, batchApi, previewApi, tagApi } from '@/services/api.js'
import ArticleManageSearch from '@/components/admin/article-manage/ArticleManageSearch.vue'
import ArticleManageTable from '@/components/admin/article-manage/ArticleManageTable.vue'
import QuickSubmitDialog from '@/components/admin/article-manage/QuickSubmitDialog.vue'
import TelegramArticlePreviewDialog from '@/components/admin/article-manage/TelegramArticlePreviewDialog.vue'
import MessagePreviewDialog from '@/components/admin/article-manage/MessagePreviewDialog.vue'

const router = useRouter()

// 搜索表单
const searchForm = reactive({
  status: 'pending', // pending, approved, all
  keyword: '',
  authorType: '',
  dateRange: []
})

// 表格数据
const articles = ref([])
const loading = ref(false)
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const publishingId = ref(null)

// 快速投稿
const submitDialogVisible = ref(false)
const submitting = ref(false)
const submitForm = reactive({
  title: '',
  content: '',
  articleType: 'MANUAL'
})

// 文章预览
const detailVisible = ref(false)
const currentArticle = ref(null)

// 查看文章详情（Telegram风格预览）
const viewDetail = async (row) => {
  // 显示加载状态
  detailVisible.value = true
  currentArticle.value = row // 先显示基本数据
  
  try {
    // 获取完整文章详情（包含文件和内容）
    const res = await getArticleDetail(row.id)
    
    if (res.code === 200) {
      currentArticle.value = res.data
    }
  } catch (error) {
    console.error('获取文章详情失败:', error)
    // 如果获取失败，仍然显示基本数据
  }
}

// 获取图片文件
const getImageFiles = () => {
  if (!currentArticle.value || !currentArticle.value.files) return []
  return currentArticle.value.files.filter(file => {
    const ext = file.fileName?.toLowerCase() || ''
    return ext.endsWith('.jpg') || ext.endsWith('.jpeg') || ext.endsWith('.png') || ext.endsWith('.gif') || ext.endsWith('.webp')
  })
}

// 获取视频文件
const getVideoFiles = () => {
  if (!currentArticle.value || !currentArticle.value.files) return []
  return currentArticle.value.files.filter(file => {
    const ext = file.fileName?.toLowerCase() || ''
    return ext.endsWith('.mp4') || ext.endsWith('.mov') || ext.endsWith('.avi') || ext.endsWith('.mkv')
  })
}

// 获取文件URL
const getFileViewUrl = (url) => {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return `http://43.156.163.153:8091${url}`
}

// Telegram风格时间格式
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

// 获取状态标题
const getStatusTitle = () => {
  const titles = {
    'pending': '待审核稿件',
    'approved': '已审核稿件',
    'publishing': '发布中稿件',
    'all': '全部稿件'
  }
  return titles[searchForm.status] || '稿件管理'
}

// 获取类型标签
const getTypeLabel = (type) => {
  const map = {
    'SUBMISSION': '网友投稿',
    'BOT': '机器人抓取',
    'MANUAL': '手动投稿',
    'AD': '付费广告'
  }
  return map[type] || '未知'
}

const getTypeTagType = (type) => {
  const map = {
    'SUBMISSION': 'warning',
    'BOT': 'success',
    'MANUAL': 'info',
    'AD': 'danger'
  }
  return map[type] || 'info'
}

// 获取状态标签
const getStatusLabel = (status) => {
  const map = {
    'PENDING': '待审核',
    'APPROVED': '已审核',
    'PUBLISHING': '发布中',
    'PUBLISHED': '已发布',
    'REJECTED': '已拒绝'
  }
  return map[status] || status
}

const getStatusTagType = (status) => {
  const map = {
    'PENDING': 'warning',
    'APPROVED': 'success',
    'PUBLISHING': 'primary',
    'PUBLISHED': 'success',
    'REJECTED': 'danger'
  }
  return map[status] || 'info'
}

// 格式化日期
const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleString('zh-CN')
}

// 状态切换
const handleStatusChange = () => {
  currentPage.value = 1
  fetchArticles()
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
  searchForm.dateRange = []
  currentPage.value = 1
  fetchArticles()
}

// 获取数据
const fetchArticles = async () => {
  loading.value = true
  try {
    let res
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value,
      keyword: searchForm.keyword,
      authorType: searchForm.authorType
    }
    
    if (searchForm.dateRange && searchForm.dateRange.length === 2) {
      params.startDate = searchForm.dateRange[0]
      params.endDate = searchForm.dateRange[1]
    }
    
    // 根据状态选择不同的API
    if (searchForm.status === 'pending') {
      res = await getPendingReviews(params)
    } else if (searchForm.status === 'approved') {
      res = await getApprovedArticles(params)
    } else if (searchForm.status === 'publishing') {
      res = await getPublishingArticles(params)
    } else {
      res = await getAllArticles(params)
    }
    
    if (res.code === 200) {
      articles.value = res.data.list || []
      total.value = res.data.total || 0
    }
  } catch (error) {
    console.error('获取数据失败:', error)
    ElMessage.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

// 审核文章
const reviewArticle = (row) => {
  router.push(`/admin/review/${row.id}`)
}

const publishArticleConfirm = () => {
  router.push('/admin/publish')
}

// 显示快速投稿弹窗
const showSubmitDialog = () => {
  submitForm.title = ''
  submitForm.content = ''
  submitForm.articleType = 'MANUAL'
  submitDialogVisible.value = true
}

// 提交文章
const handleSubmit = async () => {
  if (!submitForm.title.trim()) {
    ElMessage.warning('请输入标题')
    return
  }
  if (!submitForm.content.trim()) {
    ElMessage.warning('请输入内容')
    return
  }

  submitting.value = true
  try {
    const res = await submitArticleWithFiles({ ...submitForm }, [])
    if (res.code === 200) {
      ElMessage.success('投稿成功')
      submitDialogVisible.value = false
      fetchArticles()
    } else {
      ElMessage.error(res.message || '投稿失败')
    }
  } catch (error) {
    console.error('投稿失败:', error)
    ElMessage.error('投稿失败')
  } finally {
    submitting.value = false
  }
}

// ========== 批量操作 ==========
const articleTableRef = ref(null)
const selectedArticles = ref([])
const batchLoading = ref(false)

// 选择变化
const handleSelectionChange = (selection) => {
  selectedArticles.value = selection
}

// 清空选择
const clearSelection = () => {
  articleTableRef.value?.clearSelection()
  selectedArticles.value = []
}

// ========== L1-L6 消息预览 ==========
const previewDialogVisible = ref(false)
const previewLoading = ref(false)
const previewData = ref(null)
const previewArticle = ref(null)
const previewRegionTag = ref(null)
const previewTypeTag = ref(null)
const previewRegionTags = ref([])
const previewTypeTags = ref([])

// 打开预览对话框
const openPreviewDialog = async (article) => {
  previewArticle.value = article
  previewDialogVisible.value = true
  previewLoading.value = true
  previewData.value = null
  
  // 加载标签选项
  try {
    const [regionRes, typeRes] = await Promise.all([
      tagApi.getRegions(),
      tagApi.getTypes()
    ])
    if (regionRes.code === 200) {
      previewRegionTags.value = regionRes.data || []
    }
    if (typeRes.code === 200) {
      previewTypeTags.value = typeRes.data || []
    }
  } catch (error) {
    console.error('加载标签失败:', error)
  }
  
  // 生成预览
  await generatePreview()
}

// 生成预览
const generatePreview = async () => {
  if (!previewArticle.value) return
  
  previewLoading.value = true
  try {
    const res = await previewApi.getPreview(previewArticle.value.id, {
      regionTag: previewRegionTag.value,
      typeTag: previewTypeTag.value
    })
    if (res.code === 200) {
      previewData.value = res.data
    } else {
      ElMessage.error(res.message || '生成预览失败')
    }
  } catch (error) {
    console.error('生成预览失败:', error)
    ElMessage.error('生成预览失败')
  } finally {
    previewLoading.value = false
  }
}

// 关闭预览对话框
const closePreviewDialog = () => {
  previewDialogVisible.value = false
  previewArticle.value = null
  previewData.value = null
  previewRegionTag.value = null
  previewTypeTag.value = null
}

// 批量审核通过
const handleBatchApprove = async () => {
  if (selectedArticles.value.length === 0) {
    ElMessage.warning('请选择要审核的文章')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要批量通过选中的 ${selectedArticles.value.length} 篇文章吗？`,
      '确认批量通过',
      { type: 'warning' }
    )

    batchLoading.value = true
    const articleIds = selectedArticles.value.map(a => a.id)

    const res = await batchApi.approve(articleIds)
    if (res.code === 200) {
      ElMessage.success(`成功审核 ${res.data.successCount} 篇文章`)
      clearSelection()
      fetchArticles()
    } else {
      ElMessage.error(res.message || '批量审核失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量审核失败:', error)
      ElMessage.error('批量审核失败')
    }
  } finally {
    batchLoading.value = false
  }
}

// 批量拒绝
const handleBatchReject = async () => {
  if (selectedArticles.value.length === 0) {
    ElMessage.warning('请选择要拒绝的文章')
    return
  }

  try {
    const { value: reason } = await ElMessageBox.prompt(
      '请输入拒绝原因（可选）',
      '批量拒绝',
      {
        confirmButtonText: '确认拒绝',
        cancelButtonText: '取消',
        inputPlaceholder: '请输入拒绝原因...'
      }
    )

    batchLoading.value = true
    const articleIds = selectedArticles.value.map(a => a.id)

    const res = await batchApi.reject(articleIds, reason || '')
    if (res.code === 200) {
      ElMessage.success(`成功拒绝 ${res.data.successCount} 篇文章`)
      clearSelection()
      fetchArticles()
    } else {
      ElMessage.error(res.message || '批量拒绝失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量拒绝失败:', error)
    }
  } finally {
    batchLoading.value = false
  }
}

// 批量发布
const handleBatchPublish = async () => {
  if (selectedArticles.value.length === 0) {
    ElMessage.warning('请选择要发布的文章')
    return
  }

  router.push('/admin/publish')
}

// 批量删除
const handleBatchDelete = async () => {
  if (selectedArticles.value.length === 0) {
    ElMessage.warning('请选择要删除的文章')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要批量删除选中的 ${selectedArticles.value.length} 篇文章吗？\n此操作不可恢复！`,
      '确认批量删除',
      { type: 'danger' }
    )

    batchLoading.value = true
    const articleIds = selectedArticles.value.map(a => a.id)

    const res = await batchApi.delete(articleIds)
    if (res.code === 200) {
      ElMessage.success(`成功删除 ${res.data.successCount} 篇文章`)
      clearSelection()
      fetchArticles()
    } else {
      ElMessage.error(res.message || '批量删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量删除失败:', error)
      ElMessage.error('批量删除失败')
    }
  } finally {
    batchLoading.value = false
  }
}

onMounted(() => {
  fetchArticles()
})
</script>

<style scoped>
.article-manage-view {
  padding: 20px 0;
}
</style>
