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

    <el-card class="config-card usage-card">
      <template #header>
        <div class="card-header">
          <div>
            <span>AI 用量统计</span>
            <span class="sub-title">按 Asia/Singapore 日期统计已记录的 AI API token 与联网搜索次数</span>
          </div>
          <el-button :loading="usageLoading" @click="loadUsage">
            刷新
          </el-button>
        </div>
      </template>

      <el-row :gutter="16" class="usage-grid">
        <el-col :xs="24" :sm="12" :lg="8">
          <div class="usage-metric">
            <span class="usage-label">今日 Token</span>
            <strong>{{ formatNumber(usage.todayTotalTokens) }}</strong>
            <small>
              输入 {{ formatNumber(usage.todayPromptTokens) }} / 输出 {{ formatNumber(usage.todayCompletionTokens) }}
            </small>
          </div>
        </el-col>
        <el-col :xs="24" :sm="12" :lg="8">
          <div class="usage-metric">
            <span class="usage-label">今日调用</span>
            <strong>{{ formatNumber(usage.todayCalls) }}</strong>
            <small>成功调用次数</small>
          </div>
        </el-col>
        <el-col :xs="24" :sm="12" :lg="8">
          <div class="usage-metric">
            <span class="usage-label">今日联网搜索</span>
            <strong>{{ formatNumber(usage.todayWebSearchRequests) }}</strong>
            <small>OpenRouter web_search_requests</small>
          </div>
        </el-col>
        <el-col :xs="24" :sm="12" :lg="8">
          <div class="usage-metric">
            <span class="usage-label">本月 Token</span>
            <strong>{{ formatNumber(usage.monthTotalTokens) }}</strong>
            <small>
              输入 {{ formatNumber(usage.monthPromptTokens) }} / 输出 {{ formatNumber(usage.monthCompletionTokens) }}
            </small>
          </div>
        </el-col>
        <el-col :xs="24" :sm="12" :lg="8">
          <div class="usage-metric">
            <span class="usage-label">本月调用</span>
            <strong>{{ formatNumber(usage.monthCalls) }}</strong>
            <small>成功调用次数</small>
          </div>
        </el-col>
        <el-col :xs="24" :sm="12" :lg="8">
          <div class="usage-metric">
            <span class="usage-label">本月联网搜索</span>
            <strong>{{ formatNumber(usage.monthWebSearchRequests) }}</strong>
            <small>OpenRouter web_search_requests</small>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <el-card class="config-card auxiliary-prompt-card">
      <template #header>
        <div class="card-header">
          <div>
            <span>观点与提醒 Prompt</span>
            <span class="sub-title">统一管理新闻观点评论及主 Prompt 附加内容使用的固定 Prompt</span>
          </div>
        </div>
      </template>

      <el-table :data="auxiliaryPrompts" v-loading="promptsLoading" row-key="id">
        <el-table-column prop="name" label="名称" min-width="130" />
        <el-table-column prop="promptKey" label="Key" min-width="170" />
        <el-table-column prop="description" label="使用说明" min-width="300" show-overflow-tooltip />
        <el-table-column prop="inputVariable" label="变量" width="100">
          <template #default="scope">
            <code>{{ formatVariable(scope.row.inputVariable) }}</code>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="190" fixed="right">
          <template #default="scope">
            <el-button size="small" type="primary" plain @click="openPromptDialog(scope.row)">
              编辑
            </el-button>
            <el-button size="small" plain @click="resetPrompt(scope.row)">
              恢复默认
            </el-button>
          </template>
        </el-table-column>
      </el-table>
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

      <el-table :data="generationPrompts" v-loading="promptsLoading" row-key="id">
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
      :title="promptDialogTitle"
      width="760px"
      destroy-on-close
    >
      <el-form
        ref="promptFormRef"
        :model="promptForm"
        :rules="promptRules"
        label-position="top"
      >
        <el-alert
          v-if="isAuxiliaryEditing"
          title="此 Prompt 固定用于附加内容，保存后下一次 AI 处理立即生效。"
          type="info"
          :closable="false"
          class="prompt-dialog-notice"
        />
        <el-form-item v-if="!isAuxiliaryEditing" label="名称" prop="name">
          <el-input v-model="promptForm.name" maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item v-if="!isAuxiliaryEditing" label="说明" prop="description">
          <el-input v-model="promptForm.description" maxlength="500" show-word-limit />
        </el-form-item>
        <el-form-item label="System Prompt" prop="systemPrompt">
          <el-input v-model="promptForm.systemPrompt" type="textarea" :rows="4" resize="vertical" />
        </el-form-item>
        <el-form-item :label="`Human Prompt，必须包含 {${promptForm.inputVariable}}`" prop="humanPrompt">
          <el-input v-model="promptForm.humanPrompt" type="textarea" :rows="12" resize="vertical" />
        </el-form-item>
        <el-form-item v-if="supportsPromptExtras" label="附加内容">
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
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { aiConfigApi, aiPromptApi, aiUsageApi } from '../../services/api.js'

const formRef = ref(null)
const loading = ref(false)
const saving = ref(false)
const form = reactive({
  openrouterApiKey: '',
  openrouterModel: '',
  configured: false
})
const usageLoading = ref(false)
const usage = reactive({
  todayPromptTokens: 0,
  todayCompletionTokens: 0,
  todayTotalTokens: 0,
  todayCalls: 0,
  todayWebSearchRequests: 0,
  monthPromptTokens: 0,
  monthCompletionTokens: 0,
  monthTotalTokens: 0,
  monthCalls: 0,
  monthWebSearchRequests: 0
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
const generationPrompts = computed(() => (
  prompts.value.filter((prompt) => prompt.pipelineType !== 'auxiliary')
))
const auxiliaryPrompts = computed(() => (
  prompts.value.filter((prompt) => prompt.pipelineType === 'auxiliary')
))
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
const isAuxiliaryEditing = computed(() => editingPrompt.value?.pipelineType === 'auxiliary')
const supportsPromptExtras = computed(() => (
  !['auxiliary', 'digest'].includes(editingPrompt.value?.pipelineType)
))
const promptDialogTitle = computed(() => {
  if (isAuxiliaryEditing.value) {
    return `编辑${editingPrompt.value?.name || ''} Prompt`
  }
  return editingPrompt.value?.id ? '编辑 Prompt' : '新增 Prompt'
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

const formatNumber = (value) => {
  return Number(value || 0).toLocaleString('en-US')
}

const loadUsage = async () => {
  usageLoading.value = true
  try {
    const res = await aiUsageApi.getSummary()
    if (res.code === 200) {
      Object.assign(usage, {
        todayPromptTokens: res.data?.todayPromptTokens || 0,
        todayCompletionTokens: res.data?.todayCompletionTokens || 0,
        todayTotalTokens: res.data?.todayTotalTokens || 0,
        todayCalls: res.data?.todayCalls || 0,
        todayWebSearchRequests: res.data?.todayWebSearchRequests || 0,
        monthPromptTokens: res.data?.monthPromptTokens || 0,
        monthCompletionTokens: res.data?.monthCompletionTokens || 0,
        monthTotalTokens: res.data?.monthTotalTokens || 0,
        monthCalls: res.data?.monthCalls || 0,
        monthWebSearchRequests: res.data?.monthWebSearchRequests || 0
      })
      return
    }
    ElMessage.error(res.message || '加载 AI 用量统计失败')
  } catch (error) {
    console.error('加载 AI 用量统计失败:', error)
    ElMessage.error('加载 AI 用量统计失败')
  } finally {
    usageLoading.value = false
  }
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
  const supportsExtras = !['auxiliary', 'digest'].includes(prompt?.pipelineType)
  promptForm.includeViewpoint = supportsExtras ? Boolean(prompt?.includeViewpoint) : false
  promptForm.includeSafety = supportsExtras ? Boolean(prompt?.includeSafety) : false
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
      includeViewpoint: supportsPromptExtras.value ? promptForm.includeViewpoint : false,
      includeSafety: supportsPromptExtras.value ? promptForm.includeSafety : false
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
  loadUsage()
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

.auxiliary-prompt-card {
  margin-top: 20px;
}

.usage-card {
  margin-top: 20px;
}

.prompt-dialog-notice {
  margin-bottom: 18px;
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

.usage-grid {
  row-gap: 16px;
}

.usage-metric {
  min-height: 116px;
  padding: 18px;
  border: 1px solid #e7eaf0;
  border-radius: 8px;
  background: #f8fafc;
  box-sizing: border-box;
}

.usage-label {
  display: block;
  margin-bottom: 10px;
  color: #606266;
  font-size: 13px;
}

.usage-metric strong {
  display: block;
  color: #1f2937;
  font-size: 28px;
  line-height: 1.25;
  font-weight: 700;
}

.usage-metric small {
  display: block;
  margin-top: 8px;
  color: #909399;
  font-size: 12px;
  line-height: 1.45;
}
</style>
