<template>
  <div class="home-view">
    <NavHeader />
    
    <main class="main-content">
      <div class="hero-section">
        <h1>📚 文章投稿系统</h1>
        <p>发现优质内容，分享你的知识</p>
      </div>
      
      <div class="articles-section">
        <div class="section-header">
          <h2>最新文章</h2>
        </div>
        
        <div v-if="loading" class="loading">
          <el-skeleton :rows="5" animated />
        </div>
        
        <div v-else-if="articles.length === 0" class="empty">
          <el-empty description="暂无文章" />
        </div>
        
        <div v-else class="articles-grid">
          <ArticleCard 
            v-for="article in articles" 
            :key="article.id" 
            :article="article" 
          />
        </div>
        
        <Pagination
          v-if="total > 0"
          v-model="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          @change="fetchArticles"
        />
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import NavHeader from '@/components/common/NavHeader.vue'
import ArticleCard from '@/components/common/ArticleCard.vue'
import Pagination from '@/components/common/Pagination.vue'
import { getPublishedArticles } from '@/services/api.js'
import { ElMessage } from 'element-plus'

const articles = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const fetchArticles = async () => {
  loading.value = true
  try {
    const res = await getPublishedArticles({
      page: currentPage.value,
      pageSize: pageSize.value
    })
    if (res.code === 200) {
      articles.value = res.data.list
      total.value = res.data.total
    }
  } catch (error) {
    ElMessage.error('获取文章列表失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchArticles()
})
</script>

<style scoped>
.home-view {
  min-height: 100vh;
  background: #f5f7fa;
}

.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.hero-section {
  text-align: center;
  padding: 60px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: #fff;
  margin-bottom: 30px;
}

.hero-section h1 {
  font-size: 36px;
  margin: 0 0 16px 0;
}

.hero-section p {
  font-size: 18px;
  opacity: 0.9;
  margin: 0;
}

.articles-section {
  background: #fff;
  border-radius: 12px;
  padding: 30px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h2 {
  font-size: 22px;
  margin: 0;
  color: #303133;
}

.articles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.loading {
  padding: 40px;
}

.empty {
  padding: 60px 0;
}
</style>
