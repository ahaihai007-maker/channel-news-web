<template>
  <div class="article-detail-user-view">
    <el-card v-loading="loading">
      <template #header>
        <div class="card-header">
          <span>稿件详情</span>
          <el-button @click="goBack">
            <el-icon><ArrowLeft /></el-icon>
            返回
          </el-button>
        </div>
      </template>
      
      <div v-if="article" class="article-detail">
        <div class="detail-header">
          <h1 class="title">{{ article.title }}</h1>
          <div class="meta">
            <StatusTag :status="article.status" />
            <span class="time">创建于: {{ formatDate(article.createdAt) }}</span>
            <span class="time">更新于: {{ formatDate(article.updatedAt) }}</span>
          </div>
        </div>
        
        <el-divider />
        
        <div class="summary-section" v-if="article.summary">
          <h3>摘要</h3>
          <el-alert
            :title="article.summary"
            type="info"
            :closable="false"
          />
        </div>
        
        <div class="content-section">
          <h3>正文内容</h3>
          <div class="content" v-html="article.content"></div>
        </div>
        
        <el-divider v-if="article.status === 'rejected' && article.reviewComment" />
        
        <div class="review-section" v-if="article.status === 'rejected' && article.reviewComment">
          <h3>审核意见</h3>
          <el-alert
            :title="article.reviewComment"
            type="error"
            :closable="false"
            show-icon
          />
        </div>
        
        <div class="actions">
          <el-button type="primary" @click="editArticle">
            <el-icon><Edit /></el-icon>
            编辑
          </el-button>
          <el-button v-if="article.status === 'draft'" type="success" @click="submitReview">
            <el-icon><Upload /></el-icon>
            提交审核
          </el-button>
        </div>
      </div>
      
      <el-empty v-else description="文章不存在" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import StatusTag from '../../components/common/StatusTag.vue'
import { getArticleDetail, submitArticle } from '../../services/api.js'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Edit, Upload } from '@element-plus/icons-vue'

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
    const res = await getArticleDetail(id)
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

const editArticle = () => {
  router.push(`/user/article/edit/${article.value.id}`)
}

const submitReview = async () => {
  try {
    const res = await submitArticle(article.value.id)
    if (res.code === 200) {
      ElMessage.success('提交审核成功')
      fetchArticle()
    }
  } catch (error) {
    ElMessage.error('提交审核失败')
  }
}

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleString('zh-CN')
}

onMounted(() => {
  fetchArticle()
})
</script>

<style scoped>
.article-detail-user-view {
  padding: 20px 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-header {
  margin-bottom: 20px;
}

.title {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: #303133;
}

.meta {
  display: flex;
  align-items: center;
  gap: 20px;
  color: #909399;
  font-size: 14px;
}

.summary-section,
.content-section,
.review-section {
  margin-bottom: 24px;
}

.summary-section h3,
.content-section h3,
.review-section h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 12px 0;
  color: #606266;
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

.actions {
  display: flex;
  gap: 12px;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}
</style>
