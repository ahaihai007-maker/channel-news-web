<template>
  <div class="admin-articles">
    <h2 class="page-title">文章管理</h2>
    
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stat-cards">
      <el-col :xs="8" :sm="8">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-value">{{ stats.totalArticles }}</div>
          <div class="stat-label">总文章数</div>
        </el-card>
      </el-col>
      <el-col :xs="8" :sm="8">
        <el-card shadow="hover" class="stat-card warning">
          <div class="stat-value">{{ stats.pendingArticles }}</div>
          <div class="stat-label">待审核</div>
        </el-card>
      </el-col>
      <el-col :xs="8" :sm="8">
        <el-card shadow="hover" class="stat-card success">
          <div class="stat-value">{{ stats.publishedArticles }}</div>
          <div class="stat-label">已发布</div>
        </el-card>
      </el-col>
    </el-row>
    
    <!-- 搜索栏 -->
    <el-card class="search-card">
      <el-form :inline="true" class="search-form">
        <el-form-item label="搜索">
          <el-input
            v-model="searchForm.keyword"
            placeholder="标题"
            clearable
            @keyup.enter="handleSearch"
            style="width: 180px"
          />
        </el-form-item>
        
        <el-form-item label="类型">
          <el-select v-model="searchForm.authorType" placeholder="全部" clearable style="width: 130px">
            <el-option label="网友投稿" value="submission" />
            <el-option label="机器人抓取" value="bot" />
            <el-option label="手动投稿" value="manual" />
            <el-option label="付费广告" value="ad" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 110px">
            <el-option label="待审核" value="PENDING" />
            <el-option label="已通过" value="APPROVED" />
            <el-option label="已发布" value="PUBLISHED" />
            <el-option label="已拒绝" value="REJECTED" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="日期">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="-"
            start-placeholder="开始"
            end-placeholder="结束"
            style="width: 260px"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 文章列表 -->
    <el-card class="table-card">
      <template #header>
        <div class="table-header">
          <span>文章列表</span>
          <div class="table-actions">
            <el-button type="warning" size="small" @click="handleBatchSettle" :disabled="!selectedArticles.length">
              批量结算
            </el-button>
            <el-button type="primary" size="small" @click="handleBatchPublish" :disabled="!selectedArticles.length">
              批量发布
            </el-button>
            <el-button type="danger" size="small" @click="handleBatchDelete" :disabled="!selectedArticles.length">
              批量删除
            </el-button>
          </div>
        </div>
      </template>
      
      <el-table 
        :data="articleList" 
        v-loading="loading" 
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        
        <el-table-column type="index" label="#" width="60" />
        
        <el-table-column label="标题" min-width="200">
          <template #default="{ row }">
            <div class="article-title">
              <span class="title-text" @click="handleView(row)">{{ row.title }}</span>
              <el-tag size="small" v-if="row.coverImage">有封面</el-tag>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="authorName" label="作者" width="120" />
        
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getTypeTagType(row.articleType)" size="small">
              {{ getTypeLabel(row.articleType) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        
        <el-table-column prop="publishedAt" label="发布时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.publishedAt) }}
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="320">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleView(row)">查看</el-button>
            <el-button 
              v-if="row.status === 'APPROVED'"
              type="success" 
              link 
              size="small" 
              @click="handlePublish(row)"
            >
              发布
            </el-button>
            <el-button 
              v-if="row.status === 'PUBLISHED' && row.articleType === 'SUBMISSION'"
              type="warning" 
              link 
              size="small" 
              @click="handleSettlePayment(row)"
            >
              结算稿费
            </el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>
    
    <!-- 文章详情对话框 -->
    <el-dialog
      v-model="detailVisible"
      title="文章详情"
      width="800px"
      class="article-detail-dialog"
    >
      <div v-if="currentArticle" class="article-detail">
        <h3>{{ currentArticle.title }}</h3>
        <div class="article-meta">
          <span>作者: {{ currentArticle.authorName }}</span>
          <span>状态: <el-tag :type="getStatusType(currentArticle.status)">{{ getStatusText(currentArticle.status) }}</el-tag></span>
          <span>浏览量: {{ currentArticle.viewCount || 0 }}</span>
          <span>创建时间: {{ formatDate(currentArticle.createdAt) }}</span>
        </div>
        
        <div v-if="currentArticle.coverImage" class="article-cover">
          <img :src="currentArticle.coverImage" alt="封面" />
        </div>
        
        <div class="article-content" v-html="currentArticle.content"></div>
        
        <div v-if="currentArticle.summary" class="article-summary">
          <strong>摘要:</strong> {{ currentArticle.summary }}
        </div>
        
        <!-- 附件展示 -->
        <div v-if="currentArticle.files && currentArticle.files.length > 0" class="article-files">
          <h4>附件 ({{ currentArticle.files.length }}个)</h4>
          <div class="files-grid">
            <div v-for="(file, index) in currentArticle.files" :key="index" class="file-item">
               <!-- 图片预览 -->
              <el-image 
                v-if="file.fileType === 'image'" 
                :src="getFullFileUrl(file.url)" 
                fit="cover"
                :preview-src-list="currentArticle.files.filter(f => f.fileType === 'image').map(f => getFullFileUrl(f.url))"
                style="width: 150px; height: 150px; cursor: pointer;"
              />
              
              <!-- 视频预览 -->
              <div v-else-if="file.fileType === 'video'" class="video-container">
                <video 
                  :src="getFullFileUrl(file.url)" 
                  controls
                  style="width: 300px; max-height: 200px;"
                />
              </div>
              
              <!-- 其他文件 -->
              <div v-else class="other-file">
                <el-icon size="40"><Document /></el-icon>
                <span class="file-name">{{ file.originalName || file.fileName }}</span>
              </div>
              
              <div class="file-info">
                <span class="file-type-tag">{{ file.fileType === 'image' ? '图片' : file.fileType === 'video' ? '视频' : '文件' }}</span>
                <span v-if="file.fileSize" class="file-size">{{ formatFileSize(file.fileSize) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Document } from '@element-plus/icons-vue'
import { getApprovedArticles, publishArticle, getArticleDetail, deleteArticle } from '../../services/api.js'
import request from '../../services/request.js'

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

.stat-cards {
  margin-bottom: 20px;
}

.stat-card {
  text-align: center;
  padding: 10px;
}

.stat-card .stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
}

.stat-card .stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 5px;
}

.stat-card.warning .stat-value {
  color: #e6a23c;
}

.stat-card.success .stat-value {
  color: #67c23a;
}

.stat-card.info .stat-value {
  color: #909399;
}

.search-card {
  margin-bottom: 20px;
}

.table-card {
  margin-bottom: 20px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-actions {
  display: flex;
  gap: 10px;
}

.article-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.title-text {
  color: #409eff;
  cursor: pointer;
}

.title-text:hover {
  text-decoration: underline;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.article-detail {
  padding: 20px;
}

.article-detail h3 {
  margin-bottom: 15px;
  font-size: 20px;
}

.article-meta {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  color: #666;
  font-size: 14px;
}

.article-cover {
  margin-bottom: 20px;
}

.article-cover img {
  max-width: 100%;
  max-height: 300px;
  border-radius: 8px;
}

.article-content {
  line-height: 1.8;
  margin-bottom: 20px;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
}

.article-summary {
  padding: 15px;
  background: #ecf5ff;
  border-radius: 8px;
  font-size: 14px;
}

@media (max-width: 768px) {
  .search-card .el-row {
    margin-bottom: -10px;
  }
  
  .search-card .el-col {
    margin-bottom: 10px;
  }
  
  .table-actions {
    flex-direction: column;
  }
}

/* 附件样式 */
.article-files {
  margin-top: 20px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 8px;
}

.article-files h4 {
  margin: 0 0 15px 0;
  color: #303133;
}

.files-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
}

.file-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
  background: #fff;
  border-radius: 4px;
  border: 1px solid #dcdfe6;
}

.file-info {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.file-type-tag {
  font-size: 12px;
  padding: 2px 8px;
  background: #ecf5ff;
  color: #409eff;
  border-radius: 4px;
}

.file-size {
  font-size: 12px;
  color: #909399;
}

.other-file {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 150px;
  height: 150px;
  color: #909399;
}

.other-file .file-name {
  margin-top: 8px;
  font-size: 12px;
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: center;
}
</style>