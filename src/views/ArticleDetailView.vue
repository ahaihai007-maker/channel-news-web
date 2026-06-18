<template>
  <div class="article-detail-view">
    <NavHeader />
    
    <main class="main-content">
      <div v-if="loading" class="loading">
        <el-skeleton :rows="10" animated />
      </div>
      
      <div v-else-if="article" class="article-container">
        <el-card class="article-card">
          <div class="article-header">
            <h1 class="article-title">{{ article.title }}</h1>
            <div class="article-meta">
              <span class="author">
                <el-avatar :size="24" :icon="UserFilled" />
                {{ article.author?.username || '匿名用户' }}
              </span>
              <span class="date">
                <el-icon><Calendar /></el-icon>
                {{ formatDate(article.createdAt) }}
              </span>
              <span class="views">
                <el-icon><View /></el-icon>
                {{ article.viewCount || 0 }} 次浏览
              </span>
            </div>
          </div>
          
          <div class="article-summary" v-if="article.summary">
            <el-alert
              :title="article.summary"
              type="info"
              :closable="false"
              show-icon
            />
          </div>

          <div class="article-content" v-html="article.content"></div>

          <!-- 附件文件列表 -->
          <div class="article-files" v-if="article.files && article.files.length > 0">
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
        </el-card>
        
        <div class="actions">
          <el-button @click="goBack">
            <el-icon><ArrowLeft /></el-icon>
            返回列表
          </el-button>
        </div>
      </div>
      
      <div v-else class="error">
        <el-empty description="文章不存在或已删除" />
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import NavHeader from '@/components/common/NavHeader.vue'
import { getPublishedArticleDetail } from '@/services/api.js'
import { ElMessage } from 'element-plus'
import { UserFilled, Calendar, View, ArrowLeft, Document } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

const article = ref(null)
const loading = ref(false)

const fetchArticle = async () => {
  const id = route.params.id
  if (!id) {
    ElMessage.error('文章ID不存在')
    return
  }
  
  loading.value = true
  try {
    const res = await getPublishedArticleDetail(id)
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
.article-detail-view {
  min-height: 100vh;
  background: #f5f7fa;
}

.main-content {
  max-width: 900px;
  margin: 0 auto;
  padding: 30px 20px;
}

.loading {
  padding: 40px;
  background: #fff;
  border-radius: 8px;
}

.article-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.article-card {
  border-radius: 8px;
}

.article-header {
  border-bottom: 1px solid #ebeef5;
  padding-bottom: 20px;
  margin-bottom: 20px;
}

.article-title {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 16px 0;
  line-height: 1.4;
}

.article-meta {
  display: flex;
  gap: 20px;
  color: #909399;
  font-size: 14px;
}

.article-meta span {
  display: flex;
  align-items: center;
  gap: 6px;
}

.article-summary {
  margin-bottom: 24px;
}

.article-content {
  font-size: 16px;
  line-height: 1.8;
  color: #303133;
}

.article-content :deep(img) {
  max-width: 100%;
  height: auto;
}

.article-content :deep(p) {
  margin: 16px 0;
}

.article-content :deep(h2) {
  font-size: 22px;
  margin: 24px 0 16px;
}

.article-content :deep(h3) {
  font-size: 18px;
  margin: 20px 0 12px;
}

.article-files {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.article-files h3 {
  font-size: 16px;
  color: #606266;
  margin-bottom: 16px;
}

.file-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.file-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
  width: 170px;
}

.file-item .file-info {
  margin-top: 8px;
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
  max-width: 150px;
}

.file-item .file-size {
  font-size: 11px;
  color: #909399;
  display: block;
  margin-top: 4px;
}

.video-item video {
  border-radius: 4px;
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

.actions {
  display: flex;
  justify-content: center;
}

.error {
  padding: 60px 0;
  background: #fff;
  border-radius: 8px;
}
</style>
