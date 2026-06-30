<template>
  <div class="config-page">
    <h2 class="page-title">系统配置管理</h2>

    <el-card class="config-card">
      <template #header>
        <div class="card-header">
          <div>
            <span>消息模板管理</span>
            <span class="sub-title">管理发布时拼接的头部、后缀和 Telegram inline 按钮</span>
          </div>
          <el-button type="primary" size="small" @click="openCreateTemplate(activeTemplateType)">
            <el-icon><Plus /></el-icon>
            新建模板
          </el-button>
        </div>
      </template>

      <el-tabs v-model="activeTemplateType">
        <el-tab-pane label="后缀模板" name="postfix">
          <MessageTemplateTable
            :templates="postfixTemplates"
            :loading="templatesLoading"
            template-type="postfix"
            @create="openCreateTemplate"
            @edit="handleEditTemplate"
            @delete="handleDeleteTemplate"
            @set-default="handleSetDefault"
          />
        </el-tab-pane>
        <el-tab-pane label="头部模板" name="header">
          <MessageTemplateTable
            :templates="headerTemplates"
            :loading="templatesLoading"
            template-type="header"
            @create="openCreateTemplate"
            @edit="handleEditTemplate"
            @delete="handleDeleteTemplate"
            @set-default="handleSetDefault"
          />
        </el-tab-pane>
      </el-tabs>
    </el-card>

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

    <MessageTemplateDialog
      v-model:visible="showTemplateDialog"
      :template="editingTemplate"
      :default-type="templateDialogType"
      :saving="savingTemplate"
      @save="handleSaveTemplate"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import MessageTemplateDialog from '@/components/admin/config/MessageTemplateDialog.vue'
import MessageTemplateTable from '@/components/admin/config/MessageTemplateTable.vue'
import { emojiConfigApi, messageTemplateApi } from '../../services/api.js'

const activeTemplateType = ref('postfix')
const templates = ref([])
const templatesLoading = ref(false)
const showTemplateDialog = ref(false)
const savingTemplate = ref(false)
const editingTemplate = ref(null)
const templateDialogType = ref('postfix')

const postfixTemplates = computed(() => templates.value.filter((template) => template.templateType === 'postfix'))
const headerTemplates = computed(() => templates.value.filter((template) => template.templateType === 'header'))

const emojiConfigs = ref([])

const loadTemplates = async () => {
  templatesLoading.value = true
  try {
    const res = await messageTemplateApi.getList()
    if (res.code === 200) {
      templates.value = res.data || []
    } else {
      ElMessage.error(res.message || '加载模板失败')
    }
  } catch (error) {
    console.error('加载模板失败:', error)
    ElMessage.error('加载模板失败')
  } finally {
    templatesLoading.value = false
  }
}

const openCreateTemplate = (templateType = activeTemplateType.value) => {
  editingTemplate.value = null
  templateDialogType.value = templateType || 'postfix'
  showTemplateDialog.value = true
}

const handleEditTemplate = (template) => {
  editingTemplate.value = { ...template }
  templateDialogType.value = template.templateType || activeTemplateType.value
  showTemplateDialog.value = true
}

const handleDeleteTemplate = async (template) => {
  if (template.isDefault) {
    ElMessage.warning('默认模板不能直接删除，请先设置其他模板为默认')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要删除模板「${template.name}」吗？`,
      '确认删除',
      { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' }
    )

    const res = await messageTemplateApi.delete(template.id)
    if (res.code === 200) {
      ElMessage.success('删除成功')
      await loadTemplates()
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

const handleSetDefault = async (template) => {
  if (template.isDefault) return

  try {
    const res = await messageTemplateApi.setDefault(template.id)
    if (res.code === 200) {
      ElMessage.success('默认模板设置成功')
      await loadTemplates()
    } else {
      ElMessage.error(res.message || '设置失败')
    }
  } catch (error) {
    console.error('设置失败:', error)
    ElMessage.error('设置失败')
  }
}

const handleSaveTemplate = async (payload) => {
  savingTemplate.value = true
  try {
    const { id, ...data } = payload
    const res = id
      ? await messageTemplateApi.update(id, data)
      : await messageTemplateApi.create(data)

    if (res.code === 200) {
      ElMessage.success(id ? '模板更新成功' : '模板创建成功')
      showTemplateDialog.value = false
      editingTemplate.value = null
      activeTemplateType.value = data.templateType
      await loadTemplates()
    } else {
      ElMessage.error(res.message || '保存失败')
    }
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error('保存失败')
  } finally {
    savingTemplate.value = false
  }
}

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

onMounted(() => {
  loadTemplates()
  loadEmojiConfigs()
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
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.sub-title {
  margin-left: 10px;
  font-size: 12px;
  color: #909399;
  font-weight: normal;
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

</style>
