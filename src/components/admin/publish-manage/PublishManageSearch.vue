<script setup>
const searchForm = defineModel('searchForm', { required: true })

defineEmits(['search', 'reset', 'refresh'])
</script>

<template>
  <el-card class="search-card" shadow="never">
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
        <el-button type="success" @click="$emit('refresh')">刷新</el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<style scoped>
.search-card {
  margin-bottom: 20px;
}
</style>
