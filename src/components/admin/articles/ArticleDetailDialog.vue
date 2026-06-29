<script setup>
defineProps({
  article: { type: Object, default: null },
  getStatusType: { type: Function, required: true },
  getStatusText: { type: Function, required: true },
  formatDate: { type: Function, required: true },
  formatFileSize: { type: Function, required: true },
  getFullFileUrl: { type: Function, required: true }
})

const visible = defineModel('visible', { required: true })
</script>

<template>
  <el-dialog
    v-model="visible"
    title="文章详情"
    width="800px"
    class="article-detail-dialog"
  >
    <div v-if="article" class="article-detail">
      <h3>{{ article.title }}</h3>
      <div class="article-meta">
        <span>作者: {{ article.authorName }}</span>
        <span>状态: <el-tag :type="getStatusType(article.status)">{{ getStatusText(article.status) }}</el-tag></span>
        <span>浏览量: {{ article.viewCount || 0 }}</span>
        <span>创建时间: {{ formatDate(article.createdAt) }}</span>
      </div>

      <div v-if="article.coverImage" class="article-cover">
        <img :src="article.coverImage" alt="封面" />
      </div>

      <div class="article-content" v-html="article.content"></div>

      <div v-if="article.summary" class="article-summary">
        <strong>摘要:</strong> {{ article.summary }}
      </div>

      <div v-if="article.files && article.files.length > 0" class="article-files">
        <h4>附件 ({{ article.files.length }}个)</h4>
        <div class="files-grid">
          <div v-for="(file, index) in article.files" :key="index" class="file-item">
            <el-image
              v-if="file.fileType === 'image'"
              :src="getFullFileUrl(file.url)"
              fit="cover"
              :preview-src-list="article.files.filter(f => f.fileType === 'image').map(f => getFullFileUrl(f.url))"
              style="width: 150px; height: 150px; cursor: pointer;"
            />

            <div v-else-if="file.fileType === 'video'" class="video-container">
              <video
                :src="getFullFileUrl(file.url)"
                controls
                style="width: 300px; max-height: 200px;"
              />
            </div>

            <div v-else class="other-file">
              <el-icon size="40"><Document /></el-icon>
              <span class="file-name">{{ file.originalName || file.fileName }}</span>
            </div>

            <div class="file-info">
              <span class="file-type-tag">{{ file.fileType === 'image' ? '图片' : file.fileType === 'video' ? '视频' : '文件' }}</span>
              <span v-if="file.fileSize" class="file-size">{{ formatFileSize(file.fileSize) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<style scoped>
.article-detail {
  padding: 20px;
}

.article-detail h3 {
  margin-bottom: 15px;
  font-size: 20px;
}

.article-meta {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  color: #666;
  font-size: 14px;
}

.article-cover {
  margin-bottom: 20px;
}

.article-cover img {
  max-width: 100%;
  max-height: 300px;
  border-radius: 8px;
}

.article-content {
  line-height: 1.8;
  margin-bottom: 20px;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
}

.article-summary {
  padding: 15px;
  background: #ecf5ff;
  border-radius: 8px;
  font-size: 14px;
}

.article-files {
  margin-top: 20px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 8px;
}

.article-files h4 {
  margin: 0 0 15px 0;
  color: #303133;
}

.files-grid {
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
}

.file-info {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.file-type-tag {
  font-size: 12px;
  padding: 2px 8px;
  background: #ecf5ff;
  color: #409eff;
  border-radius: 4px;
}

.file-size {
  font-size: 12px;
  color: #909399;
}

.other-file {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 150px;
  height: 150px;
  color: #909399;
}

.other-file .file-name {
  margin-top: 8px;
  font-size: 12px;
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: center;
}
</style>
