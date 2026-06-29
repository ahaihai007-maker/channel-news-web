<script setup>
const props = defineProps({
  templates: { type: Array, required: true },
  loading: { type: Boolean, default: false },
  templateType: { type: String, required: true }
})

const emit = defineEmits(['create', 'edit', 'delete', 'setDefault'])

const typeLabel = props.templateType === 'header' ? '头部模板' : '后缀模板'

const buttonCount = (template) => {
  const buttons = template.buttons
  if (!buttons) return 0
  if (Array.isArray(buttons)) return buttons.length
  if (Array.isArray(buttons.buttons)) return buttons.buttons.length
  return 0
}

const formatDate = (value) => {
  if (!value) return '-'
  return new Date(value).toLocaleString('zh-CN')
}
</script>

<template>
  <div class="template-table-panel">
    <div class="template-table-toolbar">
      <div class="template-count">共 {{ templates.length }} 个{{ typeLabel }}</div>
      <el-button type="primary" size="small" @click="emit('create', templateType)">
        <el-icon><Plus /></el-icon>
        新建{{ typeLabel }}
      </el-button>
    </div>

    <el-table v-loading="loading" :data="templates" border stripe style="width: 100%">
      <el-table-column prop="name" label="模板名称" min-width="170" show-overflow-tooltip />
      <el-table-column prop="content" label="内容" min-width="360">
        <template #default="{ row }">
          <div class="template-content-preview">{{ row.content }}</div>
        </template>
      </el-table-column>
      <el-table-column prop="description" label="说明" min-width="180" show-overflow-tooltip>
        <template #default="{ row }">
          {{ row.description || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="按钮" width="90" align="center">
        <template #default="{ row }">
          <el-tag v-if="buttonCount(row) > 0" size="small" type="info">{{ buttonCount(row) }} 个</el-tag>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="默认" width="90" align="center">
        <template #default="{ row }">
          <el-tag v-if="row.isDefault" type="success" size="small">默认</el-tag>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="创建时间" width="180">
        <template #default="{ row }">
          {{ formatDate(row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="250" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="emit('edit', row)">编辑</el-button>
          <el-button
            link
            type="success"
            size="small"
            :disabled="Boolean(row.isDefault)"
            @click="emit('setDefault', row)"
          >
            设为默认
          </el-button>
          <el-button link type="danger" size="small" @click="emit('delete', row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-empty v-if="!loading && templates.length === 0" :description="`暂无${typeLabel}`" :image-size="80" />
  </div>
</template>

<style scoped>
.template-table-panel {
  width: 100%;
}

.template-table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.template-count {
  font-size: 13px;
  color: #606266;
}

.template-content-preview {
  max-height: 64px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  white-space: pre-wrap;
  line-height: 1.5;
}
</style>
