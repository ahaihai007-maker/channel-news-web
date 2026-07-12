<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { telegramConfigApi } from '../../services/api.js'

const formRef = ref(null)
const loading = ref(false)
const saving = ref(false)
const sessionLoading = ref(false)
const botStatusLoading = ref(false)
const interactionBotStatusLoading = ref(false)
const channelStatusLoading = ref(false)
const sendingCode = ref(false)
const verifyingSession = ref(false)
const resolvingPublishChannel = ref('')
const newPublishChannel = ref('')
const newMonitorChannel = ref('')
const originalBotToken = ref('')
const originalInteractionBotToken = ref('')
const sessionStatus = ref(null)
const botStatus = ref(null)
const interactionBotStatus = ref(null)
const publishChannelMeta = reactive({})
const channelStatusMap = reactive({})
const sessionForm = reactive({
  code: '',
  password: '',
  requiresPassword: false
})

const form = reactive({
  telegramBotToken: '',
  telegramInteractionBotToken: '',
  telegramChannels: [],
  telegramApiId: 0,
  telegramApiHash: '',
  telegramSessionName: 'article_review_bot_session',
  submissionBotPhone: '',
  submissionBotDownloadDir: '/tmp/submission_uploads',
  monitorEnabled: false,
  monitorChannels: [],
  monitorPollInterval: 60
})

const rules = {
  telegramInteractionBotToken: [
    {
      validator: (_rule, value, callback) => {
        const interactionToken = String(value || '').trim()
        const primaryToken = String(form.telegramBotToken || '').trim()
        if (!interactionToken || interactionToken !== primaryToken) {
          callback()
          return
        }
        callback(new Error('AI 群聊 BOT Token 必须与投稿/发布 BOT Token 不同'))
      },
      trigger: 'blur'
    }
  ],
  telegramApiId: [
    {
      validator: (_rule, value, callback) => {
        if (value === '' || value === null || value === undefined) {
          callback()
          return
        }
        if (Number.isInteger(Number(value)) && Number(value) >= 0) {
          callback()
          return
        }
        callback(new Error('API ID 必须为空或正整数'))
      },
      trigger: 'blur'
    }
  ],
  monitorPollInterval: [
    {
      validator: (_rule, value, callback) => {
        if (Number.isInteger(Number(value)) && Number(value) >= 10) {
          callback()
          return
        }
        callback(new Error('轮询间隔必须大于或等于 10 秒'))
      },
      trigger: 'blur'
    }
  ]
}

const monitorChannelRows = computed(() => (
  form.monitorChannels.map((channel, index) => ({ id: `${channel}-${index}`, channel }))
))

const publishChannelRows = computed(() => (
  form.telegramChannels.map((channel, index) => {
    const meta = publishChannelMeta[channel] || {}
    const status = channelStatusMap[channel] || null
    return {
      id: `${channel}-${index}`,
      channel,
      title: meta.title || '',
      channelId: meta.channelId || (channel.startsWith('-100') ? channel : ''),
      username: meta.username || (channel.startsWith('@') ? channel : ''),
      targetType: meta.targetType || '',
      status
    }
  })
))

const normalizeChannels = (channels) => {
  const seen = new Set()
  const normalized = []
  channels.forEach((item) => {
    const channel = normalizeTelegramTarget(item)
    if (!channel || seen.has(channel)) return
    seen.add(channel)
    normalized.push(channel)
  })
  return normalized
}

const normalizeTelegramTarget = (value) => {
  const target = String(value || '').trim()
  if (!target) return ''
  try {
    const url = new URL(target)
    if (!['t.me', 'telegram.me', 'www.t.me', 'www.telegram.me'].includes(url.hostname.toLowerCase())) {
      return target
    }
    let parts = url.pathname.split('/').filter(Boolean)
    if (parts[0] === 's') parts = parts.slice(1)
    if (parts.length === 0) return target
    if (parts[0] === 'c' && parts[1]) return `-100${parts[1]}`
    if (parts[0].startsWith('+')) return target
    return `@${parts[0].replace(/^@/, '')}`
  } catch (error) {
    return target
  }
}

const assignForm = (data) => {
  form.telegramBotToken = data.telegramBotToken || ''
  form.telegramInteractionBotToken = data.telegramInteractionBotToken || ''
  form.telegramChannels = normalizeChannels(data.telegramChannels || (data.telegramChannel ? [data.telegramChannel] : []))
  Object.keys(publishChannelMeta).forEach((key) => {
    delete publishChannelMeta[key]
  })
  const detailsByInput = {}
  const detailsById = {}
  ;(data.telegramChannelDetails || []).forEach((detail) => {
    if (detail.input) detailsByInput[detail.input] = detail
    if (detail.channelId) detailsById[detail.channelId] = detail
  })
  form.telegramChannels.forEach((channel) => {
    const detail = detailsByInput[channel] || detailsById[channel] || {}
    publishChannelMeta[channel] = {
      title: detail.title || '',
      channelId: detail.channelId || (channel.startsWith('-100') ? channel : ''),
      username: detail.username || (channel.startsWith('@') ? channel : ''),
      targetType: detail.targetType || ''
    }
  })
  form.telegramApiId = data.telegramApiId || 0
  form.telegramApiHash = data.telegramApiHash || ''
  form.telegramSessionName = data.telegramSessionName || 'article_review_bot_session'
  form.submissionBotPhone = data.submissionBotPhone || ''
  form.submissionBotDownloadDir = data.submissionBotDownloadDir || '/tmp/submission_uploads'
  form.monitorEnabled = Boolean(data.monitorEnabled)
  form.monitorChannels = normalizeChannels(data.monitorChannels || [])
  form.monitorPollInterval = data.monitorPollInterval || 60
  originalBotToken.value = form.telegramBotToken
  originalInteractionBotToken.value = form.telegramInteractionBotToken
}

const loadConfig = async () => {
  loading.value = true
  try {
    const res = await telegramConfigApi.get()
    if (res.code === 200) {
      assignForm(res.data || {})
      await loadAllChannelStatus()
      return
    }
    ElMessage.error(res.message || '加载 Telegram 配置失败')
  } catch (error) {
    console.error('加载 Telegram 配置失败:', error)
    ElMessage.error('加载 Telegram 配置失败')
  } finally {
    loading.value = false
  }
}

const loadSessionStatus = async () => {
  sessionLoading.value = true
  try {
    const res = await telegramConfigApi.getSessionStatus()
    if (res.code === 200) {
      sessionStatus.value = res.data || null
      return
    }
    ElMessage.error(res.message || '加载 Session 状态失败')
  } catch (error) {
    console.error('加载 Session 状态失败:', error)
    ElMessage.error('加载 Session 状态失败')
  } finally {
    sessionLoading.value = false
  }
}

const loadBotStatus = async () => {
  botStatusLoading.value = true
  try {
    const res = await telegramConfigApi.getBotStatus()
    if (res.code === 200) {
      botStatus.value = res.data || null
      return
    }
    ElMessage.error(res.message || '加载 BOT 状态失败')
  } catch (error) {
    console.error('加载 BOT 状态失败:', error)
    ElMessage.error('加载 BOT 状态失败')
  } finally {
    botStatusLoading.value = false
  }
}

const loadInteractionBotStatus = async () => {
  interactionBotStatusLoading.value = true
  try {
    const res = await telegramConfigApi.getInteractionBotStatus()
    if (res.code === 200) {
      interactionBotStatus.value = res.data || null
      return
    }
    ElMessage.error(res.message || '加载 AI 群聊 BOT 状态失败')
  } catch (error) {
    console.error('加载 AI 群聊 BOT 状态失败:', error)
    ElMessage.error('加载 AI 群聊 BOT 状态失败')
  } finally {
    interactionBotStatusLoading.value = false
  }
}

const getStatusTarget = (channel) => (
  publishChannelMeta[channel]?.channelId || channel
)

const loadChannelStatus = async (channel) => {
  const target = getStatusTarget(channel)
  if (!target) return
  channelStatusLoading.value = true
  try {
    const res = await telegramConfigApi.getChannelStatus({ channel: target })
    if (res.code === 200) {
      channelStatusMap[channel] = res.data || null
      return
    }
    ElMessage.error(res.message || '加载频道权限失败')
  } catch (error) {
    console.error('加载频道权限失败:', error)
    ElMessage.error(error.response?.data?.detail || '加载频道权限失败')
  } finally {
    channelStatusLoading.value = false
  }
}

const loadAllChannelStatus = async () => {
  for (const channel of form.telegramChannels) {
    await loadChannelStatus(channel)
  }
}

const refreshRuntimeStatus = async () => {
  await Promise.all([
    loadSessionStatus(),
    loadBotStatus(),
    loadInteractionBotStatus()
  ])
  await loadAllChannelStatus()
}

const actorStatusType = (actor) => {
  if (!actor?.configured || !actor?.accessible) return 'danger'
  if (actor.canPostMessages) return 'success'
  return 'warning'
}

const actorStatusText = (actor) => {
  if (!actor?.configured) return '未配置'
  if (!actor?.accessible) return '不可访问'
  if (actor.canPostMessages) return '可发帖'
  return '无发帖权限'
}

const addMonitorChannel = () => {
  const channel = newMonitorChannel.value.trim()
  if (!channel) return
  if (form.monitorChannels.includes(channel)) {
    ElMessage.warning('监控频道已存在')
    return
  }
  form.monitorChannels.push(channel)
  newMonitorChannel.value = ''
}

const addPublishChannel = async () => {
  const channel = normalizeTelegramTarget(newPublishChannel.value)
  if (!channel) return
  if (form.telegramChannels.includes(channel)) {
    ElMessage.warning('发布目标已存在')
    return
  }
  form.telegramChannels.push(channel)
  publishChannelMeta[channel] = {
    title: '',
    channelId: channel.startsWith('-') ? channel : '',
    username: channel.startsWith('@') ? channel : '',
    targetType: ''
  }
  newPublishChannel.value = ''
  const saved = await saveConfig()
  if (!saved) {
    form.telegramChannels = form.telegramChannels.filter((item) => item !== channel)
    delete publishChannelMeta[channel]
  }
}

const removePublishChannel = async (channel) => {
  const previousChannels = [...form.telegramChannels]
  const previousMeta = { ...publishChannelMeta }
  const previousStatus = { ...channelStatusMap }
  form.telegramChannels = form.telegramChannels.filter((item) => item !== channel)
  delete publishChannelMeta[channel]
  delete channelStatusMap[channel]
  const saved = await saveConfig()
  if (!saved) {
    form.telegramChannels = previousChannels
    Object.keys(publishChannelMeta).forEach((key) => {
      delete publishChannelMeta[key]
    })
    Object.assign(publishChannelMeta, previousMeta)
    Object.keys(channelStatusMap).forEach((key) => {
      delete channelStatusMap[key]
    })
    Object.assign(channelStatusMap, previousStatus)
  }
}

const resolvePublishChannel = async (channel) => {
  resolvingPublishChannel.value = channel
  try {
    const res = await telegramConfigApi.resolveChannel({ channel })
    if (res.code !== 200) {
      ElMessage.error(res.message || '频道解析失败')
      return
    }
    const channelId = res.data?.channelId
    if (!channelId) {
      ElMessage.error('未取得频道 ID')
      return
    }
    if (channelId !== channel && form.telegramChannels.includes(channelId)) {
      ElMessage.warning('频道 ID 已存在')
      return
    }
    publishChannelMeta[channel] = {
      title: res.data?.title || '',
      channelId,
      username: res.data?.username || '',
      targetType: res.data?.targetType || ''
    }
    const saved = await saveConfig()
    if (!saved) return
    await loadChannelStatus(channel)
    ElMessage.success(`已解析为 ${channelId}`)
  } catch (error) {
    console.error('频道解析失败:', error)
    ElMessage.error(error.response?.data?.detail || '频道解析失败')
  } finally {
    resolvingPublishChannel.value = ''
  }
}

const removeMonitorChannel = (channel) => {
  form.monitorChannels = form.monitorChannels.filter((item) => item !== channel)
}

const buildPayload = () => ({
  telegramBotToken: form.telegramBotToken.trim(),
  telegramInteractionBotToken: form.telegramInteractionBotToken.trim(),
  telegramChannel: normalizeChannels(form.telegramChannels.map((channel) => (
    publishChannelMeta[channel]?.channelId || channel
  ))).join(','),
  telegramChannels: normalizeChannels(form.telegramChannels.map((channel) => (
    publishChannelMeta[channel]?.channelId || channel
  ))),
  telegramApiId: Number(form.telegramApiId || 0),
  telegramApiHash: form.telegramApiHash.trim(),
  telegramSessionName: form.telegramSessionName.trim(),
  submissionBotPhone: form.submissionBotPhone.trim(),
  submissionBotDownloadDir: form.submissionBotDownloadDir.trim(),
  monitorEnabled: form.monitorEnabled,
  monitorChannels: normalizeChannels(form.monitorChannels),
  monitorPollInterval: Number(form.monitorPollInterval)
})

const saveConfig = async () => {
  let valid = false
  try {
    valid = await formRef.value?.validate()
  } catch (error) {
    valid = false
  }
  if (!valid) return false

  saving.value = true
  const payload = buildPayload()
  const botTokenChanged = payload.telegramBotToken !== originalBotToken.value
  const interactionBotTokenChanged = (
    payload.telegramInteractionBotToken !== originalInteractionBotToken.value
  )

  try {
    const res = await telegramConfigApi.update(payload)
    if (res.code !== 200) {
      ElMessage.error(res.message || '保存 Telegram 配置失败')
      return false
    }

    await loadConfig()
    await Promise.all([
      loadSessionStatus(),
      loadBotStatus(),
      loadInteractionBotStatus()
    ])
    ElMessage.success('配置已保存，运行中组件将自动重新加载')

    const warnings = res.data?.warnings || []
    if (warnings.length > 0 || botTokenChanged || interactionBotTokenChanged) {
      ElNotification({
        title: '配置状态',
        message: [
          botTokenChanged ? '投稿 bot 正在进程内重建，短时间内可能暂停接收消息。' : '',
          interactionBotTokenChanged ? 'AI 群聊 bot 正在独立进程内重建。' : '',
          ...warnings
        ].filter(Boolean).join('\n'),
        type: warnings.length > 0 ? 'warning' : 'success',
        duration: 6000
      })
    }
    return true
  } catch (error) {
    console.error('保存 Telegram 配置失败:', error)
    ElMessage.error('保存 Telegram 配置失败')
    return false
  } finally {
    saving.value = false
  }
}

const saveConfigForSession = async () => {
  const saved = await saveConfig()
  if (!saved) return false
  await loadSessionStatus()
  return true
}

const sendSessionCode = async () => {
  sendingCode.value = true
  try {
    const saved = await saveConfigForSession()
    if (!saved) return
    const res = await telegramConfigApi.sendSessionCode()
    if (res.code === 200) {
      sessionForm.code = ''
      sessionForm.password = ''
      sessionForm.requiresPassword = false
      ElMessage.success(`验证码已发送至 ${res.data?.phone || '配置手机号'}`)
      return
    }
    ElMessage.error(res.message || '发送验证码失败')
  } catch (error) {
    console.error('发送验证码失败:', error)
    ElMessage.error(error.response?.data?.detail || '发送验证码失败')
  } finally {
    sendingCode.value = false
  }
}

const verifySession = async () => {
  const code = sessionForm.code.trim()
  const password = sessionForm.password.trim()
  if (!code && !sessionForm.requiresPassword) {
    ElMessage.warning('请输入验证码')
    return
  }
  if (sessionForm.requiresPassword && !password) {
    ElMessage.warning('请输入二步验证密码')
    return
  }

  verifyingSession.value = true
  try {
    const res = await telegramConfigApi.verifySession({
      code,
      password: password || null
    })
    if (res.code !== 200) {
      ElMessage.error(res.message || 'Session 验证失败')
      return
    }

    if (res.data?.requiresPassword) {
      sessionForm.requiresPassword = true
      ElMessage.warning('该账号启用了二步验证，请输入密码后再次确认')
      return
    }

    sessionForm.code = ''
    sessionForm.password = ''
    sessionForm.requiresPassword = false
    ElMessage.success('Session 已获取并保存')
    await loadSessionStatus()
  } catch (error) {
    console.error('Session 验证失败:', error)
    ElMessage.error(error.response?.data?.detail || 'Session 验证失败')
  } finally {
    verifyingSession.value = false
  }
}

onMounted(() => {
  loadConfig()
  loadSessionStatus()
  loadBotStatus()
  loadInteractionBotStatus()
})
</script>

<template>
  <div class="telegram-config-page">
    <div class="page-header">
      <div>
        <h2 class="page-title">Telegram 系统配置</h2>
        <p class="page-desc">管理投稿/发布 BOT、独立 AI 群聊 BOT、发布目标与频道监控参数。</p>
      </div>
      <el-button type="primary" :loading="saving" @click="saveConfig">保存配置</el-button>
    </div>

    <el-form
      ref="formRef"
      v-loading="loading"
      :model="form"
      :rules="rules"
      label-width="150px"
      class="config-form"
    >
      <el-card class="config-card">
        <template #header>
          <div class="card-header">
            <span>投稿/发布 BOT 配置</span>
            <el-button
              :loading="botStatusLoading || sessionLoading || channelStatusLoading"
              @click="refreshRuntimeStatus"
            >
              刷新权限状态
            </el-button>
          </div>
        </template>

        <el-form-item label="投稿/发布 Token">
          <el-input
            v-model="form.telegramBotToken"
            type="textarea"
            :rows="2"
            placeholder="输入 Telegram BOT token"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="API ID" prop="telegramApiId">
          <el-input v-model="form.telegramApiId" inputmode="numeric" placeholder="输入 Telegram API ID" />
        </el-form-item>
        <el-form-item label="API Hash">
          <el-input v-model="form.telegramApiHash" placeholder="输入 Telegram API hash" />
        </el-form-item>
        <el-form-item label="Session 文件">
          <el-input v-model="form.telegramSessionName" placeholder="article_review_bot_session" />
        </el-form-item>
        <el-form-item label="投稿手机号">
          <el-input v-model="form.submissionBotPhone" placeholder="例如 +8613800000000" />
        </el-form-item>
        <el-form-item label="下载目录">
          <el-input
            v-model="form.submissionBotDownloadDir"
            readonly
            placeholder="/tmp/submission_uploads"
          />
        </el-form-item>

        <el-descriptions :column="1" border class="runtime-status">
          <el-descriptions-item label="BOT Token 状态">
            <el-tag :type="botStatus?.reachable ? 'success' : 'danger'">
              {{ botStatus?.reachable ? '有效' : '不可用' }}
            </el-tag>
            <span v-if="botStatus?.error" class="status-error">{{ botStatus.error }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="BOT 账号">
            <span v-if="botStatus?.reachable">
              @{{ botStatus.username || '-' }} / ID {{ botStatus.id || '-' }}
            </span>
            <span v-else>-</span>
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <el-card class="config-card">
        <template #header>
          <div class="card-header">
            <span>AI 群聊 BOT 配置</span>
            <el-button
              :loading="interactionBotStatusLoading"
              @click="loadInteractionBotStatus"
            >
              刷新状态
            </el-button>
          </div>
        </template>

        <el-form-item label="AI 群聊 Token" prop="telegramInteractionBotToken">
          <el-input
            v-model="form.telegramInteractionBotToken"
            type="textarea"
            :rows="2"
            placeholder="输入独立的 AI 群聊 Telegram BOT token"
            show-word-limit
          />
        </el-form-item>
        <el-alert
          title="此 Token 必须与投稿/发布 BOT Token 不同；AI BOT 只处理已绑定群组中的互动消息。"
          type="info"
          :closable="false"
          show-icon
        />

        <el-descriptions :column="1" border class="runtime-status">
          <el-descriptions-item label="AI BOT Token 状态">
            <el-tag :type="interactionBotStatus?.reachable ? 'success' : 'danger'">
              {{ interactionBotStatus?.reachable ? '有效' : '不可用' }}
            </el-tag>
            <span v-if="interactionBotStatus?.error" class="status-error">
              {{ interactionBotStatus.error }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="AI BOT 账号">
            <span v-if="interactionBotStatus?.reachable">
              @{{ interactionBotStatus.username || '-' }} / ID {{ interactionBotStatus.id || '-' }}
            </span>
            <span v-else>-</span>
          </el-descriptions-item>
          <el-descriptions-item label="读取群组消息">
            <el-tag
              :type="interactionBotStatus?.canReadAllGroupMessages ? 'success' : 'warning'"
            >
              {{ interactionBotStatus?.canReadAllGroupMessages ? '已启用' : '受 Privacy Mode 限制' }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <el-card class="config-card">
        <template #header>
          <div class="card-header">
            <span>Session 获取</span>
            <el-button :loading="sessionLoading" @click="loadSessionStatus">刷新状态</el-button>
          </div>
        </template>

        <el-descriptions :column="1" border class="session-status">
          <el-descriptions-item label="Session 文件">
            {{ sessionStatus?.sessionFile || 'submission_bot_session.txt' }}
          </el-descriptions-item>
          <el-descriptions-item label="文件状态">
            <el-tag :type="sessionStatus?.exists ? 'success' : 'warning'">
              {{ sessionStatus?.exists ? '已生成' : '未生成' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="授权状态">
            <el-tag :type="sessionStatus?.authorized && !sessionStatus?.isBot ? 'success' : 'danger'">
              {{ sessionStatus?.authorized && !sessionStatus?.isBot ? '用户账号已授权' : '未授权或不可用' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="登录账号">
            <span v-if="sessionStatus?.authorized">
              {{ sessionStatus.displayName || '-' }}
              <span v-if="sessionStatus.username">(@{{ sessionStatus.username }})</span>
            </span>
            <span v-else>-</span>
          </el-descriptions-item>
        </el-descriptions>

        <div class="session-actions">
          <el-button type="primary" :loading="sendingCode" @click="sendSessionCode">
            发送验证码
          </el-button>
          <el-input
            v-model="sessionForm.code"
            class="session-input"
            placeholder="输入 Telegram 验证码"
          />
          <el-input
            v-if="sessionForm.requiresPassword"
            v-model="sessionForm.password"
            class="session-input"
            type="password"
            show-password
            placeholder="输入二步验证密码"
          />
          <el-button type="success" :loading="verifyingSession" @click="verifySession">
            验证并保存 Session
          </el-button>
        </div>
      </el-card>

      <el-card class="config-card">
        <template #header>
          <span>发布目标配置</span>
        </template>

        <el-form-item label="新增发布目标">
          <div class="channel-input">
            <el-input
              v-model="newPublishChannel"
              placeholder="支持 @channel、@group、-100...、普通群组 ID"
              @keyup.enter="addPublishChannel"
            />
            <el-button type="primary" @click="addPublishChannel">
              <el-icon><Plus /></el-icon>
              添加
            </el-button>
          </div>
        </el-form-item>

        <el-table v-if="publishChannelRows.length > 0" :data="publishChannelRows" border>
          <el-table-column prop="title" label="目标名称" min-width="160">
            <template #default="{ row }">
              {{ row.title || '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="channelId" label="Chat ID" min-width="170">
            <template #default="{ row }">
              {{ row.channelId || '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="targetType" label="类型" width="110">
            <template #default="{ row }">
              {{ row.targetType || row.status?.targetType || '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="username" label="Username" min-width="150">
            <template #default="{ row }">
              {{ row.username || '-' }}
            </template>
          </el-table-column>
          <el-table-column label="BOT 权限" width="130">
            <template #default="{ row }">
              <el-tooltip
                v-if="row.status?.bot?.error"
                :content="row.status.bot.error"
                placement="top"
              >
                <el-tag :type="actorStatusType(row.status.bot)">
                  {{ actorStatusText(row.status.bot) }}
                </el-tag>
              </el-tooltip>
              <el-tag v-else :type="actorStatusType(row.status?.bot)">
                {{ actorStatusText(row.status?.bot) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="用户号权限" width="130">
            <template #default="{ row }">
              <el-tooltip
                v-if="row.status?.userSession?.error"
                :content="row.status.userSession.error"
                placement="top"
              >
                <el-tag :type="actorStatusType(row.status.userSession)">
                  {{ actorStatusText(row.status.userSession) }}
                </el-tag>
              </el-tooltip>
              <el-tag v-else :type="actorStatusType(row.status?.userSession)">
                {{ actorStatusText(row.status?.userSession) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="channel" label="原始输入" min-width="180" />
          <el-table-column label="操作" width="260" fixed="right">
            <template #default="{ row }">
              <el-button
                link
                type="primary"
                :loading="resolvingPublishChannel === row.channel"
                @click="resolvePublishChannel(row.channel)"
              >
                解析ID
              </el-button>
              <el-button
                link
                type="primary"
                :loading="channelStatusLoading"
                @click="loadChannelStatus(row.channel)"
              >
                检查权限
              </el-button>
              <el-button link type="danger" @click="removePublishChannel(row.channel)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-else description="暂未配置发布目标" :image-size="60" />
      </el-card>

      <el-card class="config-card">
        <template #header>
          <div class="card-header">
            <span>频道监控</span>
            <el-switch v-model="form.monitorEnabled" active-text="启用" inactive-text="停用" />
          </div>
        </template>

        <el-form-item label="轮询间隔" prop="monitorPollInterval">
          <el-input-number v-model="form.monitorPollInterval" :min="10" :precision="0" />
          <span class="input-suffix">秒</span>
        </el-form-item>

        <el-form-item label="新增监控频道">
          <div class="channel-input">
            <el-input
              v-model="newMonitorChannel"
              placeholder="输入频道 username 或链接"
              @keyup.enter="addMonitorChannel"
            />
            <el-button type="primary" @click="addMonitorChannel">
              <el-icon><Plus /></el-icon>
              添加
            </el-button>
          </div>
        </el-form-item>

        <el-table v-if="monitorChannelRows.length > 0" :data="monitorChannelRows" border>
          <el-table-column prop="channel" label="监控频道" />
          <el-table-column label="操作" width="100">
            <template #default="{ row }">
              <el-button link type="danger" @click="removeMonitorChannel(row.channel)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-else description="暂未配置监控频道" :image-size="60" />
      </el-card>
    </el-form>
  </div>
</template>

<style scoped>
.telegram-config-page {
  padding: 20px;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.page-title {
  margin: 0;
  font-size: 24px;
  color: #303133;
}

.page-desc {
  margin: 8px 0 0;
  color: #606266;
  font-size: 13px;
}

.config-form {
  width: 100%;
}

.config-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.channel-input {
  display: flex;
  width: 100%;
  gap: 10px;
}

.session-status {
  margin-bottom: 16px;
}

.runtime-status {
  margin-top: 8px;
}

.status-error {
  margin-left: 10px;
  color: #f56c6c;
  font-size: 12px;
}

.session-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.session-input {
  width: 220px;
}

.input-suffix {
  margin-left: 10px;
  color: #606266;
}
</style>
