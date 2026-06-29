<script setup>
defineProps({
  stats: { type: Object, required: true }
})

const searchForm = defineModel('searchForm', { required: true })

defineEmits(['search', 'reset'])
</script>

<template>
  <el-row :gutter="20" class="stat-cards">
    <el-col :xs="8" :sm="8">
      <el-card shadow="hover" class="stat-card">
        <div class="stat-value">{{ stats.totalArticles }}</div>
        <div class="stat-label">总文章数</div>
      </el-card>
    </el-col>
    <el-col :xs="8" :sm="8">
      <el-card shadow="hover" class="stat-card warning">
        <div class="stat-value">{{ stats.pendingArticles }}</div>
        <div class="stat-label">待审核</div>
      </el-card>
    </el-col>
    <el-col :xs="8" :sm="8">
      <el-card shadow="hover" class="stat-card success">
        <div class="stat-value">{{ stats.publishedArticles }}</div>
        <div class="stat-label">已发布</div>
      </el-card>
    </el-col>
  </el-row>

  <el-card class="search-card">
    <el-form :inline="true" class="search-form">
      <el-form-item label="搜索">
        <el-input
          v-model="searchForm.keyword"
          placeholder="标题"
          clearable
          style="width: 180px"
          @keyup.enter="$emit('search')"
        />
      </el-form-item>

      <el-form-item label="类型">
        <el-select v-model="searchForm.authorType" placeholder="全部" clearable style="width: 130px">
          <el-option label="网友投稿" value="submission" />
          <el-option label="机器人抓取" value="bot" />
          <el-option label="手动投稿" value="manual" />
          <el-option label="付费广告" value="ad" />
        </el-select>
      </el-form-item>

      <el-form-item label="状态">
        <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 110px">
          <el-option label="待审核" value="PENDING" />
          <el-option label="已通过" value="APPROVED" />
          <el-option label="已发布" value="PUBLISHED" />
          <el-option label="已拒绝" value="REJECTED" />
        </el-select>
      </el-form-item>

      <el-form-item label="日期">
        <el-date-picker
          v-model="searchForm.dateRange"
          type="daterange"
          range-separator="-"
          start-placeholder="开始"
          end-placeholder="结束"
          style="width: 260px"
          value-format="YYYY-MM-DD"
        />
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="$emit('search')">搜索</el-button>
        <el-button @click="$emit('reset')">重置</el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<style scoped>
.stat-cards {
  margin-bottom: 20px;
}

.stat-card {
  text-align: center;
  padding: 10px;
}

.stat-card .stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
}

.stat-card .stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 5px;
}

.stat-card.warning .stat-value {
  color: #e6a23c;
}

.stat-card.success .stat-value {
  color: #67c23a;
}

.search-card {
  margin-bottom: 20px;
}

@media (max-width: 768px) {
  .search-card .el-row {
    margin-bottom: -10px;
  }

  .search-card .el-col {
    margin-bottom: 10px;
  }
}
</style>
