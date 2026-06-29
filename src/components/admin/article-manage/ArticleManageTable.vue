<script setup>
import { ref } from 'vue'

defineProps({
  articles: { type: Array, required: true },
  loading: { type: Boolean, required: true },
  total: { type: Number, required: true },
  selectedArticles: { type: Array, required: true },
  batchLoading: { type: Boolean, required: true },
  publishingId: { type: [Number, String], default: null },
  status: { type: String, required: true },
  statusTitle: { type: String, required: true },
  getTypeLabel: { type: Function, required: true },
  getTypeTagType: { type: Function, required: true },
  getStatusLabel: { type: Function, required: true },
  getStatusTagType: { type: Function, required: true },
  formatDate: { type: Function, required: true }
})

const currentPage = defineModel('currentPage', { required: true })
const pageSize = defineModel('pageSize', { required: true })

defineEmits([
  'selection-change',
  'view-detail',
  'review',
  'publish',
  'preview',
  'batch-approve',
  'batch-reject',
  'batch-publish',
  'batch-delete',
  'clear-selection',
  'page-change'
])

const tableRef = ref(null)

defineExpose({
  clearSelection: () => tableRef.value?.clearSelection()
})
</script>

<template>
  <el-card>
    <template #header>
      <div class="card-header">
        <span>{{ statusTitle }} (共 {{ total }} 条)</span>
      </div>
    </template>

    <div v-if="selectedArticles.length > 0" class="batch-toolbar">
      <el-alert
        :title="`已选择 ${selectedArticles.length} 篇文章`"
        type="info"
        :closable="false"
        show-icon
      >
        <template #default>
          <el-button-group>
            <el-button
              v-if="status === 'pending' || status === 'all'"
              type="success"
              size="small"
              :loading="batchLoading"
              @click="$emit('batch-approve')"
            >
              <el-icon><Check /></el-icon> 批量通过
            </el-button>
            <el-button
              v-if="status === 'pending' || status === 'all'"
              type="danger"
              size="small"
              :loading="batchLoading"
              @click="$emit('batch-reject')"
            >
              <el-icon><Close /></el-icon> 批量拒绝
            </el-button>
            <el-button
              v-if="status === 'approved' || status === 'all'"
              type="primary"
              size="small"
              :loading="batchLoading"
              @click="$emit('batch-publish')"
            >
              <el-icon><Promotion /></el-icon> 批量发布
            </el-button>
            <el-button
              type="warning"
              size="small"
              :loading="batchLoading"
              @click="$emit('batch-delete')"
            >
              <el-icon><Delete /></el-icon> 批量删除
            </el-button>
          </el-button-group>
          <el-button size="small" style="margin-left: 10px;" @click="$emit('clear-selection')">
            取消选择
          </el-button>
        </template>
      </el-alert>
    </div>

    <el-table
      ref="tableRef"
      :data="articles"
      v-loading="loading"
      style="width: 100%; min-height: 400px;"
      @selection-change="$emit('selection-change', $event)"
    >
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column prop="id" label="ID" width="80" />

      <el-table-column label="标题" min-width="250">
        <template #default="{ row }">
          <el-link type="primary" @click="$emit('view-detail', row)">{{ row.title }}</el-link>
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
            style="margin-right: 5px;"
            @click="$emit('review', row)"
          >
            审核
          </el-button>
          <el-button
            v-else-if="row.status === 'APPROVED'"
            type="success"
            size="small"
            :loading="publishingId === row.id"
            :disabled="publishingId === row.id"
            style="margin-right: 5px;"
            @click="$emit('publish', row)"
          >
            {{ publishingId === row.id ? '发布中' : '发布' }}
          </el-button>
          <el-tag v-else-if="row.status === 'PUBLISHING'" type="primary" size="small">发布中</el-tag>
          <el-tag v-else-if="row.status === 'PUBLISHED'" type="success" size="small">已发布</el-tag>
          <el-tag v-else-if="row.status === 'REJECTED'" type="danger" size="small">已拒绝</el-tag>
          <span v-else>-</span>
          <el-button
            link
            type="info"
            size="small"
            title="L1-L6 预览"
            @click="$emit('preview', row)"
          >
            <el-icon><View /></el-icon>
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div v-if="total > 0" class="pagination-container">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="$emit('page-change')"
        @current-change="$emit('page-change')"
      />
    </div>

    <el-empty v-if="!loading && articles.length === 0" description="暂无数据" />
  </el-card>
</template>

<style scoped>
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
</style>
