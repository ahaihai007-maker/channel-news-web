<template>
  <div
    ref="containerRef"
    class="sticker-preview"
    :class="{ 'is-failed': failed }"
    @mouseenter="hovered = true"
    @mouseleave="hovered = false"
  >
    <img
      v-if="previewKind === 'image' && previewUrl && !failed"
      :src="previewUrl"
      :alt="alt"
      loading="lazy"
      @error="markFailed"
    />
    <video
      v-else-if="previewKind === 'video' && previewUrl && !failed"
      ref="videoRef"
      :src="previewUrl"
      :aria-label="alt"
      muted
      loop
      playsinline
      preload="metadata"
      @error="markFailed"
    />
    <div v-else-if="previewKind === 'lottie' && previewUrl && !failed" ref="lottieRef" class="lottie-canvas" />
    <div v-else class="preview-placeholder">
      <el-icon><Picture /></el-icon>
      <span>{{ failed ? '预览加载失败' : '暂无预览' }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Picture } from '@element-plus/icons-vue'
import lottie from 'lottie-web/build/player/esm/lottie_light.min.js'

const props = defineProps({
  sticker: {
    type: Object,
    required: true
  },
  alwaysPlay: {
    type: Boolean,
    default: false
  },
  alt: {
    type: String,
    default: 'Telegram 贴图预览'
  }
})

const emit = defineEmits(['preview-error'])

const containerRef = ref(null)
const videoRef = ref(null)
const lottieRef = ref(null)
const isVisible = ref(false)
const hovered = ref(false)
const failed = ref(false)
let observer = null
let animation = null
let loadGeneration = 0

const previewUrl = computed(() => props.sticker.previewUrl || props.sticker.preview_url || '')
const format = computed(() => String(props.sticker.format || '').toUpperCase())
const previewType = computed(() => String(props.sticker.previewType || props.sticker.preview_type || '').toUpperCase())
const shouldPlay = computed(() => isVisible.value && (props.alwaysPlay || hovered.value))

const previewKind = computed(() => {
  if (format.value === 'ANIMATED' || previewType.value === 'LOTTIE' || previewType.value === 'JSON') return 'lottie'
  if (format.value === 'VIDEO' || previewType.value === 'VIDEO' || previewUrl.value.toLowerCase().endsWith('.webm')) return 'video'
  if (previewUrl.value) return 'image'
  return 'none'
})

const markFailed = () => {
  failed.value = true
  emit('preview-error', props.sticker)
}

const destroyAnimation = () => {
  loadGeneration += 1
  if (animation) {
    animation.destroy()
    animation = null
  }
}

const loadLottie = async () => {
  if (previewKind.value !== 'lottie' || !previewUrl.value || !isVisible.value || failed.value) return
  destroyAnimation()
  const generation = loadGeneration

  try {
    const response = await fetch(previewUrl.value)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const animationData = await response.json()
    if (generation !== loadGeneration) return
    await nextTick()
    if (!lottieRef.value) return
    animation = lottie.loadAnimation({
      container: lottieRef.value,
      renderer: 'svg',
      loop: true,
      autoplay: false,
      animationData
    })
    if (shouldPlay.value) animation.play()
    else animation.goToAndStop(0, true)
  } catch {
    if (generation === loadGeneration) markFailed()
  }
}

const syncPlayback = () => {
  if (videoRef.value) {
    if (shouldPlay.value) videoRef.value.play().catch(() => {})
    else videoRef.value.pause()
  }
  if (animation) {
    if (shouldPlay.value) animation.play()
    else animation.goToAndStop(0, true)
  }
}

watch(shouldPlay, syncPlayback)
watch([previewUrl, previewKind], () => {
  failed.value = false
  destroyAnimation()
  if (previewKind.value === 'lottie') loadLottie()
})
watch(isVisible, (visible) => {
  if (visible && previewKind.value === 'lottie' && !animation) loadLottie()
  syncPlayback()
})

onMounted(() => {
  if (typeof IntersectionObserver === 'undefined') {
    isVisible.value = true
    return
  }
  observer = new IntersectionObserver(([entry]) => {
    isVisible.value = entry.isIntersecting
  }, { rootMargin: '100px' })
  observer.observe(containerRef.value)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  destroyAnimation()
})
</script>

<style scoped>
.sticker-preview {
  position: relative;
  display: grid;
  width: 100%;
  height: 100%;
  min-height: 120px;
  place-items: center;
  overflow: hidden;
  border-radius: 8px;
  background: linear-gradient(135deg, #f8fafc, #eef2f7);
}

.sticker-preview img,
.sticker-preview video,
.lottie-canvas {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.lottie-canvas :deep(svg) {
  display: block;
  width: 100% !important;
  height: 100% !important;
}

.preview-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #9ca3af;
  font-size: 12px;
}

.preview-placeholder .el-icon {
  font-size: 28px;
}

.is-failed {
  background: #fef2f2;
}
</style>
