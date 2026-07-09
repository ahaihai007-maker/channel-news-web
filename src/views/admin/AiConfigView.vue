<template>
  <div class="ai-config-page">
    <h2 class="page-title">AI 设置</h2>

    <el-card class="config-card">
      <template #header>
        <div class="card-header">
          <div>
            <span>OpenRouter 配置</span>
            <span class="sub-title">用于 AI 管线处理和广告识别</span>
          </div>
          <el-tag :type="form.configured ? 'success' : 'danger'">
            {{ form.configured ? '已配置' : '未配置' }}
          </el-tag>
        </div>
      </template>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="150px"
        class="config-form"
      >
        <el-form-item label="API Key" prop="openrouterApiKey">
          <el-input
            v-model="form.openrouterApiKey"
            type="password"
            show-password
            autocomplete="off"
            placeholder="sk-or-v1-..."
          />
        </el-form-item>

        <el-form-item label="模型 ID" prop="openrouterModel">
          <el-input
            v-model="form.openrouterModel"
            placeholder="例如 google/gemini-3-flash-preview"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="saving" @click="saveConfig">
            保存配置
          </el-button>
          <el-button :disabled="loading || saving" @click="loadConfig">
            重新加载
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="config-card prompt-card">
      <template #header>
        <div class="card-header">
          <div>
            <span>Prompt 管理</span>
            <span class="sub-title">内置生成 Prompt 可调整；新增 Prompt 固定执行“提取 > 自定 Prompt > 验证补长”</span>
          </div>
          <el-button type="primary" size="small" @click="openPromptDialog()">
            新增 Prompt
          </el-button>
        </div>
      </template>

      <el-table :data="prompts" v-loading="promptsLoading" row-key="id">
        <el-table-column prop="name" label="名称" min-width="130" />
        <el-table-column prop="promptKey" label="Key" min-width="150" />
        <el-table-column label="类型" width="90">
          <template #default="scope">
            <el-tag :type="scope.row.isBuiltin ? 'info' : 'success'">
              {{ scope.row.isBuiltin ? '内置' : '自定' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="inputVariable" label="变量" width="90">
          <template #default="scope">
            <code>{{ formatVariable(scope.row.inputVariable) }}</code>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="说明" min-width="220" show-overflow-tooltip />
        <el-table-column label="频道观点" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.includeViewpoint ? 'success' : 'info'">
              {{ scope.row.includeViewpoint ? '开启' : '关闭' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="温馨提醒" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.includeSafety ? 'success' : 'info'">
              {{ scope.row.includeSafety ? '开启' : '关闭' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="启用" width="90">
          <template #default="scope">
            <el-switch
              v-model="scope.row.isActive"
              :loading="statusUpdatingId === scope.row.id"
              @change="togglePromptStatus(scope.row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="170" fixed="right">
          <template #default="scope">
            <el-button size="small" type="primary" plain @click="openPromptDialog(scope.row)">
              编辑
            </el-button>
            <el-button
              v-if="scope.row.isBuiltin"
              size="small"
              plain
              @click="resetPrompt(scope.row)"
            >
              恢复默认
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog
      v-model="promptDialogVisible"
      :title="editingPrompt?.id ? '编辑 Prompt' : '新增 Prompt'"
      width="760px"
      destroy-on-close
    >
      <el-form
        ref="promptFormRef"
        :model="promptForm"
        :rules="promptRules"
        label-position="top"
      >
        <el-form-item label="名称" prop="name">
          <el-input v-model="promptForm.name" maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item label="说明" prop="description">
          <el-input v-model="promptForm.description" maxlength="500" show-word-limit />
        </el-form-item>
        <el-form-item label="System Prompt" prop="systemPrompt">
          <el-input v-model="promptForm.systemPrompt" type="textarea" :rows="4" resize="vertical" />
        </el-form-item>
        <el-form-item :label="`Human Prompt，必须包含 {${promptForm.inputVariable}}`" prop="humanPrompt">
          <el-input v-model="promptForm.humanPrompt" type="textarea" :rows="12" resize="vertical" />
        </el-form-item>
        <el-form-item label="附加内容">
          <el-checkbox v-model="promptForm.includeViewpoint">带有频道观点</el-checkbox>
          <el-checkbox v-model="promptForm.includeSafety">带有温馨提醒</el-checkbox>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="promptDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="promptSaving" @click="savePrompt">
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { aiConfigApi, aiPromptApi } from '../../services/api.js'

const formRef = ref(null)
const loading = ref(false)
const saving = ref(false)
const form = reactive({
  openrouterApiKey: '',
  openrouterModel: '',
  configured: false
})

const rules = {
  openrouterApiKey: [
    { required: true, message: '请输入 OpenRouter API Key', trigger: 'blur' }
  ],
  openrouterModel: [
    { required: true, message: '请输入模型 ID', trigger: 'blur' }
  ]
}

const prompts = ref([])
const promptsLoading = ref(false)
const promptDialogVisible = ref(false)
const promptSaving = ref(false)
const statusUpdatingId = ref(null)
const editingPrompt = ref(null)
const promptFormRef = ref(null)
const promptForm = reactive({
  name: '',
  description: '',
  systemPrompt: '',
  humanPrompt: '',
  inputVariable: 'facts',
  includeViewpoint: false,
  includeSafety: false
})

const validateHumanPrompt = (_rule, value, callback) => {
  const token = `{${promptForm.inputVariable}}`
  if (!value || !value.trim()) {
    callback(new Error('请输入 Human Prompt'))
    return
  }
  if (!value.includes(token)) {
    callback(new Error(`Human Prompt 必须包含 ${token}`))
    return
  }
  callback()
}

const promptRules = {
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  systemPrompt: [{ required: true, message: '请输入 System Prompt', trigger: 'blur' }],
  humanPrompt: [{ validator: validateHumanPrompt, trigger: 'blur' }]
}

const formatVariable = (inputVariable) => {
  return `{${inputVariable}}`
}

const loadConfig = async () => {
  loading.value = true
  try {
    const res = await aiConfigApi.get()
    if (res.code === 200) {
      form.openrouterApiKey = res.data.openrouterApiKey || ''
      form.openrouterModel = res.data.openrouterModel || ''
      form.configured = Boolean(res.data.configured)
      return
    }
    ElMessage.error(res.message || '加载 AI 配置失败')
  } catch (error) {
    console.error('加载 AI 配置失败:', error)
    ElMessage.error('加载 AI 配置失败')
  } finally {
    loading.value = false
  }
}

const loadPrompts = async () => {
  promptsLoading.value = true
  try {
    const res = await aiPromptApi.getList()
    if (res.code === 200) {
      prompts.value = res.data || []
      return
    }
    ElMessage.error(res.message || '加载 Prompt 失败')
  } catch (error) {
    console.error('加载 Prompt 失败:', error)
    ElMessage.error('加载 Prompt 失败')
  } finally {
    promptsLoading.value = false
  }
}

const saveConfig = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    saving.value = true
    try {
      const res = await aiConfigApi.update({
        openrouterApiKey: form.openrouterApiKey.trim(),
        openrouterModel: form.openrouterModel.trim()
      })
      if (res.code === 200) {
        form.configured = true
        ElMessage.success('AI 配置保存成功')
        return
      }
      ElMessage.error(res.message || '保存 AI 配置失败')
    } catch (error) {
      console.error('保存 AI 配置失败:', error)
      ElMessage.error('保存 AI 配置失败')
    } finally {
      saving.value = false
    }
  })
}

const openPromptDialog = (prompt = null) => {
  editingPrompt.value = prompt
  promptForm.name = prompt?.name || ''
  promptForm.description = prompt?.description || ''
  promptForm.systemPrompt = prompt?.systemPrompt || ''
  promptForm.humanPrompt = prompt?.humanPrompt || ''
  promptForm.inputVariable = prompt?.inputVariable || 'facts'
  promptForm.includeViewpoint = Boolean(prompt?.includeViewpoint)
  promptForm.includeSafety = Boolean(prompt?.includeSafety)
  promptDialogVisible.value = true
}

const savePrompt = async () => {
  if (!promptFormRef.value) return
  await promptFormRef.value.validate(async (valid) => {
    if (!valid) return
    promptSaving.value = true
    const payload = {
      name: promptForm.name.trim(),
      description: promptForm.description.trim(),
      systemPrompt: promptForm.systemPrompt.trim(),
      humanPrompt: promptForm.humanPrompt.trim(),
      includeViewpoint: promptForm.includeViewpoint,
      includeSafety: promptForm.includeSafety
    }
    try {
      const res = editingPrompt.value?.id
        ? await aiPromptApi.update(editingPrompt.value.id, payload)
        : await aiPromptApi.create(payload)
      if (res.code === 200) {
        ElMessage.success('Prompt 保存成功')
        promptDialogVisible.value = false
        await loadPrompts()
        return
      }
      ElMessage.error(res.message || 'Prompt 保存失败')
    } catch (error) {
      console.error('Prompt 保存失败:', error)
      ElMessage.error('Prompt 保存失败')
    } finally {
      promptSaving.value = false
    }
  })
}

const resetPrompt = async (prompt) => {
  try {
    await ElMessageBox.confirm(`确定恢复「${prompt.name}」的默认 Prompt 吗？`, '恢复默认', {
      confirmButtonText: '恢复',
      cancelButtonText: '取消',
      type: 'warning'
    })
    const res = await aiPromptApi.reset(prompt.id)
    if (res.code === 200) {
      ElMessage.success('已恢复默认')
      await loadPrompts()
      return
    }
    ElMessage.error(res.message || '恢复默认失败')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('恢复默认失败:', error)
      ElMessage.error('恢复默认失败')
    }
  }
}

const togglePromptStatus = async (prompt) => {
  statusUpdatingId.value = prompt.id
  try {
    const res = await aiPromptApi.updateStatus(prompt.id, prompt.isActive)
    if (res.code !== 200) {
      prompt.isActive = !prompt.isActive
      ElMessage.error(res.message || '状态更新失败')
    }
  } catch (error) {
    prompt.isActive = !prompt.isActive
    console.error('状态更新失败:', error)
    ElMessage.error('状态更新失败')
  } finally {
    statusUpdatingId.value = null
  }
}

onMounted(() => {
  loadConfig()
  loadPrompts()
})
</script>

<style scoped>
.ai-config-page {
  width: 100%;
}

.page-title {
  margin: 0 0 20px;
  color: #303133;
  font-size: 24px;
  font-weight: 600;
}

.config-card {
  max-width: 1080px;
}

.prompt-card {
  margin-top: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.sub-title {
  display: block;
  margin-top: 4px;
  color: #909399;
  font-size: 13px;
}

.config-form {
  max-width: 720px;
}
</style>
