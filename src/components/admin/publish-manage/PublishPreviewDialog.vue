<script setup>
defineProps({
  article: { type: Object, default: null },
  imageFiles: { type: Array, required: true },
  videoFiles: { type: Array, required: true },
  getTypeLabel: { type: Function, required: true },
  getFileViewUrl: { type: Function, required: true },
  formatTelegramTime: { type: Function, required: true }
})

const visible = defineModel('visible', { required: true })

defineEmits(['preview-image', 'publish'])
</script>

<template>
  <el-dialog
    v-model="visible"
    title="文章预览"
    width="600px"
    class="article-preview-dialog telegram-style"
    :close-on-click-modal="false"
  >
    <div v-if="article" class="telegram-message-preview">
      <div class="telegram-message-bubble">
        <div class="telegram-author">
          <span class="author-name">{{ article.authorName || '匿名' }}</span>
          <span v-if="article.articleType" class="author-badge">{{ getTypeLabel(article.articleType) }}</span>
        </div>

        <h3 class="telegram-title">{{ article.title }}</h3>

        <div v-if="article.files && article.files.length > 0" class="telegram-media">
          <div v-if="imageFiles.length > 0" class="telegram-image-grid" :class="'grid-' + Math.min(imageFiles.length, 4)">
            <div
              v-for="(file, index) in imageFiles.slice(0, 4)"
              :key="'img-' + index"
              class="telegram-image-item"
              @click="$emit('preview-image', index)"
            >
              <el-image :src="getFileViewUrl(file.url)" fit="cover" class="telegram-image" />
              <div v-if="index === 3 && imageFiles.length > 4" class="image-more-overlay">
                <span>+{{ imageFiles.length - 4 }}</span>
              </div>
            </div>
          </div>

          <div v-if="videoFiles.length > 0" class="telegram-video-list">
            <div
              v-for="(file, index) in videoFiles"
              :key="'video-' + index"
              class="telegram-video-item"
            >
              <video :src="getFileViewUrl(file.url)" controls class="telegram-video" />
            </div>
          </div>
        </div>

        <div class="telegram-content" v-html="article.content"></div>

        <div class="telegram-meta">
          <span class="telegram-time">{{ formatTelegramTime(article.createdAt) }}</span>
          <el-icon class="telegram-status" :size="14" color="#67C23A"><Check /></el-icon>
        </div>
      </div>

      <div v-if="article.status === 'APPROVED'" class="telegram-actions">
        <el-button type="primary" size="large" @click="$emit('publish', article)">
          <el-icon><Promotion /></el-icon>
          发布到频道
        </el-button>
      </div>
    </div>
  </el-dialog>
</template>

<style scoped>
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

.telegram-media {
  margin-bottom: 12px;
}

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

:deep(.telegram-style .el-dialog__body) {
  padding: 0;
}

:deep(.telegram-style .el-dialog__header) {
  background: #ffffff;
  border-bottom: 1px solid #e4e4e4;
  margin-right: 0;
  padding: 16px 20px;
}
</style>
