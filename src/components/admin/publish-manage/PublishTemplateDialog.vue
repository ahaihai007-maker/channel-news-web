<script setup>
const visible = defineModel('visible', { required: true })
const selectedTemplateId = defineModel('selectedTemplateId', { required: true })
const useEmojiPrefix = defineModel('useEmojiPrefix', { required: true })
const selectedRegionTag = defineModel('selectedRegionTag', { required: true })
const selectedTypeTag = defineModel('selectedTypeTag', { required: true })

defineProps({
  loading: { type: Boolean, required: true },
  templates: { type: Array, required: true },
  regionTags: { type: Array, required: true },
  typeTags: { type: Array, required: true },
  publishing: { type: Boolean, required: true }
})

defineEmits(['confirm'])
</script>

<template>
  <el-dialog
    v-model="visible"
    title="选择发布模板"
    width="500px"
    :close-on-click-modal="false"
  >
    <div v-loading="loading">
      <el-form label-width="100px">
        <el-form-item label="后缀模板">
          <el-select v-model="selectedTemplateId" placeholder="选择模板（可选）" clearable style="width: 100%">
            <el-option
              v-for="template in templates.filter(t => t.templateType === 'postfix')"
              :key="template.id"
              :label="template.name + (template.isDefault ? ' (默认)' : '')"
              :value="template.id"
            >
              <div class="template-option">
                <span>{{ template.name }}</span>
                <span v-if="template.isDefault" class="default-tag">默认</span>
              </div>
            </el-option>
          </el-select>
          <div v-if="selectedTemplateId" class="template-preview">
            <el-divider content-position="left">预览</el-divider>
            <div class="preview-content">
              {{ templates.find(t => t.id === selectedTemplateId)?.content }}
            </div>
          </div>
        </el-form-item>

        <el-form-item label="Emoji前缀">
          <el-switch v-model="useEmojiPrefix" active-text="启用" inactive-text="禁用" />
          <div v-if="useEmojiPrefix" class="emoji-hint">
            将根据文章类型自动添加对应的emoji前缀
          </div>
        </el-form-item>

        <el-form-item label="地区标签">
          <el-select v-model="selectedRegionTag" placeholder="选择地区标签（可选）" clearable style="width: 100%">
            <el-option
              v-for="tag in regionTags"
              :key="tag.code"
              :label="tag.name"
              :value="tag.code"
            />
          </el-select>
          <div class="tag-hint">用于生成 L1 头部标识</div>
        </el-form-item>

        <el-form-item label="类型标签">
          <el-select v-model="selectedTypeTag" placeholder="选择类型标签（可选）" clearable style="width: 100%">
            <el-option
              v-for="tag in typeTags"
              :key="tag.code"
              :label="tag.name"
              :value="tag.code"
            />
          </el-select>
          <div class="tag-hint">用于生成 L1 头部标识和Emoji前缀</div>
        </el-form-item>
      </el-form>
    </div>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="publishing" @click="$emit('confirm')">
        {{ publishing ? '发布中...' : '确认发布' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.template-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.default-tag {
  background: #67C23A;
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.template-preview {
  margin-top: 15px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
}

.template-preview .preview-content {
  white-space: pre-wrap;
  line-height: 1.6;
  color: #606266;
  font-size: 14px;
}

.emoji-hint {
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
}

.tag-hint {
  margin-top: 6px;
  font-size: 12px;
  color: #909399;
}
</style>
