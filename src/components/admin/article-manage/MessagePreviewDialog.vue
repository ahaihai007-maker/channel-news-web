<script setup>
import { computed } from 'vue'

const visible = defineModel('visible', { required: true })
const regionTag = defineModel('regionTag', { required: true })
const typeTag = defineModel('typeTag', { required: true })

const props = defineProps({
  loading: { type: Boolean, required: true },
  previewData: { type: Object, default: null },
  regionTags: { type: Array, required: true },
  typeTags: { type: Array, required: true }
})

defineEmits(['generate', 'close'])

const previewButtonRows = computed(() => {
  const buttons = props.previewData?.buttonRows || props.previewData?.buttons || []
  if (!buttons.length) return []
  if (Array.isArray(buttons[0])) return buttons
  return [buttons]
})
</script>

<template>
  <el-dialog
    v-model="visible"
    title="L1-L6 Telegram 消息预览"
    width="700px"
    :close-on-click-modal="false"
    class="preview-dialog"
  >
    <div v-loading="loading">
      <div class="preview-config">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="地区标签" class="preview-form-item">
              <el-select v-model="regionTag" placeholder="选择地区标签" clearable style="width: 100%" @change="$emit('generate')">
                <el-option
                  v-for="tag in regionTags"
                  :key="tag.code"
                  :label="tag.name"
                  :value="tag.code"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="类型标签" class="preview-form-item">
              <el-select v-model="typeTag" placeholder="选择类型标签" clearable style="width: 100%" @change="$emit('generate')">
                <el-option
                  v-for="tag in typeTags"
                  :key="tag.code"
                  :label="tag.name"
                  :value="tag.code"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <div v-if="previewData" class="preview-content">
        <div class="l1-section">
          <div class="section-label">L1 - 头部标识</div>
          <div class="section-content" v-html="previewData.l1Header"></div>
        </div>

        <div class="l2-section">
          <div class="section-label">L2 - 时间元数据</div>
          <div class="section-content">{{ previewData.l2Meta }}</div>
        </div>

        <div class="l3-section">
          <div class="section-label">L3 - 内容区</div>
          <div class="section-content">{{ previewData.l3Content }}</div>
        </div>

        <div class="l4-section">
          <div class="section-label">L4 - 品牌观点</div>
          <div class="section-content">{{ previewData.l4View }}</div>
        </div>

        <div class="l5-section">
          <div class="section-label">L5 - 分隔线</div>
          <div class="section-content">{{ previewData.l5Divider }}</div>
        </div>

        <div class="l6-section">
          <div class="section-label">L6 - 装修模版</div>
          <div class="section-content" v-html="previewData.l6Postfix"></div>
        </div>

        <div v-if="previewButtonRows.length > 0" class="inline-buttons-section">
          <div class="section-label">Inline 按钮</div>
          <div class="buttons-list">
            <div
              v-for="(row, rowIndex) in previewButtonRows"
              :key="rowIndex"
              class="buttons-row"
            >
              <a
                v-for="(btn, idx) in row"
                :key="idx"
                :href="btn.url"
                target="_blank"
                class="preview-inline-button"
              >{{ btn.text }}</a>
            </div>
          </div>
        </div>

        <el-divider />

        <div class="full-preview">
          <div class="section-label">完整消息预览</div>
          <div class="telegram-message-bubble">
            <div v-html="previewData.fullMessage"></div>
          </div>
        </div>
      </div>

      <el-empty v-else description="选择标签后生成预览" />
    </div>

    <template #footer>
      <el-button @click="$emit('close')">关闭</el-button>
      <el-button type="primary" :loading="loading" @click="$emit('generate')">
        <el-icon><Refresh /></el-icon> 刷新预览
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.preview-config {
  margin-bottom: 20px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 8px;
}

.preview-form-item {
  margin-bottom: 0;
}

.preview-dialog .section-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
  font-weight: bold;
}

.preview-dialog .section-content {
  padding: 12px;
  background: #f5f7fa;
  border-radius: 4px;
  margin-bottom: 16px;
  font-size: 14px;
  line-height: 1.6;
  color: #303133;
}

.preview-dialog .l1-section .section-content {
  background: #e6f7ff;
  border-left: 3px solid #409eff;
}

.preview-dialog .l4-section .section-content {
  background: #f6ffed;
  border-left: 3px solid #67c23a;
}

.preview-dialog .l6-section .section-content {
  background: #fff7e6;
  border-left: 3px solid #e6a23c;
}

.preview-dialog .full-preview .telegram-message-bubble {
  background: #ffffff;
  padding: 15px;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
}

.inline-buttons-section {
  margin-bottom: 16px;
}

.inline-buttons-section .section-content {
  padding: 12px;
  background: #f5f7fa;
  border-radius: 4px;
  margin-bottom: 0;
}

.buttons-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 4px;
}

.buttons-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.preview-inline-button {
  display: inline-block;
  padding: 6px 16px;
  background: #409eff;
  color: #fff;
  border-radius: 6px;
  text-decoration: none;
  font-size: 14px;
  transition: background 0.2s;
}

.preview-inline-button:hover {
  background: #337ecc;
}
</style>
