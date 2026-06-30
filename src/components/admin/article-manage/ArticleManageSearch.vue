<script setup>
const searchForm = defineModel('searchForm', { required: true })

defineEmits(['status-change', 'search', 'reset', 'refresh', 'open-submit'])
</script>

<template>
  <el-card class="search-card" shadow="never">
    <div class="search-line">
      <div class="search-item">
        <span class="label">状态：</span>
        <el-radio-group v-model="searchForm.status" @change="$emit('status-change')">
          <el-radio-button label="pending">待审核</el-radio-button>
          <el-radio-button label="approved">已审核</el-radio-button>
          <el-radio-button label="published">已发布</el-radio-button>
          <el-radio-button label="all">全部</el-radio-button>
        </el-radio-group>
      </div>

      <div class="search-item">
        <span class="label">搜索：</span>
        <el-input
          v-model="searchForm.keyword"
          placeholder="标题"
          clearable
          style="width: 200px"
          @keyup.enter="$emit('search')"
        />
      </div>
    </div>

    <div class="search-line">
      <div class="search-item">
        <span class="label">类型：</span>
        <el-select v-model="searchForm.authorType" placeholder="全部" clearable style="width: 140px">
          <el-option label="网友投稿" value="submission" />
          <el-option label="机器人抓取" value="bot" />
          <el-option label="手动投稿" value="manual" />
          <el-option label="付费广告" value="ad" />
        </el-select>
      </div>

      <div class="search-item">
        <span class="label">日期：</span>
        <el-date-picker
          v-model="searchForm.dateRange"
          type="daterange"
          range-separator="-"
          start-placeholder="开始"
          end-placeholder="结束"
          style="width: 260px"
          value-format="YYYY-MM-DD"
        />
      </div>
    </div>

    <div class="search-line button-line">
      <el-button type="primary" @click="$emit('search')">搜索</el-button>
      <el-button @click="$emit('reset')">重置</el-button>
      <el-button type="success" @click="$emit('refresh')">刷新</el-button>
      <el-button
        v-if="searchForm.status === 'pending' || searchForm.status === 'all'"
        type="warning"
        @click="$emit('open-submit')"
      >
        快速投稿
      </el-button>
    </div>
  </el-card>
</template>

<style scoped>
.search-card {
  margin-bottom: 20px;
}

.search-line {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  flex-wrap: nowrap;
}

.search-line:last-child {
  margin-bottom: 0;
}

.search-item {
  display: flex;
  align-items: center;
  margin-right: 20px;
}

.search-item .label {
  margin-right: 8px;
  font-size: 14px;
  color: #606266;
  white-space: nowrap;
}

.button-line {
  gap: 10px;
}
</style>
