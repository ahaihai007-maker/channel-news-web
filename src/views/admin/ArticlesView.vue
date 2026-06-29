<template>
  <div class="admin-articles">
    <h2 class="page-title">文章管理</h2>

    <ArticleStatsSearch
      v-model:search-form="searchForm"
      :stats="stats"
      @search="handleSearch"
      @reset="handleReset"
    />

    <AdminArticlesTable
      :articles="articleList"
      :loading="loading"
      :selected-articles="selectedArticles"
      :pagination="pagination"
      :get-status-type="getStatusType"
      :get-status-text="getStatusText"
      :get-type-tag-type="getTypeTagType"
      :get-type-label="getTypeLabel"
      :format-date="formatDate"
      @selection-change="handleSelectionChange"
      @view="handleView"
      @publish="handlePublish"
      @settle-payment="handleSettlePayment"
      @delete="handleDelete"
      @batch-settle="handleBatchSettle"
      @batch-publish="handleBatchPublish"
      @batch-delete="handleBatchDelete"
      @size-change="handleSizeChange"
      @page-change="handlePageChange"
    />

    <ArticleDetailDialog
      v-model:visible="detailVisible"
      :article="currentArticle"
      :get-status-type="getStatusType"
      :get-status-text="getStatusText"
      :format-date="formatDate"
      :format-file-size="formatFileSize"
      :get-full-file-url="getFullFileUrl"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getArticleDetail, deleteArticle } from '../../services/api.js'
import request from '../../services/request.js'
import ArticleStatsSearch from '@/components/admin/articles/ArticleStatsSearch.vue'
import AdminArticlesTable from '@/components/admin/articles/AdminArticlesTable.vue'
import ArticleDetailDialog from '@/components/admin/articles/ArticleDetailDialog.vue'

const loading = ref(false)
const articleList = ref([])
const selectedArticles = ref([])

// 统计数据
const stats = reactive({
  totalArticles: 0,
  pendingArticles: 0,
  publishedArticles: 0
})

// 加载统计数据
const loadStats = async () => {
  try {
    const res = await request.get('/admin/stats')
    if (res.code === 200) {
      stats.totalArticles = res.data.totalArticles || 0
      stats.pendingArticles = res.data.pendingArticles || 0
      stats.publishedArticles = res.data.publishedArticles || 0
    }
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

const searchForm = reactive({
  keyword: '',
  authorType: '',
  status: '',
  dateRange: null
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const detailVisible = ref(false)
const currentArticle = ref(null)

const loadArticles = async () => {
  loading.value = true
  try {
    // 获取所有文章（管理员权限）
    const params = {
      pageNum: pagination.page,
      pageSize: pagination.pageSize
    }
    
    // 添加搜索条件
    if (searchForm.keyword) {
      params.keyword = searchForm.keyword
    }
    if (searchForm.authorType) {
      params.authorType = searchForm.authorType
    }
    if (searchForm.status) {
      params.status = searchForm.status
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
    
    const res = await request.get('/admin/articles', { params })
    
    if (res.code === 200) {
      articleList.value = res.data.list || []
      pagination.total = res.data.total || 0
    }
  } catch (error) {
    console.error('加载文章列表失败:', error)
    ElMessage.error('加载文章列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadArticles()
}

const handleReset = () => {
  searchForm.keyword = ''
  searchForm.authorType = ''
  searchForm.status = ''
  searchForm.dateRange = null
  handleSearch()
}

const handlePageChange = (page) => {
  pagination.page = page
  loadArticles()
}

const handleSizeChange = (size) => {
  pagination.pageSize = size
  pagination.page = 1
  loadArticles()
}

const handleSelectionChange = (selection) => {
  selectedArticles.value = selection
}

const getStatusType = (status) => {
  const map = {
    'PENDING': 'warning',
    'APPROVED': 'success',
    'PUBLISHING': 'info',
    'PUBLISHED': 'primary',
    'REJECTED': 'danger'
  }
  return map[status] || 'info'
}

const getStatusText = (status) => {
  const map = {
    'PENDING': '待审核',
    'APPROVED': '已通过',
    'PUBLISHING': '发布中',
    'PUBLISHED': '已发布',
    'REJECTED': '已拒绝'
  }
  return map[status] || status
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

const handleView = async (row) => {
  // 获取完整文章详情（包括文件列表）
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

const handlePublish = async (row) => {
  try {
    await ElMessageBox.confirm('确定要发布该文章吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info'
    })
    
    ElMessage.success('发布成功')
    loadArticles()
  } catch {
    // 取消
  }
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该文章吗？删除后不可恢复！', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'error'
    })
    
    const res = await deleteArticle(row.id)
    if (res.code === 200) {
      ElMessage.success('删除成功')
      loadArticles()
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除文章失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

const handleSettlePayment = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要结算稿费吗？\n文章：${row.title}\n作者：${row.authorName}`,
      '结算稿费',
      {
        confirmButtonText: '确定结算',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const res = await request.post(`/admin/payment/settle/${row.id}`)
    if (res.code === 200) {
      ElMessage.success(`稿费结算成功，金额：${res.data.amount}元`)
      loadArticles()
    } else {
      ElMessage.error(res.message || '结算失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('结算稿费失败:', error)
      ElMessage.error('结算失败')
    }
  }
}

const handleBatchPublish = async () => {
  if (!selectedArticles.value.length) return
  
  try {
    await ElMessageBox.confirm(`确定要批量发布选中的 ${selectedArticles.value.length} 篇文章吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info'
    })
    
    ElMessage.success('批量发布成功')
    loadArticles()
  } catch {
    // 取消
  }
}

const handleBatchDelete = async () => {
  if (!selectedArticles.value.length) return
  
  try {
    await ElMessageBox.confirm(`确定要批量删除选中的 ${selectedArticles.value.length} 篇文章吗？`, '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'error'
    })
    
    ElMessage.success('批量删除成功')
    loadArticles()
  } catch {
    // 取消
  }
}

const handleBatchSettle = async () => {
  if (!selectedArticles.value.length) return
  
  // 筛选出已发布的网友投稿
  const settleable = selectedArticles.value.filter(a => a.status === 'PUBLISHED' && a.articleType === 'SUBMISSION')
  if (!settleable.length) {
    ElMessage.warning('没有可结算的文章（需要是已发布的网友投稿）')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要批量结算选中的 ${settleable.length} 篇文章稿费吗？`,
      '批量结算',
      {
        confirmButtonText: '确定结算',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const res = await request.post('/admin/payment/batch-settle', {
      articleIds: settleable.map(a => a.id)
    })
    
    if (res.code === 200) {
      ElMessage.success(`批量结算完成，成功${res.data.totalSettled}篇`)
      loadArticles()
    } else {
      ElMessage.error(res.message || '批量结算失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量结算失败:', error)
      ElMessage.error('批量结算失败')
    }
  }
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString()
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 获取完整的文件URL
const getFullFileUrl = (url) => {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return `${window.location.protocol}//${window.location.host}${url}`
}

onMounted(() => {
  loadStats()
  loadArticles()
})
</script>

<style scoped>
.admin-articles {
  padding: 20px;
}

.page-title {
  margin-bottom: 20px;
  font-size: 24px;
  color: #303133;
}
</style>
