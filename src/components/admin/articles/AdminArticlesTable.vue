<script setup>
defineProps({
  articles: { type: Array, required: true },
  loading: { type: Boolean, required: true },
  selectedArticles: { type: Array, required: true },
  pagination: { type: Object, required: true },
  getStatusType: { type: Function, required: true },
  getStatusText: { type: Function, required: true },
  getTypeTagType: { type: Function, required: true },
  getTypeLabel: { type: Function, required: true },
  formatDate: { type: Function, required: true }
})

defineEmits([
  'selection-change',
  'view',
  'publish',
  'settle-payment',
  'delete',
  'batch-settle',
  'batch-publish',
  'batch-delete',
  'size-change',
  'page-change'
])
</script>

<template>
  <el-card class="table-card">
    <template #header>
      <div class="table-header">
        <span>文章列表</span>
        <div class="table-actions">
          <el-button type="warning" size="small" :disabled="!selectedArticles.length" @click="$emit('batch-settle')">
            批量结算
          </el-button>
          <el-button type="primary" size="small" :disabled="!selectedArticles.length" @click="$emit('batch-publish')">
            批量发布
          </el-button>
          <el-button type="danger" size="small" :disabled="!selectedArticles.length" @click="$emit('batch-delete')">
            批量删除
          </el-button>
        </div>
      </div>
    </template>

    <el-table
      :data="articles"
      v-loading="loading"
      stripe
      @selection-change="$emit('selection-change', $event)"
    >
      <el-table-column type="selection" width="55" />
      <el-table-column type="index" label="#" width="60" />

      <el-table-column label="标题" min-width="200">
        <template #default="{ row }">
          <div class="article-title">
            <span class="title-text" @click="$emit('view', row)">{{ row.title }}</span>
            <el-tag v-if="row.coverImage" size="small">有封面</el-tag>
          </div>
        </template>
      </el-table-column>

      <el-table-column prop="authorName" label="作者" width="120" />

      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)" size="small">
            {{ getStatusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column label="类型" width="100">
        <template #default="{ row }">
          <el-tag :type="getTypeTagType(row.articleType)" size="small">
            {{ getTypeLabel(row.articleType) }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="createdAt" label="创建时间" width="180">
        <template #default="{ row }">
          {{ formatDate(row.createdAt) }}
        </template>
      </el-table-column>

      <el-table-column prop="publishedAt" label="发布时间" width="180">
        <template #default="{ row }">
          {{ formatDate(row.publishedAt) }}
        </template>
      </el-table-column>

      <el-table-column label="操作" width="320">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="$emit('view', row)">查看</el-button>
          <el-button
            v-if="row.status === 'APPROVED'"
            type="success"
            link
            size="small"
            @click="$emit('publish', row)"
          >
            发布
          </el-button>
          <el-button
            v-if="row.status === 'PUBLISHED' && row.articleType === 'SUBMISSION'"
            type="warning"
            link
            size="small"
            @click="$emit('settle-payment', row)"
          >
            结算稿费
          </el-button>
          <el-button type="danger" link size="small" @click="$emit('delete', row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination">
      <el-pagination
        :current-page="pagination.page"
        :page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="$emit('size-change', $event)"
        @current-change="$emit('page-change', $event)"
      />
    </div>
  </el-card>
</template>

<style scoped>
.table-card {
  margin-bottom: 20px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-actions {
  display: flex;
  gap: 10px;
}

.article-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.title-text {
  color: #409eff;
  cursor: pointer;
}

.title-text:hover {
  text-decoration: underline;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .table-actions {
    flex-direction: column;
  }
}
</style>
