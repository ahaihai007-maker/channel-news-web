<template>
  <div class="publish-manage-view">
    <!-- 搜索栏 -->
    <el-card class="search-card" shadow="never">
      <el-form :inline="true" class="search-form">
        <el-form-item label="搜索">
          <el-input
            v-model="searchForm.keyword"
            placeholder="标题"
            clearable
            @keyup.enter="handleSearch"
            style="width: 180px"
          />
        </el-form-item>
        
        <el-form-item label="类型">
          <el-select v-model="searchForm.authorType" placeholder="全部" clearable style="width: 130px">
            <el-option label="网友投稿" value="submission" />
            <el-option label="机器人抓取" value="bot" />
            <el-option label="手动投稿" value="manual" />
            <el-option label="付费广告" value="ad" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="日期">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="-"
            start-placeholder="开始"
            end-placeholder="结束"
            style="width: 260px"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
          <el-button type="success" @click="fetchArticles">刷新</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 数据表格 -->
    <el-card>
      <template #header>
        <div class="card-header">
          <span>待发布稿件 (共 {{ total }} 条)</span>
        </div>
      </template>
      
      <el-table :data="articles" v-loading="loading" style="width: 100%">
        <el-table-column prop="id" label="ID" width="60" />
        
        <el-table-column label="标题" min-width="250">
          <template #default="{ row }">
            <el-link type="primary" @click="viewDetail(row)">{{ row.title }}</el-link>
          </template>
        </el-table-column>
        
        <el-table-column label="作者" width="120">
          <template #default="{ row }">
            {{ row.authorName || '匿名' }}
          </template>
        </el-table-column>
        
        <el-table-column label="附件" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.hasFiles" type="success" size="small">有附件</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        
        <el-table-column label="通过时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.updatedAt) }}
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button 
              type="primary" 
              size="small" 
              @click="publishArticleConfirm(row)"
              :loading="publishingId === row.id"
              :disabled="publishingId === row.id"
            >
              {{ publishingId === row.id ? '发布中...' : '发布' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination-container" v-if="total > 0">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchArticles"
          @current-change="fetchArticles"
        />
      </div>
      
      <el-empty v-if="!loading && articles.length === 0" description="暂无待发布稿件" />
    </el-card>

    <!-- 文章预览弹窗 - Telegram 风格 -->
    <el-dialog
      v-model="detailVisible"
      title="文章预览"
      width="600px"
      class="article-preview-dialog telegram-style"
      :close-on-click-modal="false"
    >
      <div v-if="currentArticle" class="telegram-message-preview">
        <!-- Telegram 风格消息气泡 -->
        <div class="telegram-message-bubble">
          <!-- 作者信息 -->
          <div class="telegram-author">
            <span class="author-name">{{ currentArticle.authorName || '匿名' }}</span>
            <span v-if="currentArticle.articleType" class="author-badge">{{ getTypeLabel(currentArticle.articleType) }}</span>
          </div>
          
          <!-- 标题 -->
          <h3 class="telegram-title">{{ currentArticle.title }}</h3>
          
          <!-- 媒体文件 - Telegram 风格内嵌展示 -->
          <div v-if="currentArticle.files && currentArticle.files.length > 0" class="telegram-media">
            <!-- 图片 - Telegram 风格网格 -->
            <div v-if="getImageFiles().length > 0" class="telegram-image-grid" :class="'grid-' + Math.min(getImageFiles().length, 4)">
              <div 
                v-for="(file, index) in getImageFiles().slice(0, 4)" 
                :key="'img-'+index" 
                class="telegram-image-item"
                @click="previewImage(index)"
              >
                <el-image 
                  :src="getFileViewUrl(file.url)" 
                  fit="cover"
                  class="telegram-image"
                />
                <div v-if="index === 3 && getImageFiles().length > 4" class="image-more-overlay">
                  <span>+{{ getImageFiles().length - 4 }}</span>
                </div>
              </div>
            </div>
            
            <!-- 视频 - Telegram 风格 -->
            <div v-if="getVideoFiles().length > 0" class="telegram-video-list">
              <div 
                v-for="(file, index) in getVideoFiles()" 
                :key="'video-'+index" 
                class="telegram-video-item"
              >
                <video 
                  :src="getFileViewUrl(file.url)" 
                  controls
                  class="telegram-video"
                />
              </div>
            </div>
          </div>
          
          <!-- 正文内容 -->
          <div class="telegram-content" v-html="currentArticle.content"></div>
          
          <!-- 时间和状态 - Telegram 风格右下角 -->
          <div class="telegram-meta">
            <span class="telegram-time">{{ formatTelegramTime(currentArticle.createdAt) }}</span>
            <el-icon class="telegram-status" :size="14" color="#67C23A"><Check /></el-icon>
          </div>
        </div>
        
        <!-- 操作按钮 -->
        <div class="telegram-actions" v-if="currentArticle.status === 'APPROVED'">
          <el-button type="primary" size="large" @click="handlePublish(currentArticle)">
            <el-icon><Promotion /></el-icon>
            发布到频道
          </el-button>
        </div>
      </div>
    </el-dialog>

    <!-- 模板选择对话框 -->
    <el-dialog
      v-model="templateDialogVisible"
      title="选择发布模板"
      width="500px"
      :close-on-click-modal="false"
    >
      <div v-loading="loadingTemplates">
        <el-form label-width="100px">
          <el-form-item label="后缀模板">
            <el-select v-model="selectedTemplateId" placeholder="选择模板（可选）" clearable style="width: 100%">
              <el-option
                v-for="template in templates.filter(t => t.templateType === 'postfix')"
                :key="template.id"
                :label="template.name + (template.isDefault ? ' (默认)' : '')"
                :value="template.id"
              >
                <div class="template-option">
                  <span>{{ template.name }}</span>
                  <span v-if="template.isDefault" class="default-tag">默认</span>
                </div>
              </el-option>
            </el-select>
            <div class="template-preview" v-if="selectedTemplateId">
              <el-divider content-position="left">预览</el-divider>
              <div class="preview-content">
                {{ templates.find(t => t.id === selectedTemplateId)?.content }}
              </div>
            </div>
          </el-form-item>

          <el-form-item label="Emoji前缀">
            <el-switch v-model="useEmojiPrefix" active-text="启用" inactive-text="禁用" />
            <div class="emoji-hint" v-if="useEmojiPrefix">
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
        </el-form>
      </div>

      <template #footer>
        <el-button @click="templateDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmPublishWithTemplate" :loading="publishingId === currentPublishArticle?.id">
          {{ publishingId === currentPublishArticle?.id ? '发布中...' : '确认发布' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 快速投稿对话框 -->
    <el-dialog
      v-model="submitDialogVisible"
      title="快速投稿"
      width="700px"
      :close-on-click-modal="false"
    >
      <el-form :model="submitForm" label-width="100px">
        <el-form-item label="认证方式" required>
          <el-radio-group v-model="submitForm.authMode">
            <el-radio label="jwt">使用当前登录账号(JWT)</el-radio>
            <el-radio label="bot">使用Bot Token</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="Bot Token" v-if="submitForm.authMode === 'bot'" required>
          <el-input 
            v-model="submitForm.botToken" 
            placeholder="请输入Bot Token" 
            type="password"
            show-password
          />
        </el-form-item>
        
        <el-form-item label="投稿类型" required>
          <el-select v-model="submitForm.articleType" style="width: 100%">
            <el-option label="#付费广告" value="AD" />
            <el-option label="#网友投稿" value="SUBMISSION" />
            <el-option label="手动投稿（无标签）" value="MANUAL" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="文章标题" required>
          <el-input v-model="submitForm.title" placeholder="请输入标题" />
        </el-form-item>
        
        <el-form-item label="作者" required>
          <el-input v-model="submitForm.authorUsername" placeholder="作者用户名" />
        </el-form-item>
        
        <el-form-item label="摘要">
          <el-input 
            v-model="submitForm.summary" 
            type="textarea" 
            :rows="2"
            placeholder="文章摘要（可选）"
          />
        </el-form-item>
        
        <el-form-item label="文章内容" required>
          <el-input 
            v-model="submitForm.content" 
            type="textarea" 
            :rows="8"
            placeholder="支持HTML格式"
          />
        </el-form-item>
        
        <el-form-item label="上传附件">
          <el-upload
            v-model:file-list="fileList"
            action="#"
            :auto-upload="false"
            :on-change="handleFileChange"
            :on-remove="handleFileRemove"
            multiple
            drag
          >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">
              拖拽文件到此处或 <em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                支持多个图片（jpg/png/gif）和视频（mp4/mov）文件，单个文件不超过50MB
              </div>
            </template>
          </el-upload>
        </el-form-item>
        
        <!-- 预览已选择的文件 -->
        <el-form-item label="已选文件" v-if="fileList.length > 0">
          <div class="file-preview-list">
            <div v-for="(file, index) in fileList" :key="index" class="file-preview-item">
              <el-image 
                v-if="isImage(file.raw.type)" 
                :src="getFileUrl(file)" 
                fit="cover"
                style="width: 100px; height: 100px;"
              />
              <div v-else class="video-preview">
                <el-icon><VideoCamera /></el-icon>
                <span>视频文件</span>
              </div>
              <span class="file-name">{{ file.name }}</span>
              <el-button 
                type="danger" 
                link 
                size="small" 
                @click="removeFile(index)"
              >
                删除
              </el-button>
            </div>
          </div>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="submitDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitting">
            提交投稿
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getApprovedArticles, publishArticle, publishWithTemplate, submitArticleWithFiles, getArticleDetail, messageTemplateApi, emojiConfigApi, tagApi } from '@/services/api.js'
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus'
import { Search, UploadFilled, VideoCamera, Document, User, Calendar, Picture, ZoomIn, Check, Promotion } from '@element-plus/icons-vue'

// 详情弹窗
const detailVisible = ref(false)
const currentArticle = ref(null)

// 搜索表单
const searchForm = reactive({
  keyword: '',
  authorType: '',
  dateRange: null
})

// 数据列表
const articles = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 投稿对话框
const submitDialogVisible = ref(false)
const submitting = ref(false)
const submitForm = reactive({
  title: '',
  content: '',
  summary: '',
  authorUsername: 'bot',
  authMode: 'jwt',
  botToken: '',
  articleType: 'AD'
})

// 文件列表
const fileList = ref([])

// 模板选择对话框
const templateDialogVisible = ref(false)
const currentPublishArticle = ref(null)
const templates = ref([])
const selectedTemplateId = ref(null)
const useEmojiPrefix = ref(true)
const loadingTemplates = ref(false)

// 标签选择
const regionTags = ref([])
const typeTags = ref([])
const selectedRegionTag = ref(null)
const selectedTypeTag = ref(null)

// 获取数据
const fetchArticles = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value
    }
    
    if (searchForm.keyword) {
      params.keyword = searchForm.keyword
    }
    if (searchForm.authorType) {
      params.authorType = searchForm.authorType
    }
    // 添加日期范围参数
    if (searchForm.dateRange && searchForm.dateRange.length === 2) {
      const formatDate = (date) => {
        if (date instanceof Date) {
          return date.toISOString().split('T')[0]
        }
        return date
      }
      params.startDate = formatDate(searchForm.dateRange[0])
      params.endDate = formatDate(searchForm.dateRange[1])
    }
    
    const res = await getApprovedArticles(params)
    if (res.code === 200) {
      articles.value = res.data.list || []
      total.value = res.data.total || 0
    }
  } catch (error) {
    console.error('获取列表失败:', error)
    ElMessage.error('获取列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  currentPage.value = 1
  fetchArticles()
}

// 重置
const handleReset = () => {
  searchForm.keyword = ''
  searchForm.authorType = ''
  searchForm.dateRange = null
  currentPage.value = 1
  fetchArticles()
}

// 显示投稿对话框
const showSubmitDialog = () => {
  submitForm.title = ''
  submitForm.content = ''
  submitForm.summary = ''
  submitForm.authMode = 'jwt'
  submitForm.botToken = ''
  submitForm.articleType = 'AD'
  fileList.value = []
  submitDialogVisible.value = true
}

// 判断是否为图片
const isImage = (type) => {
  return type && type.startsWith('image/')
}

// 获取文件预览URL
const getFileUrl = (file) => {
  return URL.createObjectURL(file.raw)
}

// 处理文件变更
const handleFileChange = (uploadFile) => {
  console.log('文件已选择:', uploadFile.name)
}

// 处理文件移除
const handleFileRemove = () => {
  console.log('文件已移除')
}

// 移除文件
const removeFile = (index) => {
  fileList.value.splice(index, 1)
}

// 提交投稿
const handleSubmit = async () => {
  if (!submitForm.title.trim()) {
    ElMessage.warning('请输入标题')
    return
  }
  if (!submitForm.content.trim()) {
    ElMessage.warning('请输入内容')
    return
  }
  if (!submitForm.authorUsername.trim()) {
    ElMessage.warning('请输入作者')
    return
  }
  
  // 验证Bot Token（如果使用Bot认证方式）
  if (submitForm.authMode === 'bot' && !submitForm.botToken.trim()) {
    ElMessage.warning('请输入Bot Token')
    return
  }

  submitting.value = true
  try {
    // 准备文件数据
    const files = fileList.value.map(item => item.raw)
    
    // 确定使用哪种认证方式
    const authToken = submitForm.authMode === 'bot' ? submitForm.botToken : false
    
    const res = await submitArticleWithFiles({
      title: submitForm.title,
      content: submitForm.content,
      summary: submitForm.summary,
      authorUsername: submitForm.authorUsername,
      articleType: submitForm.articleType
    }, files, authToken)
    
    if (res.code === 200) {
      ElMessage.success(`投稿成功！上传了 ${res.data.fileCount || 0} 个文件`)
      submitDialogVisible.value = false
      // 刷新列表
      fetchArticles()
    } else {
      ElMessage.error(res.message || '投稿失败')
    }
  } catch (error) {
    console.error('投稿失败:', error)
    ElMessage.error('投稿失败: ' + (error.message || '未知错误'))
  } finally {
    submitting.value = false
  }
}

// 查看文章详情（弹窗）
const viewDetail = async (row) => {
  // 获取完整文章详情（包含 content 和 files）
  try {
    const res = await getArticleDetail(row.id)
    if (res.code === 200) {
      currentArticle.value = res.data
      detailVisible.value = true
    } else {
      ElMessage.error(res.message || '获取文章详情失败')
    }
  } catch (error) {
    console.error('获取文章详情失败:', error)
    ElMessage.error('获取文章详情失败')
  }
}

// 获取图片文件列表
const getImageFiles = () => {
  if (!currentArticle.value?.files) return []
  return currentArticle.value.files.filter(f => f.fileType === 'image')
}

// 获取视频文件列表
const getVideoFiles = () => {
  if (!currentArticle.value?.files) return []
  return currentArticle.value.files.filter(f => f.fileType === 'video')
}

// 获取其他文件列表
const getOtherFiles = () => {
  if (!currentArticle.value?.files) return []
  return currentArticle.value.files.filter(f => f.fileType !== 'image' && f.fileType !== 'video')
}

// 预览图片
const previewImage = (index) => {
  const images = getImageFiles()
  const imageUrls = images.map(f => getFileViewUrl(f.url))
  
  // 使用 Element Plus 的图片预览
  const { preview } = ElImage
  if (preview) {
    preview(imageUrls, index)
  }
}

// 获取文件查看URL
const getFileViewUrl = (url) => {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return `${window.location.protocol}//${window.location.host}${url}`
}

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 正在发布的文章ID
const publishingId = ref(null)

// 加载模板列表
const loadTemplates = async () => {
  loadingTemplates.value = true
  try {
    // 并行加载模板和标签
    const [templateRes, regionRes, typeRes] = await Promise.all([
      messageTemplateApi.getList(),
      tagApi.getRegions(),
      tagApi.getTypes()
    ])
    
    if (templateRes.code === 200) {
      templates.value = templateRes.data || []
      // 自动选择默认模板
      const defaultTemplate = templates.value.find(t => t.templateType === 'postfix' && t.isDefault)
      if (defaultTemplate) {
        selectedTemplateId.value = defaultTemplate.id
      }
    }
    
    if (regionRes.code === 200) {
      regionTags.value = regionRes.data || []
    }
    
    if (typeRes.code === 200) {
      typeTags.value = typeRes.data || []
    }
  } catch (error) {
    console.error('加载模板或标签失败:', error)
  } finally {
    loadingTemplates.value = false
  }
}

// 打开模板选择对话框
const openTemplateDialog = async (row) => {
  currentPublishArticle.value = row
  selectedTemplateId.value = null
  useEmojiPrefix.value = true
  selectedRegionTag.value = null
  selectedTypeTag.value = null
  await loadTemplates()
  templateDialogVisible.value = true
}

// 确认使用模板发布
const confirmPublishWithTemplate = async () => {
  if (!currentPublishArticle.value) return
  
  publishingId.value = currentPublishArticle.value.id
  templateDialogVisible.value = false
  
  try {
    const res = await publishWithTemplate(currentPublishArticle.value.id, {
      templateId: selectedTemplateId.value,
      useEmoji: useEmojiPrefix.value,
      regionTag: selectedRegionTag.value,
      typeTag: selectedTypeTag.value
    })
    
    if (res.code === 200) {
      ElMessage.success('发布成功')
      fetchArticles()
    } else {
      ElMessage.error(res.message || '发布失败')
    }
  } catch (error) {
    ElMessage.error('发布失败：' + (error.message || '网络错误'))
  } finally {
    publishingId.value = null
    currentPublishArticle.value = null
  }
}

// 原始发布函数（保留向后兼容）
const publishArticleConfirm = async (row) => {
  try {
    await ElMessageBox.confirm('确定要发布这篇文章吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info'
    })
    
    // 打开模板选择对话框
    openTemplateDialog(row)
  } catch (error) {
    if (error !== 'cancel') {
      console.error('操作失败:', error)
    }
  }
}

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleString('zh-CN')
}

// Telegram 风格时间格式
const formatTelegramTime = (date) => {
  if (!date) return ''
  const d = new Date(date)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  
  const hours = d.getHours().toString().padStart(2, '0')
  const minutes = d.getMinutes().toString().padStart(2, '0')
  const timeStr = `${hours}:${minutes}`
  
  if (isToday) {
    return timeStr
  } else {
    const month = (d.getMonth() + 1).toString().padStart(2, '0')
    const day = d.getDate().toString().padStart(2, '0')
    return `${month}月${day}日 ${timeStr}`
  }
}

// 获取文章类型标签
const getTypeLabel = (type) => {
  const map = {
    'SUBMISSION': '网友投稿',
    'BOT': '机器人抓取',
    'MANUAL': '手动投稿',
    'AD': '付费广告'
  }
  return map[type] || '未知'
}

onMounted(() => {
  fetchArticles()
})
</script>

<style scoped>
.publish-manage-view {
  padding: 20px 0;
}

.search-card {
  margin-bottom: 20px;
}

.card-header {
  font-weight: bold;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.file-preview-list {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
}

.file-preview-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  width: 120px;
}

.file-preview-item .file-name {
  font-size: 12px;
  color: #606266;
  margin: 5px 0;
  word-break: break-all;
  text-align: center;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.video-preview {
  width: 100px;
  height: 100px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  color: #909399;
}

.video-preview .el-icon {
  font-size: 32px;
  margin-bottom: 5px;
}

/* 文章详情弹窗样式 */
/* 文章预览弹窗样式 */
.article-preview {
  padding: 10px;
}

.preview-title {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 16px 0;
  line-height: 1.4;
}

.preview-meta {
  display: flex;
  gap: 20px;
  color: #909399;
  font-size: 14px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.preview-summary {
  margin-bottom: 24px;
}

/* 媒体展示区域 */
.preview-media-section {
  margin-bottom: 32px;
}

.media-gallery {
  margin-bottom: 24px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #606266;
  margin: 0 0 16px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 图片画廊 */
.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
}

.image-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  background: #f5f7fa;
}

.gallery-image {
  width: 100%;
  height: 100%;
  transition: transform 0.3s;
}

.image-item:hover .gallery-image {
  transform: scale(1.05);
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
}

.image-item:hover .image-overlay {
  opacity: 1;
}

.image-overlay .el-icon {
  font-size: 32px;
  color: white;
}

/* 视频列表 */
.video-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.video-item {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.preview-video {
  width: 100%;
  max-height: 300px;
  border-radius: 4px;
  background: #000;
}

.video-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}

.video-name {
  color: #606266;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-right: 12px;
}

.video-size {
  color: #909399;
  flex-shrink: 0;
}

/* 其他文件列表 */
.file-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.file-item-compact {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: #f5f7fa;
  border-radius: 6px;
  font-size: 13px;
}

.file-item-compact .file-name {
  flex: 1;
  color: #606266;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-item-compact .file-size {
  color: #909399;
  flex-shrink: 0;
}

/* 文章内容区域 */
.preview-content-wrapper {
  border-top: 1px solid #ebeef5;
  padding-top: 24px;
}

.preview-content {
  font-size: 15px;
  line-height: 1.8;
  color: #303133;
}

.preview-content :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  margin: 12px 0;
}

.preview-content :deep(p) {
  margin: 12px 0;
}

.preview-content :deep(h2), .preview-content :deep(h3) {
  margin: 20px 0 12px;
  color: #303133;
}

/* ==================== Telegram 风格预览样式 ==================== */

.telegram-message-preview {
  padding: 20px;
  background: #e5ddd5;
  min-height: 400px;
}

.telegram-message-bubble {
  background: #ffffff;
  border-radius: 12px;
  padding: 12px 16px;
  max-width: 100%;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
  position: relative;
}

.telegram-author {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.author-name {
  font-weight: 600;
  color: #168acd;
  font-size: 14px;
}

.author-badge {
  font-size: 11px;
  padding: 2px 6px;
  background: #e6f7ff;
  color: #168acd;
  border-radius: 4px;
  border: 1px solid #91d5ff;
}

.telegram-title {
  font-size: 16px;
  font-weight: 600;
  color: #000000;
  margin: 0 0 10px 0;
  line-height: 1.4;
}

/* Telegram 媒体展示 */
.telegram-media {
  margin-bottom: 12px;
}

/* Telegram 图片网格 */
.telegram-image-grid {
  display: grid;
  gap: 2px;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 10px;
}

.telegram-image-grid.grid-1 {
  grid-template-columns: 1fr;
}

.telegram-image-grid.grid-2 {
  grid-template-columns: 1fr 1fr;
}

.telegram-image-grid.grid-3 {
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
}

.telegram-image-grid.grid-3 .telegram-image-item:first-child {
  grid-column: span 2;
}

.telegram-image-grid.grid-4 {
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
}

.telegram-image-item {
  position: relative;
  aspect-ratio: 1;
  cursor: pointer;
  overflow: hidden;
  background: #f0f0f0;
}

.telegram-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.2s;
}

.telegram-image-item:hover .telegram-image {
  transform: scale(1.02);
}

.image-more-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
  font-weight: 600;
}

/* Telegram 视频列表 */
.telegram-video-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 10px;
}

.telegram-video-item {
  border-radius: 8px;
  overflow: hidden;
  background: #000;
}

.telegram-video {
  width: 100%;
  max-height: 300px;
  display: block;
}

/* Telegram 内容样式 */
.telegram-content {
  font-size: 15px;
  line-height: 1.5;
  color: #000000;
  margin-bottom: 8px;
}

.telegram-content :deep(p) {
  margin: 0 0 8px 0;
}

.telegram-content :deep(p):last-child {
  margin-bottom: 0;
}

.telegram-content :deep(img) {
  max-width: 100%;
  border-radius: 8px;
  margin: 8px 0;
}

/* Telegram 元信息 - 右下角时间 */
.telegram-meta {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  margin-top: 4px;
}

.telegram-time {
  font-size: 12px;
  color: #999999;
}

.telegram-status {
  margin-left: 2px;
}

/* Telegram 操作按钮 */
.telegram-actions {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #d9d9d9;
  display: flex;
  justify-content: center;
}

.telegram-actions .el-button {
  padding: 12px 32px;
  font-size: 16px;
}

/* 弹窗样式调整 */
:deep(.telegram-style .el-dialog__body) {
  padding: 0;
}

:deep(.telegram-style .el-dialog__header) {
  background: #ffffff;
  border-bottom: 1px solid #e4e4e4;
  margin-right: 0;
  padding: 16px 20px;
}

/* 模板选择对话框样式 */
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
</style>