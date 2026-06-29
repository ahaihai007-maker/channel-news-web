<script setup>
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Delete, Plus } from '@element-plus/icons-vue'

const visible = defineModel('visible', { required: true })

const props = defineProps({
  template: { type: Object, default: null },
  defaultType: { type: String, default: 'postfix' },
  saving: { type: Boolean, default: false }
})

const emit = defineEmits(['save'])

const formRef = ref(null)
const form = reactive({
  id: null,
  name: '',
  templateType: 'postfix',
  content: '',
  isDefault: false,
  description: '',
  buttonsPerRow: 1,
  buttons: []
})

const rules = {
  name: [{ required: true, message: '请输入模板名称', trigger: 'blur' }],
  templateType: [{ required: true, message: '请选择模板类型', trigger: 'change' }],
  content: [{ required: true, message: '请输入模板内容', trigger: 'blur' }]
}

const isEditing = computed(() => Boolean(form.id))
const dialogTitle = computed(() => (isEditing.value ? '编辑消息模板' : '新建消息模板'))
const typeText = computed(() => (form.templateType === 'header' ? '头部模板' : '后缀模板'))

const normalizeTemplateButtons = (buttons) => {
  if (buttons && !Array.isArray(buttons)) {
    return {
      buttonsPerRow: Math.max(Number(buttons.buttonsPerRow) || 1, 1),
      buttons: Array.isArray(buttons.buttons) ? buttons.buttons : []
    }
  }

  return {
    buttonsPerRow: 1,
    buttons: Array.isArray(buttons) ? buttons : []
  }
}

const resetForm = () => {
  form.id = null
  form.name = ''
  form.templateType = props.defaultType || 'postfix'
  form.content = ''
  form.isDefault = false
  form.description = ''
  form.buttonsPerRow = 1
  form.buttons = []
}

const fillForm = (template) => {
  const normalizedButtons = normalizeTemplateButtons(template.buttons)
  form.id = template.id
  form.name = template.name || ''
  form.templateType = template.templateType || 'postfix'
  form.content = template.content || ''
  form.isDefault = Boolean(template.isDefault)
  form.description = template.description || ''
  form.buttonsPerRow = normalizedButtons.buttonsPerRow
  form.buttons = normalizedButtons.buttons.map((button) => ({
    text: button.text || '',
    url: button.url || ''
  }))
}

watch(
  () => visible.value,
  async (isVisible) => {
    if (!isVisible) return
    if (props.template) {
      fillForm(props.template)
    } else {
      resetForm()
    }
    await nextTick()
    formRef.value?.clearValidate?.()
  }
)

const addButton = () => {
  form.buttons.push({ text: '', url: '' })
}

const removeButton = (index) => {
  form.buttons.splice(index, 1)
}

const buildPayload = () => {
  const buttons = form.buttons
    .map((button) => ({ text: button.text.trim(), url: button.url.trim() }))
    .filter((button) => button.text || button.url)

  const hasInvalidButton = buttons.some((button) => !button.text || !button.url)
  if (hasInvalidButton) {
    throw new Error('按钮文字和按钮链接必须同时填写')
  }

  return {
    id: form.id,
    name: form.name.trim(),
    templateType: form.templateType,
    content: form.content.trim(),
    isDefault: Boolean(form.isDefault),
    description: form.description.trim() || null,
    buttons: buttons.length > 0
      ? {
          buttonsPerRow: Math.max(Number(form.buttonsPerRow) || 1, 1),
          buttons
        }
      : null
  }
}

const submit = async () => {
  let valid = false
  try {
    valid = await formRef.value?.validate?.()
  } catch {
    return
  }
  if (!valid) return

  try {
    emit('save', buildPayload())
  } catch (error) {
    ElMessage.warning(error.message)
  }
}
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="dialogTitle"
    width="760px"
    :close-on-click-modal="false"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
      <el-form-item label="模板名称" prop="name">
        <el-input v-model="form.name" maxlength="100" show-word-limit placeholder="例如：招商模板" />
      </el-form-item>

      <el-form-item label="模板类型" prop="templateType">
        <el-radio-group v-model="form.templateType">
          <el-radio label="postfix">后缀模板</el-radio>
          <el-radio label="header">头部模板</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="模板内容" prop="content">
        <el-input
          v-model="form.content"
          type="textarea"
          :rows="7"
          maxlength="4000"
          show-word-limit
          placeholder="输入发布时要拼接的模板内容"
        />
      </el-form-item>

      <el-form-item label="设为默认">
        <el-switch v-model="form.isDefault" active-text="是" inactive-text="否" />
        <span class="field-tip">每种模板类型只能有一个默认模板</span>
      </el-form-item>

      <el-form-item label="模板说明">
        <el-input v-model="form.description" maxlength="500" show-word-limit placeholder="可选，用于描述模板用途" />
      </el-form-item>

      <el-form-item label="Innie按钮">
        <div class="buttons-editor">
          <div class="buttons-toolbar">
            <span class="field-tip">发布到 Telegram 时附加 inline URL 按钮</span>
            <div class="buttons-per-row">
              <span>每行按钮数</span>
              <el-input-number v-model="form.buttonsPerRow" :min="1" :max="8" size="small" />
            </div>
          </div>

          <div v-for="(button, index) in form.buttons" :key="index" class="button-row">
            <el-input v-model="button.text" placeholder="按钮文字" size="small" class="button-text-input" />
            <el-input v-model="button.url" placeholder="https:// 或 t.me 链接" size="small" class="button-url-input" />
            <el-button type="danger" size="small" :icon="Delete" circle @click="removeButton(index)" />
          </div>

          <el-button type="primary" size="small" plain :icon="Plus" @click="addButton">添加按钮</el-button>
        </div>
      </el-form-item>

      <el-form-item label="预览">
        <div class="preview-box">
          <div class="preview-meta">{{ typeText }}</div>
          <pre v-if="form.content" class="preview-content">{{ form.content }}</pre>
          <div v-else class="preview-empty">模板内容为空</div>
          <div v-if="form.buttons.length > 0" class="preview-buttons">
            <el-tag v-for="(button, index) in form.buttons" :key="index" type="info" size="small">
              {{ button.text || '未命名按钮' }}
            </el-tag>
          </div>
        </div>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="submit">
        {{ isEditing ? '保存修改' : '创建模板' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.field-tip {
  margin-left: 10px;
  font-size: 12px;
  color: #909399;
}

.buttons-editor {
  width: 100%;
}

.buttons-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.buttons-per-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #606266;
}

.button-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.button-text-input {
  width: 180px;
}

.button-url-input {
  flex: 1;
}

.preview-box {
  width: 100%;
  background: #f5f7fa;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  padding: 14px;
}

.preview-meta {
  margin-bottom: 8px;
  font-size: 12px;
  color: #909399;
}

.preview-content {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.7;
  font-family: inherit;
  color: #303133;
}

.preview-empty {
  color: #909399;
}

.preview-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}
</style>
