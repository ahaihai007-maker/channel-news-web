<template>
  <div class="review-history-view">
    <!-- 搜索栏 -->
    <el-card class="search-card" shadow="never">
      <el-row :gutter="20" align="middle">
        <el-col :xs="24" :md="6">
          <el-input
            v-model="searchForm.keyword"
            placeholder="搜索标题"
            clearable
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-col>
        
        <el-col :xs="24" :md="4">
          <el-select v-model="searchForm.authorType" placeholder="投稿类型" clearable style="width: 100%">
            <el-option label="全部" value="" />
            <el-option label="网友投稿" value="submission" />
            <el-option label="机器人抓取" value="bot" />
            <el-option label="手动投稿" value="manual" />
            <el-option label="付费广告" value="ad" />
          </el-select>
        </el-col>
        
        <el-col :xs="24" :md="5">
          <el-select v-model="searchForm.status" placeholder="审核结果" clearable style="width: 100%">
            <el-option label="全部" value="" />
            <el-option label="已通过" value="APPROVED" />
            <el-option label="已拒绝" value="REJECTED" />
          </el-select>
        </el-col>
        
        <el-col :xs="24" :md="5">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 100%"
            value-format="YYYY-MM-DD"
          />
        </el-col>
        
        <el-col :xs="24" :md="4">
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>搜索
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 数据表格 -->
    <el-card>
      <template #header>
        <div class="card-header">
          <span>审核历史 (共 {{ total }} 条)</span>
        </div>
      </template>
      
      <el-table :data="historyList" v-loading="loading" style="width: 100%">
        <el-table-column prop="id" label="ID" width="60" />
        
        <el-table-column label="文章标题" min-width="200">
          <template #default="{ row }">
            <el-link type="primary" @click="viewDetail(row)" v-if="row.articleTitle">
              {{ row.articleTitle }}
            </el-link>
            <span v-else class="text-muted">标题未获取</span>
          </template>
        </el-table-column>
        
        <el-table-column label="作者" width="100">
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
        
        <el-table-column label="审核结果" width="90">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.result)" size="small">
              {{ getStatusText(row.result) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="审核意见" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.comment">{{ row.comment }}</span>
            <span v-else-if="row.result === 'APPROVED' || row.result === 'approved'" class="text-success">审核通过</span>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="reviewerName" label="审核人" width="100">
          <template #default="{ row }">
            {{ row.reviewerName || '管理员' }}
          </template>
        </el-table-column>
        
        <el-table-column label="审核时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.reviewTime) }}
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
          @size-change="fetchHistory"
          @current-change="fetchHistory"
        />
      </div>
      
      <el-empty v-if="!loading && historyList.length === 0" description="暂无审核记录" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getReviewHistory } from '@/services/api.js'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'

const router = useRouter()

const loading = ref(false)
const historyList = ref([])

const searchForm = reactive({
  keyword: '',
  authorType: '',
  status: '',
  dateRange: null
})

const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const fetchHistory = async () => {
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
    if (searchForm.status) {
      params.status = searchForm.status
    }
    // 添加日期范围参数
    if (searchForm.dateRange && searchForm.dateRange.length === 2) {
      params.startDate = searchForm.dateRange[0]
      params.endDate = searchForm.dateRange[1]
    }
    
    const res = await getReviewHistory(params)
    if (res.code === 200) {
      historyList.value = res.data.list || []
      total.value = res.data.total || 0
    }
  } catch (error) {
    console.error('获取审核历史失败:', error)
    ElMessage.error('获取审核历史失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
  fetchHistory()
}

const handleReset = () => {
  searchForm.keyword = ''
  searchForm.status = ''
  searchForm.dateRange = null
  currentPage.value = 1
  fetchHistory()
}

const getStatusType = (status) => {
  const s = String(status).toUpperCase()
  if (s === 'APPROVED') return 'success'
  if (s === 'REJECTED') return 'danger'
  return 'info'
}

const getStatusText = (status) => {
  const s = String(status).toUpperCase()
  if (s === 'APPROVED') return '已通过'
  if (s === 'REJECTED') return '已拒绝'
  return s
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

const viewDetail = (row) => {
  // 跳转到审核详情页面（在同一窗口打开）
  if (row.articleId) {
    router.push(`/admin/review/${row.articleId}`)
  }
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}

onMounted(() => {
  fetchHistory()
})
</script>

<style scoped>
.review-history-view {
  padding: 20px 0;
}

.search-card {
  margin-bottom: 20px;
}

.card-header {
  font-weight: bold;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.text-success {
  color: #67c23a;
}

.text-muted {
  color: #909399;
}
</style>