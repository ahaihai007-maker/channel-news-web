<template>
  <div class="article-card" @click="goToDetail">
    <div class="article-header">
      <h3 class="title">{{ article.title }}</h3>
      <span class="date">{{ formatDate(article.createdAt) }}</span>
    </div>
    <p class="summary">{{ article.summary || '暂无摘要' }}</p>
    <div class="article-footer">
      <div class="author">
        <el-avatar :size="24" :icon="UserFilled" />
        <span>{{ article.author?.username || '匿名用户' }}</span>
      </div>
      <div class="stats">
        <span class="stat-item">
          <el-icon><View /></el-icon>
          {{ article.viewCount || 0 }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { UserFilled, View } from '@element-plus/icons-vue'

const props = defineProps({
  article: {
    type: Object,
    required: true
  }
})

const router = useRouter()

const goToDetail = () => {
  router.push(`/article/${props.article.id}`)
}

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('zh-CN')
}
</script>

<style scoped>
.article-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.3s, box-shadow 0.3s;
}

.article-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.article-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
}

.date {
  font-size: 13px;
  color: #909399;
  white-space: nowrap;
  margin-left: 10px;
}

.summary {
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
  margin: 0 0 16px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.article-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.author {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #606266;
}

.stats {
  display: flex;
  gap: 16px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #909399;
}
</style>
