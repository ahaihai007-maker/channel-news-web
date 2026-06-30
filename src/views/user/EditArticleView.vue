<template>
  <div class="edit-article-view">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>编辑稿件</span>
        </div>
      </template>
      
      <el-form 
        ref="formRef" 
        :model="form" 
        :rules="rules" 
        label-width="80px"
        class="article-form"
        v-loading="loading"
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
        
        <el-form-item>
          <el-button type="primary" @click="submitForm" :loading="submitting">
            保存修改
          </el-button>
          <el-button @click="goBack">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, shallowRef, onBeforeUnmount, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import { getArticleDetail, updateArticle } from '@/services/api.js'
import { ElMessage } from 'element-plus'
import '@wangeditor/editor/dist/css/style.css'

const router = useRouter()
const route = useRoute()
const formRef = ref(null)
const editorRef = shallowRef()
const submitting = ref(false)
const loading = ref(false)

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

const fetchArticle = async () => {
  const id = route.params.id
  if (!id) {
    ElMessage.error('文章ID不存在')
    return
  }
  
  loading.value = true
  try {
    const res = await getArticleDetail(id)
    if (res.code === 200) {
      form.value = {
        title: res.data.title,
        summary: res.data.summary || '',
        content: res.data.content
      }
    } else {
      ElMessage.error(res.message || '获取文章失败')
    }
  } catch (error) {
    ElMessage.error('获取文章详情失败')
  } finally {
    loading.value = false
  }
}

const submitForm = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  
  submitting.value = true
  try {
    const res = await updateArticle(route.params.id, form.value)
    if (res.code === 200) {
      ElMessage.success('更新成功')
      router.push('/user/article/create')
    }
  } catch (error) {
    ElMessage.error('更新失败')
  } finally {
    submitting.value = false
  }
}

const goBack = () => {
  router.back()
}

onMounted(() => {
  fetchArticle()
})

onBeforeUnmount(() => {
  const editor = editorRef.value
  if (editor == null) return
  editor.destroy()
})
</script>

<style scoped>
.edit-article-view {
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
</style>
