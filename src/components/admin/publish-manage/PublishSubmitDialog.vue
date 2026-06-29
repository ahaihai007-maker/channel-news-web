<script setup>
defineProps({
  form: { type: Object, required: true },
  fileList: { type: Array, required: true },
  submitting: { type: Boolean, required: true },
  isImage: { type: Function, required: true },
  getFileUrl: { type: Function, required: true }
})

const visible = defineModel('visible', { required: true })

defineEmits(['update:fileList', 'file-change', 'file-remove', 'remove-file', 'submit'])
</script>

<template>
  <el-dialog
    v-model="visible"
    title="快速投稿"
    width="700px"
    :close-on-click-modal="false"
  >
    <el-form :model="form" label-width="100px">
      <el-form-item label="认证方式" required>
        <el-radio-group v-model="form.authMode">
          <el-radio label="jwt">使用当前登录账号(JWT)</el-radio>
          <el-radio label="bot">使用Bot Token</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item v-if="form.authMode === 'bot'" label="Bot Token" required>
        <el-input
          v-model="form.botToken"
          placeholder="请输入Bot Token"
          type="password"
          show-password
        />
      </el-form-item>

      <el-form-item label="投稿类型" required>
        <el-select v-model="form.articleType" style="width: 100%">
          <el-option label="#付费广告" value="AD" />
          <el-option label="#网友投稿" value="SUBMISSION" />
          <el-option label="手动投稿（无标签）" value="MANUAL" />
        </el-select>
      </el-form-item>

      <el-form-item label="文章标题" required>
        <el-input v-model="form.title" placeholder="请输入标题" />
      </el-form-item>

      <el-form-item label="作者" required>
        <el-input v-model="form.authorUsername" placeholder="作者用户名" />
      </el-form-item>

      <el-form-item label="摘要">
        <el-input
          v-model="form.summary"
          type="textarea"
          :rows="2"
          placeholder="文章摘要（可选）"
        />
      </el-form-item>

      <el-form-item label="文章内容" required>
        <el-input
          v-model="form.content"
          type="textarea"
          :rows="8"
          placeholder="支持HTML格式"
        />
      </el-form-item>

      <el-form-item label="上传附件">
        <el-upload
          :file-list="fileList"
          action="#"
          :auto-upload="false"
          :on-change="file => $emit('file-change', file)"
          :on-remove="file => $emit('file-remove', file)"
          multiple
          drag
          @update:file-list="$emit('update:fileList', $event)"
        >
          <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
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

      <el-form-item v-if="fileList.length > 0" label="已选文件">
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
              @click="$emit('remove-file', index)"
            >
              删除
            </el-button>
          </div>
        </div>
      </el-form-item>
    </el-form>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="$emit('submit')">
          提交投稿
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<style scoped>
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
</style>
