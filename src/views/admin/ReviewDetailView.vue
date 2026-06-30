<template>
  <div class="review-detail-view">
    <el-card v-loading="loading">
      <template #header>
        <div class="card-header">
          <span>审核详情</span>
          <el-button @click="goBack">
            <el-icon><ArrowLeft /></el-icon>
            返回
          </el-button>
        </div>
      </template>
      
      <div v-if="article" class="review-detail">
        <div class="article-info">
          <h2 class="title">{{ article.title }}</h2>
          <div class="meta">
            <span>作者: {{ article.author?.username || '匿名' }}</span>
            <span>提交时间: {{ formatDate(article.createdAt) }}</span>
          </div>
        </div>
        
        <el-divider />
        
        <div class="summary-section" v-if="article.summary">
          <h3>摘要</h3>
          <p>{{ article.summary }}</p>
        </div>
        
        <div class="content-section">
          <h3>正文内容</h3>
          <div class="content" v-html="article.content"></div>
        </div>
        
        <!-- 附件文件列表 -->
        <div class="files-section" v-if="article.files && article.files.length > 0">
          <el-divider />
          <h3>附件 ({{ article.files.length }})</h3>
          <div class="file-list">
            <div v-for="file in article.files" :key="file.id" class="file-item">
              <el-image 
                v-if="file.fileType === 'image'" 
                :src="getFileUrl(file.url)" 
                fit="cover"
                style="width: 150px; height: 150px;"
                :preview-src-list="getImagePreviewList()"
              />
              <div v-else-if="file.fileType === 'video'" class="video-item">
                <video :src="getFileUrl(file.url)" controls style="max-width: 300px; max-height: 200px;"></video>
              </div>
              <div v-else class="other-file">
                <el-icon :size="32"><Document /></el-icon>
                <span>{{ file.originalName }}</span>
              </div>
              <div class="file-info">
                <span class="file-name" :title="file.originalName">{{ file.originalName }}</span>
                <span class="file-size">{{ formatFileSize(file.fileSize) }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <el-divider />
        
        <!-- 只有待审核状态才显示审核操作按钮 -->
        <div class="review-actions" v-if="article.status === 'PENDING'">
          <h3>审核操作</h3>
          <div class="action-buttons">
            <el-button type="success" size="large" @click="handleApprove">
              <el-icon><Check /></el-icon>
              审核通过{{ article.articleType === 'SUBMISSION' ? '（自动润色）' : '' }}
            </el-button>
            <el-button type="danger" size="large" @click="showRejectDialog">
              <el-icon><Close /></el-icon>
              审核拒绝
            </el-button>
          </div>
        </div>
        
        <!-- 已审核状态显示提示 -->
        <div class="review-actions" v-else>
          <el-alert
            :title="article.status === 'APPROVED' ? '该文章已审核通过' : '该文章已被拒绝'"
            :type="article.status === 'APPROVED' ? 'success' : 'error'"
            :closable="false"
            show-icon
          />
        </div>
      </div>
      
      <el-empty v-else description="文章不存在" />
    </el-card>
    
    <!-- 润色预览对话框 -->
    <el-dialog
      v-model="polishDialogVisible"
      title="AI润色预览"
      width="80%"
      :close-on-click-modal="false"
    >
      <div class="polish-preview">
        <el-row :gutter="20">
          <el-col :span="12">
            <h4>原文</h4>
            <div class="preview-box original">
              <p><strong>标题：</strong>{{ polishData.originalTitle }}</p>
              <div v-html="polishData.originalContent"></div>
            </div>
          </el-col>
          <el-col :span="12">
            <h4>润色后</h4>
            <div class="preview-box polished">
              <el-input v-model="polishData.polishedTitle" placeholder="标题" />
              <el-input
                v-model="polishData.polishedContent"
                type="textarea"
                :rows="8"
                placeholder="正文内容"
              />
            </div>
          </el-col>
        </el-row>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="polishDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="applyPolish" :loading="applying">
            应用润色
          </el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 拒绝原因对话框（只有待审核状态才需要） -->
    <el-dialog
      v-model="rejectDialogVisible"
      title="填写拒绝原因"
      width="500px"
      v-if="article?.status === 'PENDING'"
    >
      <el-input
        v-model="rejectReason"
        type="textarea"
        :rows="4"
        placeholder="请输入拒绝原因，将反馈给作者..."
        maxlength="500"
        show-word-limit
      />
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="rejectDialogVisible = false">取消</el-button>
          <el-button type="danger" @click="handleReject" :loading="rejecting">
            确认拒绝
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getReviewDetail, approveArticle, rejectArticle, polishArticle, updateReviewArticle } from '@/services/api.js'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Check, Close, Document, MagicStick } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

const article = ref(null)
const loading = ref(false)
const rejectDialogVisible = ref(false)
const rejectReason = ref('')
const rejecting = ref(false)

// 润色相关
const polishing = ref(false)
const applying = ref(false)
const polishDialogVisible = ref(false)
const polishData = reactive({
  originalTitle: '',
  originalContent: '',
  polishedTitle: '',
  polishedContent: ''
})

const fetchArticle = async () => {
  const id = route.params.id
  if (!id) {
    ElMessage.error('文章ID不存在')
    return
  }
  
  loading.value = true
  try {
    const res = await getReviewDetail(id)
    if (res.code === 200) {
      article.value = res.data
    } else {
      ElMessage.error(res.message || '获取文章失败')
    }
  } catch (error) {
    ElMessage.error('获取文章详情失败')
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.back()
}

const handlePolish = async () => {
  polishing.value = true
  try {
    const res = await polishArticle(article.value.id)
    if (res.code === 200) {
      polishData.originalTitle = res.data.originalTitle
      polishData.originalContent = res.data.originalContent
      polishData.polishedTitle = res.data.polishedTitle
      polishData.polishedContent = res.data.polishedContent
      polishDialogVisible.value = true
    } else {
      ElMessage.error(res.message || '润色失败')
    }
  } catch (error) {
    ElMessage.error('润色请求失败')
  } finally {
    polishing.value = false
  }
}

const applyPolish = async () => {
  applying.value = true
  try {
    const res = await updateReviewArticle(article.value.id, {
      title: polishData.polishedTitle,
      content: polishData.polishedContent
    })
    if (res.code === 200) {
      ElMessage.success('润色已应用')
      polishDialogVisible.value = false
      fetchArticle()
    } else {
      ElMessage.error(res.message || '应用失败')
    }
  } catch (error) {
    ElMessage.error('应用润色失败')
  } finally {
    applying.value = false
  }
}

const handleApprove = async () => {
  try {
    const res = await approveArticle(article.value.id)
    if (res.code === 200) {
      ElMessage.success('审核通过成功')
      router.push('/admin/article-manage?status=approved')
    }
  } catch (error) {
    ElMessage.error('审核操作失败')
  }
}

const showRejectDialog = () => {
  rejectReason.value = ''
  rejectDialogVisible.value = true
}

const handleReject = async () => {
  if (!rejectReason.value.trim()) {
    ElMessage.warning('请输入拒绝原因')
    return
  }
  
  rejecting.value = true
  try {
    const res = await rejectArticle(article.value.id, rejectReason.value)
    if (res.code === 200) {
      ElMessage.success('审核拒绝成功')
      rejectDialogVisible.value = false
      router.push('/admin/article-manage')
    }
  } catch (error) {
    ElMessage.error('审核操作失败')
  } finally {
    rejecting.value = false
  }
}

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleString('zh-CN')
}

// 获取文件完整URL
const getFileUrl = (url) => {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return `${window.location.protocol}//${window.location.host}${url}`
}

// 获取图片预览列表
const getImagePreviewList = () => {
  if (!article.value?.files) return []
  return article.value.files
    .filter(f => f.fileType === 'image')
    .map(f => getFileUrl(f.url))
}

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

onMounted(() => {
  fetchArticle()
})
</script>

<style scoped>
.review-detail-view {
  padding: 20px 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.article-info {
  margin-bottom: 20px;
}

.title {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 12px 0;
  color: #303133;
}

.meta {
  display: flex;
  gap: 20px;
  color: #909399;
  font-size: 14px;
}

.summary-section,
.content-section {
  margin-bottom: 24px;
}

.summary-section h3,
.content-section h3,
.review-actions h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 12px 0;
  color: #606266;
}

.summary-section p {
  color: #606266;
  line-height: 1.6;
  margin: 0;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 4px;
}

.content {
  font-size: 15px;
  line-height: 1.8;
  color: #303133;
}

.content :deep(img) {
  max-width: 100%;
  height: auto;
}

.action-buttons {
  display: flex;
  gap: 20px;
}

.files-section {
  margin-bottom: 24px;
}

.files-section h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 12px 0;
  color: #606266;
}

.file-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.file-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

.file-item .file-info {
  margin-top: 12px;
  text-align: center;
  width: 100%;
}

.file-item .file-name {
  font-size: 12px;
  color: #606266;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

.file-item .file-size {
  font-size: 11px;
  color: #909399;
  display: block;
  margin-top: 4px;
}

.video-item {
  width: 100%;
  display: flex;
  justify-content: center;
}

.video-item video {
  border-radius: 4px;
  width: 100%;
  max-height: 200px;
}

.other-file {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100px;
  color: #909399;
}

.other-file {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 150px;
  width: 150px;
  color: #909399;
}

.other-file span {
  margin-top: 8px;
  font-size: 12px;
  text-align: center;
  word-break: break-all;
  padding: 0 10px;
}

/* 润色预览样式 */
.polish-preview h4 {
  margin: 0 0 10px 0;
  color: #606266;
}

.preview-box {
  background: #f5f7fa;
  padding: 15px;
  border-radius: 8px;
  min-height: 200px;
}

.preview-box.original {
  font-size: 14px;
  line-height: 1.6;
}

.preview-box.polished {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>
