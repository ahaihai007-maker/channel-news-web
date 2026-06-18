<template>
  <div class="search-view">
    <NavHeader />
    
    <main class="main-content">
      <div class="search-section">
        <h1>🔍 搜索文章</h1>
        <div class="search-box">
          <el-input
            v-model="keyword"
            placeholder="输入关键词搜索文章..."
            size="large"
            @keyup.enter="handleSearch"
          >
            <template #append>
              <el-button type="primary" @click="handleSearch">
                <el-icon><Search /></el-icon>
                搜索
              </el-button>
            </template>
          </el-input>
        </div>
      </div>
      
      <div class="results-section" v-if="hasSearched">
        <div class="results-header">
          <span v-if="total > 0">找到 {{ total }} 条结果</span>
        </div>
        
        <div v-if="loading" class="loading">
          <el-skeleton :rows="5" animated />
        </div>
        
        <div v-else-if="articles.length === 0" class="empty">
          <el-empty description="未找到相关文章" />
        </div>
        
        <div v-else class="articles-list">
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
          @change="fetchResults"
        />
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import NavHeader from '@/components/common/NavHeader.vue'
import ArticleCard from '@/components/common/ArticleCard.vue'
import Pagination from '@/components/common/Pagination.vue'
import { searchArticles } from '@/services/api.js'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'

const keyword = ref('')
const articles = ref([])
const loading = ref(false)
const hasSearched = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const handleSearch = () => {
  if (!keyword.value.trim()) {
    ElMessage.warning('请输入搜索关键词')
    return
  }
  hasSearched.value = true
  currentPage.value = 1
  fetchResults()
}

const fetchResults = async () => {
  loading.value = true
  try {
    const res = await searchArticles({
      keyword: keyword.value.trim(),
      page: currentPage.value,
      pageSize: pageSize.value
    })
    if (res.code === 200) {
      articles.value = res.data.list
      total.value = res.data.total
    }
  } catch (error) {
    ElMessage.error('搜索失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.search-view {
  min-height: 100vh;
  background: #f5f7fa;
}

.main-content {
  max-width: 900px;
  margin: 0 auto;
  padding: 40px 20px;
}

.search-section {
  text-align: center;
  padding: 60px 20px;
  background: #fff;
  border-radius: 12px;
  margin-bottom: 30px;
}

.search-section h1 {
  font-size: 28px;
  margin: 0 0 24px 0;
  color: #303133;
}

.search-box {
  max-width: 600px;
  margin: 0 auto;
}

.results-section {
  background: #fff;
  border-radius: 12px;
  padding: 30px;
}

.results-header {
  margin-bottom: 20px;
  color: #606266;
  font-size: 14px;
}

.articles-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.loading {
  padding: 40px;
}

.empty {
  padding: 60px 0;
}
</style>
