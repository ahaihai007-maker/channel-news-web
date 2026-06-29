<script setup>
defineProps({
  articles: { type: Array, required: true },
  loading: { type: Boolean, required: true },
  total: { type: Number, required: true },
  publishingId: { type: [Number, String], default: null },
  formatDate: { type: Function, required: true }
})

const currentPage = defineModel('currentPage', { required: true })
const pageSize = defineModel('pageSize', { required: true })

defineEmits(['view-detail', 'publish', 'page-change'])
</script>

<template>
  <el-card>
    <template #header>
      <div class="card-header">
        <span>待发布稿件 (共 {{ total }} 条)</span>
      </div>
    </template>

    <el-table :data="articles" v-loading="loading" style="width: 100%">
      <el-table-column prop="id" label="ID" width="60" />

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

      <el-table-column label="附件" width="100">
        <template #default="{ row }">
          <el-tag v-if="row.hasFiles" type="success" size="small">有附件</el-tag>
          <span v-else>-</span>
        </template>
      </el-table-column>

      <el-table-column label="通过时间" width="160">
        <template #default="{ row }">
          {{ formatDate(row.updatedAt) }}
        </template>
      </el-table-column>

      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <el-button
            type="primary"
            size="small"
            :loading="publishingId === row.id"
            :disabled="publishingId === row.id"
            @click="$emit('publish', row)"
          >
            {{ publishingId === row.id ? '发布中...' : '发布' }}
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

    <el-empty v-if="!loading && articles.length === 0" description="暂无待发布稿件" />
  </el-card>
</template>

<style scoped>
.card-header {
  font-weight: bold;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
