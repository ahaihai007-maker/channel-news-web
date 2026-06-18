<template>
  <div class="my-articles-view">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>我的稿件</span>
          <el-button type="primary" @click="goToSubmit">
            <el-icon><Plus /></el-icon>
            投稿
          </el-button>
        </div>
      </template>
      
      <el-table :data="articles" v-loading="loading" style="width: 100%">
        <el-table-column prop="title" label="标题" min-width="200">
          <template #default="{ row }">
            <el-link type="primary" @click="viewDetail(row)">{{ row.title }}</el-link>
          </template>
        </el-table-column>
        
        <el-table-column prop="status" label="状态" width="120">
          <template #default="{ row }">
            <StatusTag :status="row.status" />
          </template>
        </el-table-column>
        
        <el-table-column prop="createdAt" label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        
        <el-table-column prop="updatedAt" label="更新时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.updatedAt) }}
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button-group>
              <el-button size="small" @click="editArticle(row)">
                <el-icon><Edit /></el-icon>
                编辑
              </el-button>
              <el-button 
                v-if="row.status === 'draft'" 
                size="small" 
                type="success"
                @click="submitReview(row)"
              >
                <el-icon><Upload /></el-icon>
                提交
              </el-button>
              <el-button size="small" type="danger" @click="deleteArticle(row)">
                <el-icon><Delete /></el-icon>
                删除
              </el-button>
            </el-button-group>
          </template>
        </el-table-column>
      </el-table>
      
      <Pagination
        v-if="total > 0"
        v-model="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        @change="fetchArticles"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import StatusTag from '@/components/common/StatusTag.vue'
import Pagination from '@/components/common/Pagination.vue'
import { getMyArticles, deleteArticle, submitArticle } from '@/services/api.js'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete, Upload } from '@element-plus/icons-vue'

const router = useRouter()

const articles = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const fetchArticles = async () => {
  loading.value = true
  try {
    const res = await getMyArticles({
      page: currentPage.value,
      pageSize: pageSize.value
    })
    if (res.code === 200) {
      articles.value = res.data.list
      total.value = res.data.total
    }
  } catch (error) {
    ElMessage.error('获取稿件列表失败')
  } finally {
    loading.value = false
  }
}

const goToSubmit = () => {
  router.push('/user/article/create')
}

const viewDetail = (row) => {
  router.push(`/user/article/detail/${row.id}`)
}

const editArticle = (row) => {
  router.push(`/user/article/edit/${row.id}`)
}

const submitReview = async (row) => {
  try {
    await ElMessageBox.confirm('确定要提交审核吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const res = await submitArticle(row.id)
    if (res.code === 200) {
      ElMessage.success('提交审核成功')
      fetchArticles()
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('提交审核失败')
    }
  }
}

const deleteArticleConfirm = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除这篇文章吗？此操作不可恢复。', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'danger'
    })
    
    const res = await deleteArticle(row.id)
    if (res.code === 200) {
      ElMessage.success('删除成功')
      fetchArticles()
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleString('zh-CN')
}

onMounted(() => {
  fetchArticles()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.my-articles-view {
  padding: 20px 0;
}
</style>
