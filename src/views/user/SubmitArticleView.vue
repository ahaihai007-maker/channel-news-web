<template>
  <div class="submit-article-view">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>投稿</span>
        </div>
      </template>
      
      <el-form 
        ref="formRef" 
        :model="form" 
        :rules="rules" 
        label-width="80px"
        class="article-form"
      >
        <el-form-item label="标题" prop="title">
          <el-input 
            v-model="form.title" 
            placeholder="请输入文章标题"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>
        
        <el-form-item label="摘要" prop="summary">
          <el-input 
            v-model="form.summary" 
            type="textarea" 
            :rows="3"
            placeholder="请输入文章摘要"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
        
        <el-form-item label="内容" prop="content">
          <div class="editor-wrapper">
            <Toolbar
              :editor="editorRef"
              :defaultConfig="toolbarConfig"
              :mode="mode"
              style="border-bottom: 1px solid #ccc"
            />
            <Editor
              :defaultConfig="editorConfig"
              :mode="mode"
              v-model="form.content"
              style="height: 400px; overflow-y: hidden"
              @onCreated="handleCreated"
            />
          </div>
        </el-form-item>
        
        <el-form-item label="附件">
          <el-upload
            ref="uploadRef"
            v-model:file-list="fileList"
            action="#"
            :auto-upload="false"
            :on-change="handleFileChange"
            :on-remove="handleFileRemove"
            :before-upload="beforeUpload"
            multiple
            drag
            class="upload-area"
          >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">
              拖拽文件到此处或 <em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                支持多个图片（jpg/png/gif）和视频（mp4/mov），单个文件不超过50MB
              </div>
            </template>
          </el-upload>
          
          <!-- 已选择文件预览 -->
          <div v-if="fileList.length > 0" class="file-preview-section">
            <h4>已选择 {{ fileList.length }} 个文件：</h4>
            <div class="file-list">
              <div v-for="(file, index) in fileList" :key="index" class="file-item">
                <el-image 
                  v-if="isImage(file.raw.type)" 
                  :src="getFileUrl(file)" 
                  fit="cover"
                  style="width: 100px; height: 100px;"
                />
                <div v-else class="video-placeholder">
                  <el-icon :size="32"><VideoCamera /></el-icon>
                  <span>视频</span>
                </div>
                <div class="file-info">
                  <span class="file-name" :title="file.name">{{ file.name }}</span>
                  <span class="file-size">{{ formatFileSize(file.size) }}</span>
                </div>
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
          </div>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="submitForm" :loading="submitting">
            提交投稿
          </el-button>
          <el-button @click="goBack">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, shallowRef, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import { submitArticleWithFiles } from '@/services/api.js'
import { ElMessage } from 'element-plus'
import { UploadFilled, VideoCamera } from '@element-plus/icons-vue'
import '@wangeditor/editor/dist/css/style.css'

const router = useRouter()
const formRef = ref(null)
const editorRef = shallowRef()
const uploadRef = ref(null)
const submitting = ref(false)
const fileList = ref([])

const mode = 'default'

const form = ref({
  title: '',
  summary: '',
  content: ''
})

const rules = {
  title: [
    { required: true, message: '请输入标题', trigger: 'blur' },
    { min: 2, max: 100, message: '长度在 2 到 100 个字符', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '请输入内容', trigger: 'blur' }
  ]
}

const toolbarConfig = {}
const editorConfig = {
  placeholder: '请输入内容...',
  MENU_CONF: {
    uploadImage: {
      server: '/api/upload',
      fieldName: 'file'
    }
  }
}

const handleCreated = (editor) => {
  editorRef.value = editor
}

// 判断是否为图片
const isImage = (type) => {
  return type && type.startsWith('image/')
}

// 获取文件预览URL
const getFileUrl = (file) => {
  return URL.createObjectURL(file.raw)
}

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 处理文件变更
const handleFileChange = (uploadFile) => {
  console.log('文件已选择:', uploadFile.name)
  // 检查文件类型
  const isImageOrVideo = uploadFile.raw.type.startsWith('image/') || uploadFile.raw.type.startsWith('video/')
  if (!isImageOrVideo) {
    ElMessage.warning('只支持图片和视频文件')
    // 从列表中移除
    const index = fileList.value.findIndex(f => f.uid === uploadFile.uid)
    if (index > -1) {
      fileList.value.splice(index, 1)
    }
  }
}

// 处理文件移除
const handleFileRemove = () => {
  console.log('文件已移除')
}

// 上传前检查
const beforeUpload = (file) => {
  const isImageOrVideo = file.type.startsWith('image/') || file.type.startsWith('video/')
  if (!isImageOrVideo) {
    ElMessage.error('只支持图片和视频文件!')
    return false
  }
  const isLt50M = file.size / 1024 / 1024 < 50
  if (!isLt50M) {
    ElMessage.error('文件大小不能超过 50MB!')
    return false
  }
  return true
}

// 移除文件
const removeFile = (index) => {
  fileList.value.splice(index, 1)
}

const submitForm = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  
  submitting.value = true
  try {
    // 准备文件数据
    const files = fileList.value.map(item => item.raw)
    
    // 获取当前用户信息
    const userInfo = JSON.parse(localStorage.getItem('user') || '{}')
    
    const res = await submitArticleWithFiles({
      title: form.value.title,
      content: form.value.content,
      summary: form.value.summary,
      authorUsername: userInfo.username || '匿名用户',
      authorEmail: userInfo.email
    }, files, false)  // 使用JWT方式
    
    if (res.code === 200) {
      ElMessage.success(`投稿成功！${res.data.fileCount > 0 ? `上传了 ${res.data.fileCount} 个文件` : ''}`)
      form.value = {
        title: '',
        summary: '',
        content: ''
      }
      fileList.value = []
      uploadRef.value?.clearFiles()
      formRef.value?.clearValidate()
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

const goBack = () => {
  router.back()
}

onBeforeUnmount(() => {
  const editor = editorRef.value
  if (editor == null) return
  editor.destroy()
})
</script>

<style scoped>
.submit-article-view {
  padding: 20px 0;
}

.card-header {
  font-weight: bold;
}

.article-form {
  max-width: 900px;
}

.editor-wrapper {
  border: 1px solid #ccc;
  border-radius: 4px;
  overflow: hidden;
}

.upload-area {
  width: 100%;
}

.file-preview-section {
  margin-top: 20px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 4px;
}

.file-preview-section h4 {
  margin: 0 0 15px 0;
  color: #303133;
  font-size: 14px;
}

.file-list {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
}

.file-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
  background: #fff;
  border-radius: 4px;
  border: 1px solid #dcdfe6;
  width: 140px;
}

.file-info {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.file-name {
  font-size: 12px;
  color: #606266;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: center;
}

.file-size {
  font-size: 11px;
  color: #909399;
  margin-top: 4px;
}

.video-placeholder {
  width: 100px;
  height: 100px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  color: #909399;
  border-radius: 4px;
}

.video-placeholder span {
  margin-top: 5px;
  font-size: 12px;
}
</style>
