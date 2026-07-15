<template>
  <div class="bilibili-config-page">
    <div class="page-head">
      <div>
        <h2 class="page-title">Bilibili 采集配置</h2>
        <p class="page-subtitle">配置 Bilibili API 使用的浏览器 User-Agent；Cookie 仅用于投稿列表后备查询。</p>
      </div>
      <el-tag :type="form.configured ? 'success' : 'danger'">
        {{ form.configured ? '已配置' : '未配置' }}
      </el-tag>
    </div>

    <el-card v-loading="loading" class="config-card" shadow="never">
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
        <el-form-item label="Netscape Cookie" prop="cookieText">
          <el-input
            v-model="form.cookieText"
            type="textarea"
            :rows="18"
            resize="vertical"
            :spellcheck="false"
            autocomplete="off"
            placeholder="# Netscape HTTP Cookie File"
          />
          <div class="field-note">可留空；配置时必须包含 Netscape 文件头及 bilibili.com 域名记录。</div>
        </el-form-item>

        <el-form-item label="User-Agent" prop="userAgent">
          <el-input
            v-model="form.userAgent"
            autocomplete="off"
            placeholder="Mozilla/5.0 ..."
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="saving" @click="saveConfig">保存配置</el-button>
          <el-button :disabled="loading || saving" @click="loadConfig">重新加载</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="config-card" shadow="never">
      <template #header>
        <div>
          <div class="section-title">连接测试</div>
          <div class="field-note">只读取空间合集与最近一则影片 metadata，不下载评论。</div>
        </div>
      </template>

      <el-form label-width="110px">
        <el-form-item label="空间 MID">
          <el-input v-model="testSpaceMid" maxlength="32" placeholder="3546606469123022" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" plain :loading="testing" @click="testConnection">执行测试</el-button>
        </el-form-item>
      </el-form>

      <el-descriptions v-if="testResult" :column="1" border>
        <el-descriptions-item label="可访问">{{ testResult.reachable ? '是' : '否' }}</el-descriptions-item>
        <el-descriptions-item label="BVID">{{ testResult.bvid || '-' }}</el-descriptions-item>
        <el-descriptions-item label="标题">{{ testResult.title || '-' }}</el-descriptions-item>
        <el-descriptions-item label="作者 MID">{{ testResult.uploaderId || '-' }}</el-descriptions-item>
        <el-descriptions-item label="错误">{{ testResult.error || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-card>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { bilibiliConfigApi } from '@/services/api.js'

const formRef = ref(null)
const loading = ref(false)
const saving = ref(false)
const testing = ref(false)
const testSpaceMid = ref('')
const testResult = ref(null)

const form = reactive({
  cookieText: '',
  userAgent: '',
  configured: false
})

const rules = {
  userAgent: [{ required: true, message: '请输入完整浏览器 User-Agent', trigger: 'blur' }]
}

const assignForm = (data) => {
  form.cookieText = data.cookieText || ''
  form.userAgent = data.userAgent || ''
  form.configured = Boolean(data.configured)
}

const loadConfig = async () => {
  loading.value = true
  try {
    const res = await bilibiliConfigApi.get()
    if (res.code === 200) {
      assignForm(res.data || {})
      return
    }
    ElMessage.error(res.message || '加载 Bilibili 配置失败')
  } finally {
    loading.value = false
  }
}

const saveConfig = async () => {
  const valid = await formRef.value?.validate?.().catch(() => false)
  if (!valid) return
  saving.value = true
  try {
    const res = await bilibiliConfigApi.update({
      cookieText: form.cookieText,
      userAgent: form.userAgent
    })
    if (res.code === 200) {
      form.configured = true
      ElMessage.success('Bilibili 配置保存成功')
      return
    }
    ElMessage.error(res.message || '保存 Bilibili 配置失败')
  } finally {
    saving.value = false
  }
}

const testConnection = async () => {
  const spaceMid = testSpaceMid.value.trim()
  if (!/^\d+$/.test(spaceMid)) {
    ElMessage.error('请输入有效的 Bilibili 空间 MID')
    return
  }
  testing.value = true
  testResult.value = null
  try {
    const res = await bilibiliConfigApi.test({ spaceMid })
    if (res.code === 200) {
      testResult.value = res.data || null
      if (res.data?.reachable) {
        ElMessage.success('Bilibili 连接测试成功')
      } else {
        ElMessage.error(res.data?.error || 'Bilibili 连接测试失败')
      }
      return
    }
    ElMessage.error(res.message || 'Bilibili 连接测试失败')
  } finally {
    testing.value = false
  }
}

onMounted(loadConfig)
</script>

<style scoped>
.bilibili-config-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
}

.page-title {
  margin: 0;
  font-size: 24px;
  line-height: 1.3;
  color: #1f2937;
}

.page-subtitle {
  margin: 6px 0 0;
  color: #6b7280;
  font-size: 14px;
}

.config-card {
  border-radius: 8px;
}

.section-title {
  font-weight: 700;
  color: #1f2937;
}

.field-note {
  margin-top: 6px;
  color: #6b7280;
  font-size: 13px;
  line-height: 1.5;
}
</style>
