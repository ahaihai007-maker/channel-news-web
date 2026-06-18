<template>
  <div class="article-manage-view">
    <!-- 搜索栏 -->
    <el-card class="search-card" shadow="never">
      <!-- 第一排：状态 + 搜索 -->
      <div class="search-line">
        <div class="search-item">
          <span class="label">状态：</span>
          <el-radio-group v-model="searchForm.status" @change="handleStatusChange">
            <el-radio-button label="pending">待审核</el-radio-button>
            <el-radio-button label="approved">已审核</el-radio-button>
            <el-radio-button label="publishing">发布中</el-radio-button>
            <el-radio-button label="all">全部</el-radio-button>
          </el-radio-group>
        </div>
        
        <div class="search-item">
          <span class="label">搜索：</span>
          <el-input
            v-model="searchForm.keyword"
            placeholder="标题"
            clearable
            @keyup.enter="handleSearch"
            style="width: 200px"
          />
        </div>
      </div>
      
      <!-- 第二排：类型 + 日期 -->
      <div class="search-line">
        <div class="search-item">
          <span class="label">类型：</span>
          <el-select v-model="searchForm.authorType" placeholder="全部" clearable style="width: 140px">
            <el-option label="网友投稿" value="submission" />
            <el-option label="机器人抓取" value="bot" />
            <el-option label="手动投稿" value="manual" />
            <el-option label="付费广告" value="ad" />
          </el-select>
        </div>
        
        <div class="search-item">
          <span class="label">日期：</span>
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="-"
            start-placeholder="开始"
            end-placeholder="结束"
            style="width: 260px"
            value-format="YYYY-MM-DD"
          />
        </div>
      </div>

      <!-- 第三排：4个按钮 -->
      <div class="search-line button-line">
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="handleReset">重置</el-button>
        <el-button type="success" @click="fetchArticles">刷新</el-button>
        <el-button type="warning" @click="showSubmitDialog" v-if="searchForm.status === 'pending' || searchForm.status === 'all'">快速投稿</el-button>
      </div>
    </el-card>

    <!-- 数据表格 -->
    <el-card>
      <template #header>
        <div class="card-header">
          <span>{{ getStatusTitle() }} (共 {{ total }} 条)</span>
        </div>
      </template>
      
      <!-- 批量操作工具栏 -->
      <div class="batch-toolbar" v-if="selectedArticles.length > 0">
        <el-alert
          :title="`已选择 ${selectedArticles.length} 篇文章`"
          type="info"
          :closable="false"
          show-icon
        >
          <template #default>
            <el-button-group>
              <el-button 
                v-if="searchForm.status === 'pending' || searchForm.status === 'all'"
                type="success" 
                size="small" 
                @click="handleBatchApprove"
                :loading="batchLoading"
              >
                <el-icon><Check /></el-icon> 批量通过
              </el-button>
              <el-button 
                v-if="searchForm.status === 'pending' || searchForm.status === 'all'"
                type="danger" 
                size="small" 
                @click="handleBatchReject"
                :loading="batchLoading"
              >
                <el-icon><Close /></el-icon> 批量拒绝
              </el-button>
              <el-button 
                v-if="searchForm.status === 'approved' || searchForm.status === 'all'"
                type="primary" 
                size="small" 
                @click="handleBatchPublish"
                :loading="batchLoading"
              >
                <el-icon><Promotion /></el-icon> 批量发布
              </el-button>
              <el-button 
                type="warning" 
                size="small" 
                @click="handleBatchDelete"
                :loading="batchLoading"
              >
                <el-icon><Delete /></el-icon> 批量删除
              </el-button>
            </el-button-group>
            <el-button size="small" @click="clearSelection" style="margin-left: 10px;">
              取消选择
            </el-button>
          </template>
        </el-alert>
      </div>

      <el-table 
        :data="articles" 
        v-loading="loading" 
        style="width: 100%; min-height: 400px;"
        @selection-change="handleSelectionChange"
        ref="tableRef"
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column prop="id" label="ID" width="80" />
        
        <el-table-column label="标题" min-width="250">
          <template #default="{ row }">
            <el-link type="primary" @click="viewDetail(row)">{{ row.title }}</el-link>
          </template>
        </el-table-column>
        
        <el-table-column label="作者" width="120">
          <template #default="{ row }">
            {{ row.authorName || '匿名' }}
          </template>
        </el-table-column>
        
        <el-table-column label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getTypeTagType(row.articleType)" size="small">
              {{ getTypeLabel(row.articleType) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)" size="small">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="附件" width="80">
          <template #default="{ row }">
            <el-tag v-if="row.hasFiles || (row.files && row.files.length > 0)" type="success" size="small">有</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        
        <el-table-column label="时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.updatedAt || row.createdAt) }}
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="120" fixed="right" align="center">
          <template #default="{ row }">
            <el-button 
              v-if="row.status === 'PENDING'"
              type="primary" 
              size="small" 
              @click="reviewArticle(row)"
              style="margin-right: 5px;"
            >
              审核
            </el-button>
            <el-button 
              v-else-if="row.status === 'APPROVED'"
              type="success" 
              size="small" 
              @click="publishArticleConfirm(row)"
              :loading="publishingId === row.id"
              :disabled="publishingId === row.id"
              style="margin-right: 5px;"
            >
              {{ publishingId === row.id ? '发布中' : '发布' }}
            </el-button>
            <el-tag v-else-if="row.status === 'PUBLISHING'" type="primary" size="small">发布中</el-tag>
            <el-tag v-else-if="row.status === 'PUBLISHED'" type="success" size="small">已发布</el-tag>
            <el-tag v-else-if="row.status === 'REJECTED'" type="danger" size="small">已拒绝</el-tag>
            <span v-else>-</span>
            <!-- 预览按钮 -->
            <el-button
              link
              type="info"
              size="small"
              @click="openPreviewDialog(row)"
              title="L1-L6 预览"
            >
              <el-icon><View /></el-icon>
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination-container" v-if="total > 0">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchArticles"
          @current-change="fetchArticles"
        />
      </div>
      
      <el-empty v-if="!loading && articles.length === 0" description="暂无数据" />
    </el-card>

    <!-- 快速投稿弹窗 -->
    <el-dialog v-model="submitDialogVisible" title="快速投稿" width="800px">
      <el-form :model="submitForm" label-width="80px">
        <el-form-item label="标题" required>
          <el-input v-model="submitForm.title" placeholder="请输入标题" />
        </el-form-item>
        <el-form-item label="内容" required>
          <el-input v-model="submitForm.content" type="textarea" :rows="10" placeholder="请输入内容，支持HTML标签" />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="submitForm.articleType" placeholder="选择类型">
            <el-option label="网友投稿" value="SUBMISSION" />
            <el-option label="机器人抓取" value="BOT" />
            <el-option label="手动投稿" value="MANUAL" />
            <el-option label="付费广告" value="AD" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="submitDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">提交</el-button>
      </template>
    </el-dialog>

    <!-- 文章预览弹窗 - Telegram 风格 -->
    <el-dialog
      v-model="detailVisible"
      title="文章预览"
      width="600px"
      class="article-preview-dialog telegram-style"
      :close-on-click-modal="false"
    >
      <div v-if="currentArticle" class="telegram-message-preview">
        <!-- Telegram 风格消息气泡 -->
        <div class="telegram-message-bubble">
          <!-- 作者信息 -->
          <div class="telegram-author">
            <span class="author-name">{{ currentArticle.authorName || '匿名' }}</span>
            <span v-if="currentArticle.articleType" class="author-badge">{{ getTypeLabel(currentArticle.articleType) }}</span>
          </div>
          
          <!-- 标题 -->
          <h3 class="telegram-title">{{ currentArticle.title }}</h3>
          
          <!-- 媒体文件 - Telegram 风格内嵌展示 -->
          <div v-if="currentArticle.files && currentArticle.files.length > 0" class="telegram-media">
            <!-- 图片 - Telegram 风格网格 -->
            <div v-if="getImageFiles().length > 0" class="telegram-image-grid" :class="'grid-' + Math.min(getImageFiles().length, 4)">
              <div 
                v-for="(file, index) in getImageFiles().slice(0, 4)" 
                :key="'img-'+index" 
                class="telegram-image-item"
              >
                <el-image 
                  :src="getFileViewUrl(file.url)" 
                  fit="cover"
                  class="telegram-image"
                />
                <div v-if="index === 3 && getImageFiles().length > 4" class="image-more-overlay">
                  <span>+{{ getImageFiles().length - 4 }}</span>
                </div>
              </div>
            </div>
            
            <!-- 视频 - Telegram 风格 -->
            <div v-if="getVideoFiles().length > 0" class="telegram-video-list">
              <div 
                v-for="(file, index) in getVideoFiles()" 
                :key="'video-'+index" 
                class="telegram-video-item"
              >
                <video 
                  :src="getFileViewUrl(file.url)" 
                  controls
                  class="telegram-video"
                />
              </div>
            </div>
          </div>
          
          <!-- 正文内容 -->
          <div class="telegram-content" v-html="currentArticle.content"></div>
          
          <!-- 时间和状态 - Telegram 风格右下角 -->
          <div class="telegram-meta">
            <span class="telegram-time">{{ formatTelegramTime(currentArticle.createdAt) }}</span>
            <span class="telegram-status">✓</span>
          </div>
        </div>
        
        <!-- 操作按钮 -->
        <div class="telegram-actions" v-if="currentArticle.status === 'APPROVED'">
          <el-button type="primary" size="large" @click="publishArticleConfirm(currentArticle); detailVisible = false;">
            发布到频道
          </el-button>
        </div>
        <div class="telegram-actions" v-else-if="currentArticle.status === 'PENDING'">
          <el-button type="primary" size="large" @click="reviewArticle(currentArticle); detailVisible = false;">
            去审核
          </el-button>
        </div>
      </div>
    </el-dialog>

    <!-- L1-L6 消息预览对话框 -->
    <el-dialog
      v-model="previewDialogVisible"
      title="L1-L6 Telegram 消息预览"
      width="700px"
      :close-on-click-modal="false"
      class="preview-dialog"
    >
      <div v-loading="previewLoading">
        <!-- 标签选择 -->
        <div class="preview-config" style="margin-bottom: 20px; padding: 15px; background: #f5f7fa; border-radius: 8px;">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="地区标签" style="margin-bottom: 0;">
                <el-select v-model="previewRegionTag" placeholder="选择地区标签" clearable style="width: 100%" @change="generatePreview">
                  <el-option
                    v-for="tag in previewRegionTags"
                    :key="tag.code"
                    :label="tag.name"
                    :value="tag.code"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="类型标签" style="margin-bottom: 0;">
                <el-select v-model="previewTypeTag" placeholder="选择类型标签" clearable style="width: 100%" @change="generatePreview">
                  <el-option
                    v-for="tag in previewTypeTags"
                    :key="tag.code"
                    :label="tag.name"
                    :value="tag.code"
                  />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <!-- 预览内容 -->
          <div v-if="previewData" class="preview-content">
          <div class="l1-section">
            <div class="section-label">L1 - 头部标识</div>
            <div class="section-content" v-html="previewData.l1Header"></div>
          </div>
          
          <div class="l2-section">
            <div class="section-label">L2 - 时间元数据</div>
            <div class="section-content">{{ previewData.l2Meta }}</div>
          </div>
          
          <div class="l3-section">
            <div class="section-label">L3 - 内容区</div>
            <div class="section-content">{{ previewData.l3Content }}</div>
          </div>
          
          <div class="l4-section">
            <div class="section-label">L4 - 品牌观点</div>
            <div class="section-content">{{ previewData.l4View }}</div>
          </div>
          
          <div class="l5-section">
            <div class="section-label">L5 - 分隔线</div>
            <div class="section-content">{{ previewData.l5Divider }}</div>
          </div>
          
          <div class="l6-section">
            <div class="section-label">L6 - 装修模版</div>
            <div class="section-content" v-html="previewData.l6Postfix"></div>
          </div>

          <el-divider />

          <!-- 完整消息预览 -->
          <div class="full-preview">
            <div class="section-label">完整消息预览</div>
            <div class="telegram-message-bubble" style="background: #ffffff; padding: 15px; border-radius: 8px; border: 1px solid #e4e7ed;">
              <div v-html="previewData.fullMessage"></div>
            </div>
          </div>
        </div>

        <el-empty v-else description="选择标签后生成预览" />
      </div>

      <template #footer>
        <el-button @click="closePreviewDialog">关闭</el-button>
        <el-button type="primary" @click="generatePreview" :loading="previewLoading">
          <el-icon><Refresh /></el-icon> 刷新预览
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Check, Close, Promotion, Delete, View, Refresh } from '@element-plus/icons-vue'
import { getPendingReviews, getApprovedArticles, getPublishingArticles, getAllArticles, approveArticle, publishArticle, submitArticleWithFiles, getReviewDetail, getArticleDetail, batchApi, previewApi, tagApi } from '@/services/api.js'

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

// 发布文章确认
const publishArticleConfirm = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要发布文章 "${row.title}" 吗？`,
      '确认发布',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    publishingId.value = row.id
    const res = await publishArticle(row.id)
    
    if (res.code === 200) {
      ElMessage.success('发布成功')
      fetchArticles()
    } else {
      ElMessage.error(res.message || '发布失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('发布失败:', error)
      ElMessage.error('发布失败')
    }
  } finally {
    publishingId.value = null
  }
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
const tableRef = ref(null)
const selectedArticles = ref([])
const batchLoading = ref(false)

// 选择变化
const handleSelectionChange = (selection) => {
  selectedArticles.value = selection
}

// 清空选择
const clearSelection = () => {
  tableRef.value?.clearSelection()
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

  try {
    await ElMessageBox.confirm(
      `确定要批量发布选中的 ${selectedArticles.value.length} 篇文章吗？\n注意：批量发布可能需要较长时间，请耐心等待。`,
      '确认批量发布',
      { type: 'warning' }
    )

    batchLoading.value = true
    const articleIds = selectedArticles.value.map(a => a.id)

    const res = await batchApi.publish(articleIds)
    if (res.code === 200) {
      ElMessage.success(`发布完成：成功 ${res.data.successCount}/${res.data.total}`)
      clearSelection()
      fetchArticles()
    } else {
      ElMessage.error(res.message || '批量发布失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量发布失败:', error)
      ElMessage.error('批量发布失败')
    }
  } finally {
    batchLoading.value = false
  }
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

.search-card {
  margin-bottom: 20px;
}

.search-line {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  flex-wrap: nowrap;
}

.search-line:last-child {
  margin-bottom: 0;
}

.search-item {
  display: flex;
  align-items: center;
  margin-right: 20px;
}

.search-item .label {
  margin-right: 8px;
  font-size: 14px;
  color: #606266;
  white-space: nowrap;
}

.button-line {
  gap: 10px;
}

/* ==================== Telegram 风格预览样式 ==================== */

.telegram-message-preview {
  padding: 20px;
  background: #e5ddd5;
  min-height: 400px;
}

.telegram-message-bubble {
  background: #ffffff;
  border-radius: 12px;
  padding: 12px 16px;
  max-width: 100%;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
  position: relative;
}

.telegram-author {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.author-name {
  font-weight: 600;
  color: #168acd;
  font-size: 14px;
}

.author-badge {
  font-size: 11px;
  padding: 2px 6px;
  background: #e6f7ff;
  color: #168acd;
  border-radius: 4px;
  border: 1px solid #91d5ff;
}

.telegram-title {
  font-size: 16px;
  font-weight: 600;
  color: #000000;
  margin: 0 0 10px 0;
  line-height: 1.4;
}

/* Telegram 媒体展示 */
.telegram-media {
  margin-bottom: 12px;
}

/* Telegram 图片网格 */
.telegram-image-grid {
  display: grid;
  gap: 2px;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 10px;
}

.telegram-image-grid.grid-1 {
  grid-template-columns: 1fr;
}

.telegram-image-grid.grid-2 {
  grid-template-columns: 1fr 1fr;
}

.telegram-image-grid.grid-3 {
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
}

.telegram-image-grid.grid-3 .telegram-image-item:first-child {
  grid-column: span 2;
}

.telegram-image-grid.grid-4 {
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
}

.telegram-image-item {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  background: #f0f0f0;
}

.telegram-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.2s;
}

.telegram-image-item:hover .telegram-image {
  transform: scale(1.02);
}

.image-more-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
  font-weight: 600;
}

/* Telegram 视频列表 */
.telegram-video-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 10px;
}

.telegram-video-item {
  border-radius: 8px;
  overflow: hidden;
  background: #000;
}

.telegram-video {
  width: 100%;
  max-height: 300px;
  display: block;
}

/* Telegram 内容样式 */
.telegram-content {
  font-size: 15px;
  line-height: 1.5;
  color: #000000;
  margin-bottom: 8px;
}

.telegram-content :deep(p) {
  margin: 0 0 8px 0;
}

.telegram-content :deep(p):last-child {
  margin-bottom: 0;
}

.telegram-content :deep(img) {
  max-width: 100%;
  border-radius: 8px;
  margin: 8px 0;
}

/* Telegram 元信息 - 右下角时间 */
.telegram-meta {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  margin-top: 4px;
}

.telegram-time {
  font-size: 12px;
  color: #999999;
}

.telegram-status {
  color: #67C23A;
  font-weight: bold;
}

/* Telegram 操作按钮 */
.telegram-actions {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #d9d9d9;
  display: flex;
  justify-content: center;
}

.telegram-actions .el-button {
  padding: 12px 32px;
  font-size: 16px;
}

/* 弹窗样式调整 */
:deep(.telegram-style .el-dialog__body) {
  padding: 0;
}

:deep(.telegram-style .el-dialog__header) {
  background: #ffffff;
  border-bottom: 1px solid #e4e4e4;
  margin-right: 0;
  padding: 16px 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.operation-buttons {
  display: flex;
  justify-content: center;
  align-items: center;
  white-space: nowrap;
}

.operation-buttons .el-button {
  margin: 0;
}

/* 批量操作工具栏样式 */
.batch-toolbar {
  margin-bottom: 20px;
}

.batch-toolbar .el-alert {
  padding: 12px 16px;
}

.batch-toolbar .el-button-group {
  margin-left: 15px;
}

.batch-toolbar .el-icon {
  margin-right: 4px;
}

/* L1-L6 预览对话框样式 */
.preview-dialog .section-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
  font-weight: bold;
}

.preview-dialog .section-content {
  padding: 12px;
  background: #f5f7fa;
  border-radius: 4px;
  margin-bottom: 16px;
  font-size: 14px;
  line-height: 1.6;
  color: #303133;
}

.preview-dialog .l1-section .section-content {
  background: #e6f7ff;
  border-left: 3px solid #409eff;
}

.preview-dialog .l4-section .section-content {
  background: #f6ffed;
  border-left: 3px solid #67c23a;
}

.preview-dialog .l6-section .section-content {
  background: #fff7e6;
  border-left: 3px solid #e6a23c;
}

.preview-dialog .full-preview .telegram-message-bubble {
  background: #ffffff;
  padding: 15px;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
}
</style>