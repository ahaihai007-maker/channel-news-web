<template>
  <div class="review-pending-view">
    <!-- 搜索栏 -->
    <el-card class="search-card" shadow="never">
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
          <el-button type="success" @click="fetchArticles">刷新</el-button>
          <el-button type="warning" @click="showSubmitDialog">快速投稿</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 数据表格 -->
    <el-card>
      <template #header>
        <div class="card-header">
          <span>待审核稿件 (共 {{ total }} 条)</span>
        </div>
      </template>
      
      <el-table :data="articles" v-loading="loading" style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        
        <el-table-column prop="title" label="标题" min-width="200">
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
        
        <el-table-column prop="createdAt" label="提交时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="reviewArticle(row)">审核</el-button>
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
      
      <el-empty v-if="!loading && articles.length === 0" description="暂无待审核稿件" />
    </el-card>
    
    <!-- 快速投稿对话框 -->
    <el-dialog
      v-model="submitDialogVisible"
      title="快速投稿"
      width="700px"
      :close-on-click-modal="false"
    >
      <el-form :model="submitForm" label-width="100px">
        <el-form-item label="投稿类型" required>
          <el-select v-model="submitForm.articleType" style="width: 100%">
            <el-option label="#付费广告" value="AD" />
            <el-option label="#网友投稿" value="SUBMISSION" />
            <el-option label="手动投稿（无标签）" value="MANUAL" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="文章标题" required>
          <el-input v-model="submitForm.title" placeholder="请输入标题" />
        </el-form-item>
        
        <el-form-item label="作者" required>
          <el-input v-model="submitForm.authorUsername" placeholder="作者用户名" />
        </el-form-item>
        
        <el-form-item label="摘要">
          <el-input 
            v-model="submitForm.summary" 
            type="textarea" 
            :rows="2"
            placeholder="文章摘要（可选）"
          />
        </el-form-item>
        
        <el-form-item label="文章内容" required>
          <el-input 
            v-model="submitForm.content" 
            type="textarea" 
            :rows="8"
            placeholder="支持HTML格式"
          />
        </el-form-item>
        
        <el-form-item label="上传附件">
          <el-upload
            v-model:file-list="fileList"
            action="#"
            :auto-upload="false"
            :on-change="handleFileChange"
            :on-remove="handleFileRemove"
            multiple
            drag
          >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">
              拖拽文件到此处或 <em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                支持多个图片（jpg/png/gif）和视频（mp4/mov）文件，单个文件不超过50MB
              </div>
            </template>
          </el-upload>
        </el-form-item>
        
        <!-- 预览已选择的文件 -->
        <el-form-item label="已选文件" v-if="fileList.length > 0">
          <div class="file-preview-list">
            <div v-for="(file, index) in fileList" :key="index" class="file-preview-item">
              <el-image 
                v-if="isImage(file.raw.type)" 
                :src="getFileUrl(file)" 
                fit="cover"
                style="width: 100px; height: 100px;"
              />
              <div v-else class="video-preview">
                <el-icon><VideoCamera /></el-icon>
                <span>视频文件</span>
              </div>
              <span class="file-name">{{ file.name }}</span>
              <el-button 
                type="danger" 
                link 
                size="small" 
                @click="removeFile(index)"
              >
                删除
              </el-button>
            </div>
          </div>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="submitDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitting">
            提交投稿
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, inject } from 'vue'
import { useRouter } from 'vue-router'
import { getPendingReviews, submitArticleWithFiles } from '@/services/api.js'
import { ElMessage } from 'element-plus'
import { Search, UploadFilled, VideoCamera } from '@element-plus/icons-vue'

const router = useRouter()

// 获取父组件提供的刷新待审核数量方法
const refreshPendingCount = inject('refreshPendingCount')

// 搜索表单
const searchForm = reactive({
  keyword: '',
  authorType: '',
  dateRange: null
})

// 数据列表
const articles = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 投稿相关
const submitDialogVisible = ref(false)
const submitting = ref(false)
const submitForm = reactive({
  title: '',
  content: '',
  summary: '',
  authorUsername: 'admin',
  articleType: 'AD'
})
const fileList = ref([])

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
    
    const res = await getPendingReviews(params)
    if (res.code === 200) {
      articles.value = res.data.list
      total.value = res.data.total
    }
  } catch (error) {
    ElMessage.error('获取待审核列表失败')
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

// 查看详情
const viewDetail = (row) => {
  router.push(`/admin/review/${row.id}`)
}

// 审核
const reviewArticle = (row) => {
  router.push(`/admin/review/${row.id}`)
}

// 显示投稿对话框
const showSubmitDialog = () => {
  submitForm.title = ''
  submitForm.content = ''
  submitForm.summary = ''
  submitForm.authorUsername = 'admin'
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

  submitting.value = true
  try {
    const files = fileList.value.map(item => item.raw)
    
    const res = await submitArticleWithFiles({
      title: submitForm.title,
      content: submitForm.content,
      summary: submitForm.summary,
      authorUsername: submitForm.authorUsername,
      articleType: submitForm.articleType
    }, files)
    
    if (res.code === 200) {
      ElMessage.success(`投稿成功！上传了 ${res.data.fileCount || 0} 个文件`)
      submitDialogVisible.value = false
      fetchArticles()
      // 刷新待审核数量
      if (refreshPendingCount) {
        refreshPendingCount()
      }
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

// 格式化日期
const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleString('zh-CN')
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

onMounted(() => {
  fetchArticles()
})
</script>

<style scoped>
.review-pending-view {
  padding: 20px 0;
}

.search-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.file-preview-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.file-preview-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
  border: 1px solid #eee;
  border-radius: 4px;
}

.video-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100px;
  height: 100px;
  background: #f5f7fa;
  color: #909399;
}

.file-name {
  font-size: 12px;
  color: #666;
  margin: 5px 0;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
