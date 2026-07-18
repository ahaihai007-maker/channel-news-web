<template>
  <div class="interaction-page">
    <div class="page-header">
      <div>
        <h2>互动 AI</h2>
        <p>管理 Telegram 群聊与频道文章讨论的独立 AI 线路</p>
      </div>
      <el-button type="primary" @click="openEditor()">新增线路</el-button>
    </div>

    <el-card class="route-card">
      <el-table v-loading="loading" :data="routes" row-key="id" empty-text="暂无互动 AI 线路">
        <el-table-column prop="name" label="线路" min-width="170">
          <template #default="scope">
            <div class="route-name">
              <strong>{{ scope.row.name }}</strong>
              <span>{{ scope.row.description || '未填写说明' }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="频道 / 讨论群" min-width="240">
          <template #default="scope">
            <div v-for="binding in scope.row.bindings" :key="binding.id" class="binding-summary">
              <span>{{ binding.channelId }}</span>
              <span class="binding-arrow">→</span>
              <span>{{ binding.discussionGroupId }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="modelId" label="互动模型" min-width="190" show-overflow-tooltip />
        <el-table-column label="人格" min-width="150">
          <template #default="scope">
            <div class="route-name">
              <strong>{{ personaToneLabel(scope.row.personaTone) }}</strong>
              <span>{{ scope.row.personaRole }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="联网搜索" width="100">
          <template #default="scope">
            <el-tag :type="webSearchModeType(scope.row.webSearchMode)">
              {{ webSearchModeLabel(scope.row.webSearchMode) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="触发" width="190">
          <template #default="scope">
            <div class="tag-row">
              <el-tag v-if="scope.row.triggerMention" size="small">@bot</el-tag>
              <el-tag v-if="scope.row.triggerCommand" size="small" type="success">/ask</el-tag>
              <el-tag v-if="scope.row.triggerReply" size="small" type="info">回复机器人</el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="文章上下文" width="110">
          <template #default="scope">
            <el-tag :type="scope.row.includeArticle ? 'success' : 'info'">
              {{ scope.row.includeArticle ? '启用' : '关闭' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="scope">
            <el-switch
              v-model="scope.row.enabled"
              :loading="statusUpdatingId === scope.row.id"
              @change="saveStatus(scope.row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="scope">
            <el-button size="small" type="primary" plain @click="openEditor(scope.row)">编辑</el-button>
            <el-button size="small" type="danger" plain @click="removeRoute(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog
      v-model="editorVisible"
      :title="editingId ? '编辑互动 AI 线路' : '新增互动 AI 线路'"
      width="min(960px, 94vw)"
      destroy-on-close
      top="4vh"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
        <el-tabs v-model="activeTab" class="config-tabs">
          <el-tab-pane label="基础与绑定" name="basic">
            <div class="form-grid two-columns">
              <el-form-item label="线路名称" prop="name">
                <el-input v-model="form.name" maxlength="100" show-word-limit />
              </el-form-item>
              <el-form-item label="启用线路">
                <el-switch v-model="form.enabled" />
              </el-form-item>
            </div>
            <el-form-item label="线路说明">
              <el-input v-model="form.description" maxlength="500" show-word-limit />
            </el-form-item>

            <div class="section-heading">
              <span>频道与讨论群绑定</span>
              <el-button size="small" @click="addBinding">新增绑定</el-button>
            </div>
            <div v-for="(binding, index) in form.bindings" :key="index" class="binding-row">
              <el-form-item
                label="频道"
                :prop="`bindings.${index}.channelId`"
                :rules="[{ required: true, message: '请输入频道', trigger: 'blur' }]"
              >
                <el-input v-model="binding.channelId" placeholder="@channel 或 -100..." />
              </el-form-item>
              <el-form-item
                label="讨论群"
                :prop="`bindings.${index}.discussionGroupId`"
                :rules="[{ required: true, message: '请输入讨论群', trigger: 'blur' }]"
              >
                <el-input v-model="binding.discussionGroupId" placeholder="@group 或 -100..." />
              </el-form-item>
              <el-form-item label="启用">
                <el-switch v-model="binding.enabled" />
              </el-form-item>
              <el-button
                class="remove-binding"
                :disabled="form.bindings.length === 1"
                type="danger"
                plain
                @click="form.bindings.splice(index, 1)"
              >删除</el-button>
            </div>

            <div class="section-heading">触发方式</div>
            <el-checkbox v-model="form.triggerMention">@bot</el-checkbox>
            <el-checkbox v-model="form.triggerCommand">/ask</el-checkbox>
            <el-checkbox v-model="form.triggerReply">回复机器人</el-checkbox>
          </el-tab-pane>

          <el-tab-pane label="人格与回复" name="persona">
            <el-alert
              title="核心政策由后端固定执行"
              type="info"
              :closable="false"
              description="默认按中立资讯场景处理犯罪、诈骗、灰产与猎奇新闻；不推断用户参与或意图；只有用户明确请求时才提供个人建议；普通上下文排除机器人历史回复；违规回答最多修复一次。"
              show-icon
              class="policy-alert"
            />
            <el-form-item label="角色定位" prop="personaRole">
              <el-input
                v-model="form.personaRole"
                maxlength="500"
                show-word-limit
                placeholder="例如：长期参与讨论的中立资讯评论者"
              />
            </el-form-item>
            <div class="form-grid two-columns">
              <el-form-item label="语气模式">
                <el-select v-model="form.personaTone" style="width: 100%">
                  <el-option label="自适应" value="adaptive" />
                  <el-option label="自然聊天" value="conversational" />
                  <el-option label="直接明确" value="direct" />
                  <el-option label="分析型" value="analytical" />
                </el-select>
              </el-form-item>
              <el-form-item label="详略模式">
                <el-select v-model="form.personaVerbosity" style="width: 100%">
                  <el-option label="简洁" value="concise" />
                  <el-option label="自适应" value="adaptive" />
                  <el-option label="详细" value="detailed" />
                </el-select>
              </el-form-item>
            </div>
            <div class="form-grid three-columns">
              <el-form-item label="温度感">
                <el-slider v-model="form.personaWarmth" :min="0" :max="5" show-stops />
              </el-form-item>
              <el-form-item label="幽默度">
                <el-slider v-model="form.personaHumor" :min="0" :max="5" show-stops />
              </el-form-item>
              <el-form-item label="尖锐度">
                <el-slider v-model="form.personaSharpness" :min="0" :max="5" show-stops />
              </el-form-item>
            </div>
            <div class="persona-switches">
              <el-checkbox v-model="form.personaConclusionFirst">结论优先</el-checkbox>
              <el-checkbox v-model="form.personaProactiveCommentary">主动补充点评</el-checkbox>
              <el-checkbox v-model="form.personaUseAnalogies">使用类比</el-checkbox>
              <el-checkbox v-model="form.personaUseRhetoricalQuestions">使用反问</el-checkbox>
              <el-checkbox v-model="form.personaUseSignatureClosing">允许自然收尾</el-checkbox>
            </div>
            <div class="field-help">允许自然收尾不代表允许重复固定句、平安提醒或个人教育。</div>
          </el-tab-pane>

          <el-tab-pane label="模型与图片" name="model">
            <div class="form-grid two-columns">
              <el-form-item label="互动模型" prop="modelId">
                <el-input v-model="form.modelId" placeholder="OpenRouter 模型 ID" />
              </el-form-item>
              <el-form-item label="视觉模型">
                <el-input v-model="form.visionModelId" placeholder="留空则使用互动模型" />
              </el-form-item>
            </div>
            <div class="form-grid three-columns">
              <el-form-item label="读取用户图片">
                <el-switch v-model="form.includeUserImages" />
              </el-form-item>
              <el-form-item label="文章图片上限">
                <el-input-number v-model="form.maxArticleImages" :min="0" :max="10" />
              </el-form-item>
            </div>
            <el-form-item label="读取频道文章图片">
              <el-switch v-model="form.includeArticleImages" />
            </el-form-item>
          </el-tab-pane>

          <el-tab-pane label="上下文" name="context">
            <div class="form-grid two-columns">
              <el-form-item label="引用频道原文">
                <el-switch v-model="form.includeArticle" />
              </el-form-item>
              <el-form-item label="读取最近评论">
                <el-switch v-model="form.recentCommentsEnabled" />
              </el-form-item>
              <el-form-item label="最近评论条数">
                <el-input-number
                  v-model="form.recentCommentsLimit"
                  :min="0"
                  :max="50"
                  :disabled="!form.recentCommentsEnabled"
                />
              </el-form-item>
              <el-form-item label="最大上下文 Token">
                <el-input-number v-model="form.contextTokenLimit" :min="1000" :max="128000" :step="1000" />
              </el-form-item>
            </div>
          </el-tab-pane>

          <el-tab-pane label="联网搜索" name="web-search">
            <el-form-item label="搜索模式" prop="webSearchMode">
              <el-radio-group v-model="form.webSearchMode">
                <el-radio-button value="off">关闭</el-radio-button>
                <el-radio-button value="auto">自动</el-radio-button>
                <el-radio-button value="required">必须</el-radio-button>
              </el-radio-group>
              <div class="field-help">
                自动模式仅在模型判断问题涉及最新资讯时搜索；必须模式要求实际搜索并返回至少一个来源。
              </div>
            </el-form-item>
            <el-form-item label="来源显示" prop="webSearchSourceDisplayMode">
              <el-radio-group
                v-model="form.webSearchSourceDisplayMode"
                :disabled="form.webSearchMode === 'off'"
              >
                <el-radio-button value="smart">智能</el-radio-button>
                <el-radio-button value="always">始终</el-radio-button>
                <el-radio-button value="never">从不</el-radio-button>
              </el-radio-group>
              <div class="field-help">
                智能模式仅在用户明确要求来源、链接、查证或证据时附加 URL；搜索结果仍会保存供后续追问。
              </div>
            </el-form-item>
            <div class="form-grid three-columns">
              <el-form-item label="单次结果上限">
                <el-input-number
                  v-model="form.webSearchMaxResults"
                  :min="1"
                  :max="10"
                  :disabled="form.webSearchMode === 'off'"
                />
              </el-form-item>
              <el-form-item label="累计结果上限" prop="webSearchMaxTotalResults">
                <el-input-number
                  v-model="form.webSearchMaxTotalResults"
                  :min="1"
                  :max="10"
                  :disabled="form.webSearchMode === 'off'"
                />
              </el-form-item>
              <el-form-item label="每条结果字符上限">
                <el-input-number
                  v-model="form.webSearchMaxCharacters"
                  :min="500"
                  :max="5000"
                  :step="100"
                  :disabled="form.webSearchMode === 'off'"
                />
              </el-form-item>
            </div>
            <el-form-item label="允许网域">
              <el-select
                v-model="form.webSearchAllowedDomains"
                multiple
                filterable
                allow-create
                default-first-option
                :multiple-limit="20"
                :disabled="form.webSearchMode === 'off'"
                placeholder="留空表示不限制；输入域名后按 Enter"
                style="width: 100%"
              />
              <div class="field-help">仅接受域名，例如 reuters.com；不接受协议、端口或路径。</div>
            </el-form-item>
            <el-form-item label="排除网域">
              <el-select
                v-model="form.webSearchExcludedDomains"
                multiple
                filterable
                allow-create
                default-first-option
                :multiple-limit="20"
                :disabled="form.webSearchMode === 'off'"
                placeholder="输入域名后按 Enter"
                style="width: 100%"
              />
            </el-form-item>
            <div class="field-help">搜索引擎固定为 Exa。每次 OpenRouter API 请求最多重试一次。</div>
          </el-tab-pane>

          <el-tab-pane label="高级指令" name="prompt">
            <el-form-item label="高级补充指令">
              <el-input v-model="form.systemPrompt" type="textarea" :rows="6" resize="vertical" />
              <div class="field-help">可补充业务背景与人格细节；优先级低于固定内容政策和本次请求模式，可留空。</div>
            </el-form-item>
            <el-form-item label="普通群聊 Prompt" prop="groupPromptTemplate">
              <el-input v-model="form.groupPromptTemplate" type="textarea" :rows="8" resize="vertical" />
              <div class="field-help">必须包含 {user_question}、{reply_context}、{recent_messages}</div>
            </el-form-item>
            <el-form-item label="文章讨论 Prompt" prop="articlePromptTemplate">
              <el-input v-model="form.articlePromptTemplate" type="textarea" :rows="10" resize="vertical" />
              <div class="field-help">必须包含 {article_title}、{article_content}、{user_question}、{reply_context}、{recent_messages}</div>
            </el-form-item>
          </el-tab-pane>

          <el-tab-pane label="限制与失败" name="limits">
            <div class="form-grid three-columns">
              <el-form-item label="用户冷却时间（秒）">
                <el-input-number v-model="form.userCooldownSeconds" :min="0" :max="86400" />
              </el-form-item>
              <el-form-item label="每用户每小时上限">
                <el-input-number v-model="form.userHourlyLimit" :min="1" :max="1000" />
              </el-form-item>
              <el-form-item label="每篇文章回复上限">
                <el-input-number v-model="form.postReplyLimit" :min="1" :max="10000" />
              </el-form-item>
              <el-form-item label="并发请求上限">
                <el-input-number v-model="form.maxConcurrentRequests" :min="1" :max="20" />
              </el-form-item>
              <el-form-item label="最大输出 Token">
                <el-input-number v-model="form.maxOutputTokens" :min="100" :max="16000" :step="100" />
              </el-form-item>
              <el-form-item label="最大回复字符">
                <el-input-number v-model="form.maxReplyChars" :min="100" :max="4096" :step="100" />
              </el-form-item>
            </div>
            <el-form-item label="失败行为">
              <el-radio-group v-model="form.failureMode">
                <el-radio-button value="notify">提示用户</el-radio-button>
                <el-radio-button value="silent">静默</el-radio-button>
              </el-radio-group>
            </el-form-item>
          </el-tab-pane>
        </el-tabs>
      </el-form>

      <template #footer>
        <el-button @click="editorVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveRoute">保存线路</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref, toRaw } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { interactionAiApi } from '../../services/api.js'

const defaultForm = () => ({
  name: '',
  description: '',
  enabled: false,
  modelId: '',
  visionModelId: '',
  systemPrompt: '',
  personaRole: '长期参与讨论的中立资讯评论者',
  personaTone: 'adaptive',
  personaWarmth: 2,
  personaHumor: 1,
  personaSharpness: 2,
  personaVerbosity: 'adaptive',
  personaConclusionFirst: true,
  personaProactiveCommentary: false,
  personaUseAnalogies: false,
  personaUseRhetoricalQuestions: false,
  personaUseSignatureClosing: false,
  groupPromptTemplate: '用户问题:\n{user_question}\n\n被回复内容:\n{reply_context}\n\n最近讨论:\n{recent_messages}',
  articlePromptTemplate: '频道文章标题:\n{article_title}\n\n频道文章正文:\n{article_content}\n\n用户问题:\n{user_question}\n\n被回复内容:\n{reply_context}\n\n最近评论:\n{recent_messages}',
  triggerMention: true,
  triggerCommand: true,
  triggerReply: true,
  includeArticle: true,
  includeArticleImages: true,
  includeUserImages: true,
  recentCommentsEnabled: false,
  recentCommentsLimit: 5,
  contextTokenLimit: 8000,
  maxOutputTokens: 800,
  maxReplyChars: 1500,
  maxUserImages: 1,
  maxArticleImages: 4,
  userCooldownSeconds: 60,
  userHourlyLimit: 10,
  postReplyLimit: 30,
  maxConcurrentRequests: 2,
  failureMode: 'notify',
  webSearchMode: 'off',
  webSearchSourceDisplayMode: 'smart',
  webSearchMaxResults: 3,
  webSearchMaxTotalResults: 3,
  webSearchMaxCharacters: 1500,
  webSearchAllowedDomains: [],
  webSearchExcludedDomains: [],
  bindings: [{ channelId: '', discussionGroupId: '', enabled: true }]
})

const routes = ref([])
const loading = ref(false)
const saving = ref(false)
const statusUpdatingId = ref(null)
const editorVisible = ref(false)
const editingId = ref(null)
const activeTab = ref('basic')
const formRef = ref(null)
const form = reactive(defaultForm())

const hasVariables = (value, variables) => variables.every((name) => value.includes(`{${name}}`))
const templateRule = (variables) => ({
  validator: (_rule, value, callback) => {
    if (!value || !hasVariables(value, variables)) callback(new Error('Prompt 缺少必要变量'))
    else callback()
  },
  trigger: 'blur'
})

const rules = {
  name: [{ required: true, message: '请输入线路名称', trigger: 'blur' }],
  modelId: [{ required: true, message: '请输入互动模型', trigger: 'blur' }],
  personaRole: [{ required: true, message: '请输入角色定位', trigger: 'blur' }],
  groupPromptTemplate: [templateRule(['user_question', 'reply_context', 'recent_messages'])],
  articlePromptTemplate: [templateRule(['article_title', 'article_content', 'user_question', 'reply_context', 'recent_messages'])],
  webSearchMode: [{ required: true, message: '请选择联网搜索模式', trigger: 'change' }],
  webSearchSourceDisplayMode: [{ required: true, message: '请选择来源显示模式', trigger: 'change' }],
  webSearchMaxTotalResults: [{
    validator: (_rule, value, callback) => {
      if (value < form.webSearchMaxResults) callback(new Error('累计结果上限不得小于单次结果上限'))
      else callback()
    },
    trigger: 'change'
  }]
}

const webSearchModeLabel = (mode) => ({
  off: '关闭',
  auto: '自动',
  required: '必须'
}[mode] || '关闭')

const personaToneLabel = (tone) => ({
  adaptive: '自适应',
  conversational: '自然聊天',
  direct: '直接明确',
  analytical: '分析型'
}[tone] || '自适应')

const webSearchModeType = (mode) => ({
  off: 'info',
  auto: 'success',
  required: 'warning'
}[mode] || 'info')

const requireSuccess = (response) => {
  if (response.code !== 200) throw new Error(response.message || '请求失败')
  return response
}

const clonePlain = (value) => structuredClone(toRaw(value))

const assignForm = (value) => {
  Object.keys(form).forEach((key) => delete form[key])
  Object.assign(form, defaultForm(), clonePlain(value))
}

const loadRoutes = async () => {
  loading.value = true
  try {
    const response = requireSuccess(await interactionAiApi.getList())
    routes.value = response.data || []
  } catch (error) {
    ElMessage.error(error.response?.data?.message || error.message || '互动 AI 线路加载失败')
  } finally {
    loading.value = false
  }
}

const openEditor = (route = null) => {
  editingId.value = route?.id || null
  assignForm(route ? route : defaultForm())
  activeTab.value = 'basic'
  editorVisible.value = true
}

const addBinding = () => {
  form.bindings.push({ channelId: '', discussionGroupId: '', enabled: true })
}

const saveRoute = async () => {
  try {
    await formRef.value.validate()
  } catch {
    return
  }
  saving.value = true
  try {
    const payload = clonePlain(form)
    if (editingId.value) requireSuccess(await interactionAiApi.update(editingId.value, payload))
    else requireSuccess(await interactionAiApi.create(payload))
    ElMessage.success('互动 AI 线路已保存')
    editorVisible.value = false
    await loadRoutes()
  } catch (error) {
    ElMessage.error(error.response?.data?.message || error.message || '互动 AI 线路保存失败')
  } finally {
    saving.value = false
  }
}

const saveStatus = async (route) => {
  statusUpdatingId.value = route.id
  try {
    requireSuccess(await interactionAiApi.update(route.id, route))
    ElMessage.success(route.enabled ? '线路已启用' : '线路已停用')
  } catch (error) {
    route.enabled = !route.enabled
    ElMessage.error(error.response?.data?.message || error.message || '线路状态更新失败')
  } finally {
    statusUpdatingId.value = null
  }
}

const removeRoute = async (route) => {
  try {
    await ElMessageBox.confirm(`确认删除线路「${route.name}」？`, '删除线路', { type: 'warning' })
    requireSuccess(await interactionAiApi.delete(route.id))
    ElMessage.success('互动 AI 线路已删除')
    await loadRoutes()
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      ElMessage.error(error.response?.data?.message || error.message || '互动 AI 线路删除失败')
    }
  }
}

onMounted(loadRoutes)
</script>

<style scoped>
.interaction-page {
  width: 100%;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  color: #1f2937;
  font-size: 24px;
  letter-spacing: 0;
}

.page-header p {
  margin: 6px 0 0;
  color: #6b7280;
  font-size: 14px;
}

.route-card {
  border-radius: 6px;
}

.route-name {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.route-name span {
  color: #6b7280;
  font-size: 12px;
}

.binding-summary {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 20px minmax(0, 1fr);
  align-items: center;
  gap: 4px;
  margin: 3px 0;
  font-size: 13px;
}

.binding-summary span:not(.binding-arrow) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.binding-arrow {
  color: #9ca3af;
  text-align: center;
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.config-tabs {
  min-height: 500px;
}

.form-grid {
  display: grid;
  gap: 16px;
}

.two-columns {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.three-columns {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 10px 0 14px;
  color: #374151;
  font-size: 14px;
  font-weight: 600;
}

.binding-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) 72px 68px;
  align-items: end;
  gap: 12px;
  padding: 14px;
  margin-bottom: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}

.binding-row :deep(.el-form-item) {
  margin-bottom: 0;
}

.remove-binding {
  margin-bottom: 1px;
}

.field-help {
  margin-top: 6px;
  color: #6b7280;
  font-size: 12px;
  line-height: 1.5;
}

.policy-alert {
  margin-bottom: 18px;
}

.persona-switches {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 18px;
}

@media (max-width: 760px) {
  .interaction-page {
    width: calc(100vw - 28px);
    max-width: calc(100vw - 28px);
    min-width: 0;
    overflow: hidden;
  }

  .page-header {
    align-items: stretch;
    flex-direction: column;
  }

  .two-columns,
  .three-columns,
  .binding-row {
    grid-template-columns: 1fr;
  }

  .route-card {
    width: 100%;
    max-width: 100%;
    overflow: hidden;
  }

  .route-card :deep(.el-table__header-wrapper),
  .route-card :deep(.el-table__body-wrapper) {
    overflow-x: auto;
  }
}
</style>
