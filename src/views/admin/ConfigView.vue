<template>
  <div class="config-page">
    <h2 class="page-title">系统配置管理</h2>
    
    <!-- 消息模板管理 -->
    <el-card class="config-card">
      <template #header>
        <div class="card-header">
          <span>消息模板管理</span>
          <el-button type="primary" size="small" @click="showTemplateDialog = true">
            <el-icon><Plus /></el-icon> 新建模板
          </el-button>
        </div>
      </template>
      
      <el-tabs v-model="activeTemplateType">
        <el-tab-pane label="后缀模板" name="postfix">
          <template-table 
            :templates="postfixTemplates" 
            @edit="handleEditTemplate"
            @delete="handleDeleteTemplate"
            @set-default="handleSetDefault"
          />
        </el-tab-pane>
        <el-tab-pane label="头部模板" name="header">
          <template-table 
            :templates="headerTemplates" 
            @edit="handleEditTemplate"
            @delete="handleDeleteTemplate"
            @set-default="handleSetDefault"
          />
        </el-tab-pane>
      </el-tabs>
    </el-card>
    
    <!-- Emoji配置管理 -->
    <el-card class="config-card" style="margin-top: 20px;">
      <template #header>
        <div class="card-header">
          <span>Emoji前缀配置</span>
          <span class="sub-title">根据文章类型自动添加emoji前缀</span>
        </div>
      </template>
      
      <el-table :data="emojiConfigs" style="width: 100%">
        <el-table-column prop="articleTypeDesc" label="文章类型" width="150" />
        <el-table-column prop="prefixEmoji" label="Emoji前缀" width="200">
          <template #default="scope">
            <div class="emoji-edit-cell">
              <span class="emoji-preview">{{ scope.row.prefixEmoji }}</span>
              <el-input 
                v-model="scope.row.prefixEmoji" 
                size="small" 
                style="width: 120px; margin-left: 10px;"
                placeholder="输入emoji"
              />
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="isActive" label="启用状态" width="120">
          <template #default="scope">
            <el-switch v-model="scope.row.isActive" />
          </template>
        </el-table-column>
        <el-table-column label="操作">
          <template #default="scope">
            <el-button type="primary" size="small" @click="handleSaveEmoji(scope.row)">
              保存
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="emoji-tips">
        <p><strong>提示：</strong></p>
        <ul>
          <li>支持 Unicode Emoji: 😀 🎉 📰 📢</li>
          <li>支持 Custom Emoji: 使用 &lt;tg-emoji emoji-id="123"&gt;😀&lt;/tg-emoji&gt; 格式</li>
          <li>可从 <el-link type="primary" href="https://t.me/addemoji/NanyangviewsRegiontypeWhale4447" target="_blank">表情包</el-link> 获取 emoji ID</li>
        </ul>
      </div>
    </el-card>
    
    <!-- 模板编辑对话框 -->
    <el-dialog
      v-model="showTemplateDialog"
      :title="isEditing ? '编辑模板' : '新建模板'"
      width="600px"
    >
      <el-form :model="templateForm" label-width="100px">
        <el-form-item label="模板名称">
          <el-input v-model="templateForm.name" placeholder="例如：招商模板" />
        </el-form-item>
        <el-form-item label="模板类型">
          <el-radio-group v-model="templateForm.templateType">
            <el-radio label="postfix">后缀模板</el-radio>
            <el-radio label="header">头部模板</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="模板内容">
          <el-input
            v-model="templateForm.content"
            type="textarea"
            :rows="6"
            placeholder="例如：关注XXX频道➡️ @pd888 投稿：@tx888"
          />
        </el-form-item>
        <el-form-item label="设为默认">
          <el-switch v-model="templateForm.isDefault" />
        </el-form-item>
        <el-form-item label="模板说明">
          <el-input v-model="templateForm.description" placeholder="可选，用于描述模板用途" />
        </el-form-item>
        <el-form-item label="预览">
          <div class="preview-box">
            <div class="preview-content" v-html="templatePreviewHtml"></div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showTemplateDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSaveTemplate" :loading="saving">
          保存
        </el-button>
      </template>
    </el-dialog>
    
    <!-- 向后兼容：旧版后缀模板 -->
    <el-card class="config-card" style="margin-top: 20px;">
      <template #header>
        <div class="card-header">
          <span>旧版配置（向后兼容）</span>
        </div>
      </template>
      
      <el-form label-width="120px">
        <el-form-item label="后缀模版">
          <el-input
            v-model="postfixTemplate"
            type="textarea"
            :rows="4"
            placeholder="例如：关注XXX频道➡️ @pd888 投稿：@tx888"
            disabled
          />
          <div class="hint">已迁移到模板系统管理，如需修改请使用上方的模板管理功能</div>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 频道监控管理 -->
    <el-card class="config-card" style="margin-top: 20px;">
      <template #header>
        <div class="card-header">
          <span>频道监控管理</span>
          <div class="header-controls">
            <el-switch v-model="monitorEnabled" active-text="启用" inactive-text="停用" />
            <el-button type="primary" size="small" @click="handleSaveChannels" :loading="savingChannels" style="margin-left: 12px;">
              保存配置
            </el-button>
          </div>
        </div>
      </template>
      
      <div class="channel-controls">
        <el-input v-model="newChannel" placeholder="输入频道 username 或链接 (如 @channel_name 或 https://t.me/channel)" style="width: 400px;" @keyup.enter="addChannel" />
        <el-button type="primary" size="small" @click="addChannel" style="margin-left: 10px;">
          <el-icon><Plus /></el-icon> 添加
        </el-button>
      </div>

      <el-table :data="channelItems" style="margin-top: 15px;" v-if="channelItems.length > 0">
        <el-table-column prop="name" label="频道" />
        <el-table-column label="操作" width="100">
          <template #default="scope">
            <el-button link type="danger" size="small" @click="removeChannel(scope.$index)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-else description="暂未配置监控频道" :image-size="60" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { messageTemplateApi, emojiConfigApi, configApi, channelMonitorApi } from '../../services/api.js'

// 模板管理
const activeTemplateType = ref('postfix')
const templates = ref([])
const showTemplateDialog = ref(false)
const isEditing = ref(false)
const saving = ref(false)
const postfixTemplate = ref('')

const templateForm = ref({
  id: null,
  name: '',
  templateType: 'postfix',
  content: '',
  isDefault: false,
  description: ''
})

const postfixTemplates = computed(() => 
  templates.value.filter(t => t.templateType === 'postfix')
)

const headerTemplates = computed(() => 
  templates.value.filter(t => t.templateType === 'header')
)

const templatePreviewHtml = computed(() => {
  if (!templateForm.value.content) return '<span style="color: #999;">（空）</span>'
  return templateForm.value.content.replace(/\n/g, '<br>')
})

// Emoji配置
const emojiConfigs = ref([])

// 频道监控
const newChannel = ref('')
const channelItems = ref([])
const monitorEnabled = ref(false)
const savingChannels = ref(false)

// 加载模板列表
const loadTemplates = async () => {
  try {
    const res = await messageTemplateApi.getList()
    if (res.code === 200) {
      templates.value = res.data || []
    }
  } catch (error) {
    console.error('加载模板失败:', error)
    ElMessage.error('加载模板失败')
  }
}

// 加载Emoji配置
const loadEmojiConfigs = async () => {
  try {
    const res = await emojiConfigApi.getList()
    if (res.code === 200) {
      emojiConfigs.value = res.data || []
    }
  } catch (error) {
    console.error('加载Emoji配置失败:', error)
    ElMessage.error('加载Emoji配置失败')
  }
}

// 加载旧版配置
const loadLegacyConfig = async () => {
  try {
    const res = await configApi.getPostfixTemplate()
    if (res.code === 200) {
      postfixTemplate.value = res.data || ''
    }
  } catch (error) {
    console.error('加载旧版配置失败:', error)
  }
}

// 加载频道监控配置
const loadChannelConfig = async () => {
  try {
    const res = await channelMonitorApi.getConfig()
    if (res.code === 200 && res.data) {
      const channels = res.data.monitor_channels || ''
      channelItems.value = channels ? channels.split(',').map(c => ({ name: c.trim() })).filter(c => c.name) : []
      monitorEnabled.value = res.data.monitor_enabled === '1'
    }
  } catch (error) {
    console.error('加载频道配置失败:', error)
  }
}

const addChannel = () => {
  const val = newChannel.value.trim()
  if (!val) return
  if (channelItems.value.some(c => c.name === val)) {
    ElMessage.warning('频道已存在')
    return
  }
  channelItems.value.push({ name: val })
  newChannel.value = ''
}

const removeChannel = (index) => {
  channelItems.value.splice(index, 1)
}

const handleSaveChannels = async () => {
  savingChannels.value = true
  try {
    const channels = channelItems.value.map(c => c.name).join(',')
    const res = await channelMonitorApi.saveChannels(channels, monitorEnabled.value)
    if (res.code === 200) {
      ElMessage.success('频道配置保存成功')
    } else {
      ElMessage.error(res.message || '保存失败')
    }
  } catch (error) {
    console.error('保存频道配置失败:', error)
    ElMessage.error('保存失败')
  } finally {
    savingChannels.value = false
  }
}

// 编辑模板
const handleEditTemplate = (template) => {
  isEditing.value = true
  templateForm.value = { ...template }
  showTemplateDialog.value = true
}

// 删除模板
const handleDeleteTemplate = async (template) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除模板"${template.name}"吗？`,
      '确认删除',
      { type: 'warning' }
    )
    
    const res = await messageTemplateApi.delete(template.id)
    if (res.code === 200) {
      ElMessage.success('删除成功')
      loadTemplates()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

// 设置默认模板
const handleSetDefault = async (template) => {
  try {
    const res = await messageTemplateApi.setDefault(template.id)
    if (res.code === 200) {
      ElMessage.success('设置成功')
      loadTemplates()
    }
  } catch (error) {
    console.error('设置失败:', error)
    ElMessage.error('设置失败')
  }
}

// 保存模板
const handleSaveTemplate = async () => {
  if (!templateForm.value.name || !templateForm.value.content) {
    ElMessage.warning('请填写模板名称和内容')
    return
  }
  
  saving.value = true
  try {
    let res
    if (isEditing.value) {
      res = await messageTemplateApi.update(templateForm.value.id, templateForm.value)
    } else {
      res = await messageTemplateApi.create(templateForm.value)
    }
    
    if (res.code === 200) {
      ElMessage.success(isEditing.value ? '更新成功' : '创建成功')
      showTemplateDialog.value = false
      loadTemplates()
    } else {
      ElMessage.error(res.message || '保存失败')
    }
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

// 保存Emoji配置
const handleSaveEmoji = async (row) => {
  try {
    const res = await emojiConfigApi.update(row.id, {
      prefixEmoji: row.prefixEmoji,
      isActive: row.isActive
    })
    
    if (res.code === 200) {
      ElMessage.success('保存成功')
    } else {
      ElMessage.error(res.message || '保存失败')
    }
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error('保存失败')
  }
}

// 子组件：模板表格
const TemplateTable = {
  props: ['templates'],
  emits: ['edit', 'delete', 'set-default'],
  template: `
    <el-table :data="templates" style="width: 100%">
      <el-table-column prop="name" label="模板名称" width="150" />
      <el-table-column prop="content" label="内容">
        <template #default="scope">
          <div class="template-content-preview">{{ scope.row.content }}</div>
        </template>
      </el-table-column>
      <el-table-column prop="isDefault" label="默认" width="80">
        <template #default="scope">
          <el-tag v-if="scope.row.isDefault" type="success" size="small">默认</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200">
        <template #default="scope">
          <el-button link type="primary" size="small" @click="$emit('edit', scope.row)">编辑</el-button>
          <el-button link type="primary" size="small" @click="$emit('set-default', scope.row)">设为默认</el-button>
          <el-button link type="danger" size="small" @click="$emit('delete', scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  `
}

onMounted(() => {
  loadTemplates()
  loadEmojiConfigs()
  loadLegacyConfig()
  loadChannelConfig()
})
</script>

<style scoped>
.config-page {
  padding: 20px;
}

.page-title {
  margin-bottom: 20px;
  font-size: 24px;
  color: #303133;
}

.config-card {
  max-width: 1000px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sub-title {
  font-size: 12px;
  color: #909399;
  font-weight: normal;
}

.preview-box {
  background: #f5f7fa;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 15px;
  min-height: 100px;
}

.preview-content {
  line-height: 1.8;
  white-space: pre-wrap;
}

.template-content-preview {
  max-height: 60px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.emoji-edit-cell {
  display: flex;
  align-items: center;
}

.emoji-preview {
  font-size: 24px;
  min-width: 30px;
}

.emoji-tips {
  margin-top: 20px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 4px;
  font-size: 13px;
  color: #606266;
}

.emoji-tips ul {
  margin: 5px 0;
  padding-left: 20px;
}

.emoji-tips li {
  margin: 5px 0;
}

.hint {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

.channel-controls {
  display: flex;
  align-items: center;
}

.header-controls {
  display: flex;
  align-items: center;
}
</style>
