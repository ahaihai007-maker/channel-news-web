const FRAME_POSITIONS = Object.freeze([0.2, 0.5, 0.8])
const DEFAULT_FRAME_SIZE = 512
const MIN_FRAME_SIZE = 128
const MAX_FRAME_BYTES = 1_000_000
const MAX_TOTAL_BYTES = 3_000_000
const LOAD_TIMEOUT_MS = 15_000
const PAINT_FALLBACK_MS = 100
const FRAME_BACKGROUND = '#e5e7eb'

export class StickerFrameCaptureError extends Error {
  constructor(message, code) {
    super(message)
    this.name = 'StickerFrameCaptureError'
    this.code = code
  }
}

const previewUrlOf = (sticker) => sticker?.previewUrl || sticker?.preview_url || ''
const stickerFormatOf = (sticker) => String(sticker?.format || '').toUpperCase()

export const capturePositionsForSticker = (sticker) => (
  stickerFormatOf(sticker) === 'STATIC' ? [0] : [...FRAME_POSITIONS]
)

export const dataUrlByteLength = (dataUrl) => {
  const base64 = String(dataUrl || '').split(',', 2)[1] || ''
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0
  return Math.max(0, Math.floor((base64.length * 3) / 4) - padding)
}

const withTimeout = (promise, message) => {
  let timeoutId
  const timeout = new Promise((_, reject) => {
    timeoutId = window.setTimeout(() => {
      reject(new StickerFrameCaptureError(message, 'LOAD_TIMEOUT'))
    }, LOAD_TIMEOUT_MS)
  })
  return Promise.race([promise, timeout]).finally(() => window.clearTimeout(timeoutId))
}

const waitForEvent = (target, eventName, errorMessage) => withTimeout(new Promise((resolve, reject) => {
  const cleanup = () => {
    target.removeEventListener(eventName, handleSuccess)
    target.removeEventListener('error', handleError)
  }
  const handleSuccess = () => {
    cleanup()
    resolve()
  }
  const handleError = () => {
    cleanup()
    reject(new StickerFrameCaptureError(errorMessage, 'PREVIEW_LOAD_FAILED'))
  }
  target.addEventListener(eventName, handleSuccess, { once: true })
  target.addEventListener('error', handleError, { once: true })
}), errorMessage)

const blobToDataUrl = (blob) => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => resolve(String(reader.result || ''))
  reader.onerror = () => reject(new StickerFrameCaptureError('贴图画面编码失败', 'FRAME_ENCODE_FAILED'))
  reader.readAsDataURL(blob)
})

const canvasToPngBlob = (canvas) => new Promise((resolve, reject) => {
  canvas.toBlob((blob) => {
    if (blob) resolve(blob)
    else reject(new StickerFrameCaptureError('贴图画面编码失败', 'FRAME_ENCODE_FAILED'))
  }, 'image/png')
})

const sourceSize = (source) => ({
  width: source.naturalWidth || source.videoWidth || source.width || DEFAULT_FRAME_SIZE,
  height: source.naturalHeight || source.videoHeight || source.height || DEFAULT_FRAME_SIZE
})

const renderContained = (source, size) => {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext('2d', { alpha: false })
  if (!context) throw new StickerFrameCaptureError('浏览器不支持画面抽取', 'CANVAS_UNAVAILABLE')

  context.fillStyle = FRAME_BACKGROUND
  context.fillRect(0, 0, size, size)
  const sourceDimensions = sourceSize(source)
  const scale = Math.min(size / sourceDimensions.width, size / sourceDimensions.height)
  const width = Math.max(1, Math.round(sourceDimensions.width * scale))
  const height = Math.max(1, Math.round(sourceDimensions.height * scale))
  context.drawImage(source, Math.round((size - width) / 2), Math.round((size - height) / 2), width, height)
  return canvas
}

const encodeBoundedFrame = async (source) => {
  let size = DEFAULT_FRAME_SIZE
  while (size >= MIN_FRAME_SIZE) {
    const canvas = renderContained(source, size)
    const blob = await canvasToPngBlob(canvas)
    if (blob.size <= MAX_FRAME_BYTES) return blobToDataUrl(blob)
    size = Math.floor(size * 0.75)
  }
  throw new StickerFrameCaptureError('贴图画面超过 1 MB 限制', 'FRAME_TOO_LARGE')
}

const loadImage = async (url) => {
  const image = new Image()
  image.crossOrigin = 'anonymous'
  const loaded = waitForEvent(image, 'load', '静态贴图加载失败')
  image.src = url
  await loaded
  return image
}

const captureStatic = async (url) => {
  const image = await loadImage(url)
  return [await encodeBoundedFrame(image)]
}

const createHiddenElement = (tagName) => {
  const element = document.createElement(tagName)
  Object.assign(element.style, {
    position: 'fixed',
    left: '-10000px',
    top: '0',
    width: `${DEFAULT_FRAME_SIZE}px`,
    height: `${DEFAULT_FRAME_SIZE}px`,
    pointerEvents: 'none',
    opacity: '0'
  })
  document.body.appendChild(element)
  return element
}

const captureVideo = async (url) => {
  const video = createHiddenElement('video')
  video.crossOrigin = 'anonymous'
  video.muted = true
  video.playsInline = true
  video.preload = 'auto'

  try {
    const metadataLoaded = waitForEvent(video, 'loadedmetadata', '视频贴图加载失败')
    video.src = url
    video.load()
    await metadataLoaded
    if (!Number.isFinite(video.duration) || video.duration <= 0) {
      throw new StickerFrameCaptureError('视频贴图时长无效', 'INVALID_VIDEO_DURATION')
    }

    const frames = []
    for (const position of FRAME_POSITIONS) {
      const seeked = waitForEvent(video, 'seeked', '视频贴图抽帧失败')
      video.currentTime = Math.max(0, Math.min(video.duration - 0.001, video.duration * position))
      await seeked
      frames.push(await encodeBoundedFrame(video))
    }
    return frames
  } finally {
    video.pause()
    video.removeAttribute('src')
    video.load()
    video.remove()
  }
}

const waitForLottieReady = (animation) => {
  if (animation.isLoaded) return Promise.resolve()
  return withTimeout(new Promise((resolve, reject) => {
    const cleanup = () => {
      animation.removeEventListener?.('DOMLoaded', handleReady)
      animation.removeEventListener?.('data_failed', handleFailure)
    }
    const handleReady = () => {
      cleanup()
      resolve()
    }
    const handleFailure = () => {
      cleanup()
      reject(new StickerFrameCaptureError('动画贴图加载失败', 'PREVIEW_LOAD_FAILED'))
    }
    animation.addEventListener('DOMLoaded', handleReady)
    animation.addEventListener('data_failed', handleFailure)
  }), '动画贴图加载超时')
}

export const waitForAnimationPaint = () => new Promise((resolve) => {
  let settled = false
  let firstFrameId = null
  let secondFrameId = null
  let fallbackTimerId = null

  const cancelFrame = typeof window.cancelAnimationFrame === 'function'
    ? window.cancelAnimationFrame.bind(window)
    : null
  const finish = () => {
    if (settled) return
    settled = true
    if (fallbackTimerId !== null) window.clearTimeout(fallbackTimerId)
    if (cancelFrame && firstFrameId !== null) cancelFrame(firstFrameId)
    if (cancelFrame && secondFrameId !== null) cancelFrame(secondFrameId)
    resolve()
  }

  fallbackTimerId = window.setTimeout(() => {
    fallbackTimerId = null
    finish()
  }, PAINT_FALLBACK_MS)
  if (typeof window.requestAnimationFrame !== 'function') return

  firstFrameId = window.requestAnimationFrame(() => {
    firstFrameId = null
    if (settled) return
    secondFrameId = window.requestAnimationFrame(() => {
      secondFrameId = null
      finish()
    })
  })
})

const captureLottie = async (url) => {
  const response = await fetch(url, { credentials: 'same-origin' })
  if (!response.ok) throw new StickerFrameCaptureError(`动画贴图加载失败（HTTP ${response.status}）`, 'PREVIEW_LOAD_FAILED')
  const animationData = await response.json()
  const host = createHiddenElement('div')
  let animation

  try {
    const { default: lottie } = await import('lottie-web/build/player/esm/lottie_light.min.js')
    animation = lottie.loadAnimation({
      container: host,
      renderer: 'svg',
      loop: false,
      autoplay: false,
      animationData,
      rendererSettings: {
        preserveAspectRatio: 'xMidYMid meet'
      }
    })
    await waitForLottieReady(animation)
    if (!host.querySelector('svg') || !animation.totalFrames) {
      throw new StickerFrameCaptureError('动画贴图没有可用画面', 'EMPTY_ANIMATION')
    }

    const frames = []
    for (const position of FRAME_POSITIONS) {
      const frame = Math.max(0, Math.round((animation.totalFrames - 1) * position))
      animation.goToAndStop(frame, true)
      await waitForAnimationPaint()
      const svg = host.querySelector('svg')
      const serialized = new XMLSerializer().serializeToString(svg)
      const blobUrl = URL.createObjectURL(new Blob([serialized], { type: 'image/svg+xml;charset=utf-8' }))
      try {
        frames.push(await encodeBoundedFrame(await loadImage(blobUrl)))
      } finally {
        URL.revokeObjectURL(blobUrl)
      }
    }
    return frames
  } finally {
    animation?.destroy()
    host.remove()
  }
}

const assertFrameLimits = (frames) => {
  if (frames.length < 1 || frames.length > 3) {
    throw new StickerFrameCaptureError('贴图画面数量必须为 1 至 3 张', 'INVALID_FRAME_COUNT')
  }
  const byteLengths = frames.map(dataUrlByteLength)
  if (byteLengths.some((size) => size > MAX_FRAME_BYTES)) {
    throw new StickerFrameCaptureError('单张贴图画面超过 1 MB 限制', 'FRAME_TOO_LARGE')
  }
  if (byteLengths.reduce((total, size) => total + size, 0) > MAX_TOTAL_BYTES) {
    throw new StickerFrameCaptureError('贴图画面合计超过 3 MB 限制', 'FRAMES_TOO_LARGE')
  }
  return frames
}

export const captureStickerFrames = async (sticker) => {
  const previewUrl = previewUrlOf(sticker)
  if (!previewUrl) throw new StickerFrameCaptureError('贴图没有可用预览', 'PREVIEW_MISSING')

  const format = stickerFormatOf(sticker)
  let frames
  if (format === 'STATIC') frames = await captureStatic(previewUrl)
  else if (format === 'VIDEO') frames = await captureVideo(previewUrl)
  else if (format === 'ANIMATED') frames = await captureLottie(previewUrl)
  else throw new StickerFrameCaptureError(`不支持的贴图格式：${format || 'UNKNOWN'}`, 'UNSUPPORTED_FORMAT')

  return assertFrameLimits(frames)
}
