<script setup>
import { computed } from 'vue'

const visible = defineModel('visible', { required: true })
const useTemplate = defineModel('useTemplate', { required: true })
const selectedTemplateId = defineModel('selectedTemplateId', { required: true })
const useEmojiPrefix = defineModel('useEmojiPrefix', { required: true })
const selectedRegionTag = defineModel('selectedRegionTag', { required: true })
const selectedTypeTag = defineModel('selectedTypeTag', { required: true })
const selectedTargetChannels = defineModel('selectedTargetChannels', { required: true })

const props = defineProps({
  loading: { type: Boolean, required: true },
  templates: { type: Array, required: true },
  regionTags: { type: Array, required: true },
  typeTags: { type: Array, required: true },
  channelOptions: { type: Array, default: () => [] },
  publishing: { type: Boolean, required: true },
  previewLoading: { type: Boolean, required: true },
  previewMessage: { type: String, default: '' },
  previewButtons: { type: Array, default: () => [] }
})

defineEmits(['confirm', 'preview'])

const previewButtonRows = computed(() => {
  if (!props.previewButtons.length) return []
  if (Array.isArray(props.previewButtons[0])) return props.previewButtons
  return [props.previewButtons]
})
</script>

<template>
  <el-dialog
    v-model="visible"
    title="发布设置"
    width="640px"
    :close-on-click-modal="false"
  >
    <div v-loading="loading">
      <el-form label-width="100px">
        <el-form-item label="模板修饰">
          <el-radio-group v-model="useTemplate">
            <el-radio :label="false">不使用模板</el-radio>
            <el-radio :label="true">使用模板</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="模板">
          <el-select
            v-model="selectedTemplateId"
            placeholder="不选择则使用默认后缀模板"
            clearable
            :disabled="!useTemplate"
            style="width: 100%"
          >
            <el-option
              v-for="template in templates"
              :key="template.id"
              :label="template.name + ' / ' + (template.templateType === 'header' ? '头部' : '后缀') + (template.isDefault ? ' (默认)' : '')"
              :value="template.id"
            >
              <div class="template-option">
                <span>{{ template.name }}</span>
                <span>
                  <span class="type-tag">{{ template.templateType === 'header' ? '头部' : '后缀' }}</span>
                  <span v-if="template.isDefault" class="default-tag">默认</span>
                </span>
              </div>
            </el-option>
          </el-select>
          <div v-if="useTemplate && selectedTemplateId" class="template-preview">
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

        <el-form-item label="发布目标">
          <el-checkbox-group v-model="selectedTargetChannels" class="channel-checks">
            <el-checkbox
              v-for="channel in channelOptions"
              :key="channel.value"
              :label="channel.value"
            >
              {{ channel.label }}
            </el-checkbox>
          </el-checkbox-group>
          <div class="tag-hint">至少选择一个目标；默认选择全部已配置发布目标</div>
        </el-form-item>
      </el-form>

      <div class="message-preview">
        <div class="preview-header">
          <span>发布预览</span>
          <el-button size="small" :loading="previewLoading" @click="$emit('preview')">生成预览</el-button>
        </div>
        <pre v-if="previewMessage" class="message-content">{{ previewMessage }}</pre>
        <div v-if="previewButtonRows.length > 0" class="preview-buttons">
          <div
            v-for="(row, rowIndex) in previewButtonRows"
            :key="rowIndex"
            class="preview-button-row"
          >
            <a
              v-for="(btn, idx) in row"
              :key="idx"
              :href="btn.url"
              target="_blank"
              class="preview-button"
            >{{ btn.text }}</a>
          </div>
        </div>
        <el-empty v-else-if="!previewMessage" description="点击生成预览查看最终拼接内容" :image-size="60" />
      </div>
    </div>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button
        type="primary"
        :loading="publishing"
        :disabled="selectedTargetChannels.length === 0"
        @click="$emit('confirm')"
      >
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

.type-tag {
  background: #ecf5ff;
  color: #409eff;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  margin-right: 6px;
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

.channel-checks {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.message-preview {
  margin-top: 16px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  padding: 12px;
  background: #fafafa;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  font-weight: 600;
}

.message-content {
  margin: 0;
  padding: 12px;
  min-height: 160px;
  max-height: 320px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-word;
  background: #fff;
  border-radius: 4px;
  color: #303133;
  font-family: inherit;
  line-height: 1.6;
}

.preview-buttons {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.preview-button-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.preview-button {
  display: inline-block;
  padding: 6px 16px;
  background: #409eff;
  color: #fff;
  border-radius: 6px;
  text-decoration: none;
  font-size: 14px;
  transition: background 0.2s;
}

.preview-button:hover {
  background: #337ecc;
}
</style>
