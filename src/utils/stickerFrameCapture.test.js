import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  StickerFrameCaptureError,
  capturePositionsForSticker,
  captureStickerFrames,
  dataUrlByteLength,
  waitForAnimationPaint
} from './stickerFrameCapture.js'

const lottieMocks = vi.hoisted(() => ({
  animation: {
    destroy: vi.fn(),
    goToAndStop: vi.fn(),
    isLoaded: true,
    totalFrames: 100
  },
  loadAnimation: vi.fn()
}))

vi.mock('lottie-web/build/player/esm/lottie_light.min.js', () => ({
  default: { loadAnimation: lottieMocks.loadAnimation }
}))

class LoadedImage extends EventTarget {
  naturalWidth = 256
  naturalHeight = 128

  set src(_value) {
    queueMicrotask(() => this.dispatchEvent(new Event('load')))
  }
}

describe('stickerFrameCapture', () => {
  beforeEach(() => {
    vi.stubGlobal('Image', LoadedImage)
    vi.spyOn(window.HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      fillStyle: '',
      fillRect: vi.fn(),
      drawImage: vi.fn()
    })
    vi.spyOn(window.HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback) => {
      callback(new Blob([new Uint8Array(128)], { type: 'image/png' }))
    })
    lottieMocks.animation.destroy.mockClear()
    lottieMocks.animation.goToAndStop.mockClear()
    lottieMocks.loadAnimation.mockImplementation(({ container }) => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      svg.setAttribute('width', '512')
      svg.setAttribute('height', '512')
      container.appendChild(svg)
      return lottieMocks.animation
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('uses one frame for static stickers and three representative frames for animation', () => {
    expect(capturePositionsForSticker({ format: 'STATIC' })).toEqual([0])
    expect(capturePositionsForSticker({ format: 'VIDEO' })).toEqual([0.2, 0.5, 0.8])
    expect(capturePositionsForSticker({ format: 'ANIMATED' })).toEqual([0.2, 0.5, 0.8])
  })

  it('finishes after two animation frames and clears the fallback timer', async () => {
    vi.useFakeTimers()
    const callbacks = []
    vi.stubGlobal('requestAnimationFrame', vi.fn((callback) => {
      callbacks.push(callback)
      return callbacks.length
    }))
    vi.stubGlobal('cancelAnimationFrame', vi.fn())

    const painted = waitForAnimationPaint()
    expect(callbacks).toHaveLength(1)
    callbacks.shift()(0)
    expect(callbacks).toHaveLength(1)
    callbacks.shift()(16)
    await painted

    expect(vi.getTimerCount()).toBe(0)
  })

  it('uses the bounded fallback and cancels a stalled animation frame in a background page', async () => {
    vi.useFakeTimers()
    vi.stubGlobal('requestAnimationFrame', vi.fn(() => 91))
    const cancelAnimationFrame = vi.fn()
    vi.stubGlobal('cancelAnimationFrame', cancelAnimationFrame)

    const painted = waitForAnimationPaint()
    await vi.advanceTimersByTimeAsync(100)
    await painted

    expect(cancelAnimationFrame).toHaveBeenCalledWith(91)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('captures a static preview into one bounded PNG data URL', async () => {
    const frames = await captureStickerFrames({ format: 'STATIC', previewUrl: '/uploads/sticker.webp' })

    expect(frames).toHaveLength(1)
    expect(frames[0]).toMatch(/^data:image\/png;base64,/)
    expect(dataUrlByteLength(frames[0])).toBe(128)
  })

  it('seeks and captures three representative frames from a WebM preview', async () => {
    const currentTimeSetter = vi.spyOn(window.HTMLMediaElement.prototype, 'currentTime', 'set')
      .mockImplementation(function () {
        queueMicrotask(() => this.dispatchEvent(new Event('seeked')))
      })
    vi.spyOn(window.HTMLMediaElement.prototype, 'duration', 'get').mockReturnValue(10)
    vi.spyOn(window.HTMLVideoElement.prototype, 'videoWidth', 'get').mockReturnValue(512)
    vi.spyOn(window.HTMLVideoElement.prototype, 'videoHeight', 'get').mockReturnValue(512)
    vi.spyOn(window.HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
    vi.spyOn(window.HTMLMediaElement.prototype, 'load').mockImplementation(function () {
      queueMicrotask(() => this.dispatchEvent(new Event('loadedmetadata')))
    })

    const frames = await captureStickerFrames({ format: 'VIDEO', previewUrl: '/uploads/sticker.webm' })

    expect(frames).toHaveLength(3)
    expect(currentTimeSetter).toHaveBeenCalledTimes(3)
    expect(frames.every((frame) => frame.startsWith('data:image/png;base64,'))).toBe(true)
  })

  it('renders and captures three representative frames from a TGS preview', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ v: '5.7.4', layers: [] })
    }))
    const originalCreateObjectUrl = URL.createObjectURL
    const originalRevokeObjectUrl = URL.revokeObjectURL
    URL.createObjectURL = vi.fn(() => 'blob:sticker-frame')
    URL.revokeObjectURL = vi.fn()

    try {
      const frames = await captureStickerFrames({ format: 'ANIMATED', previewUrl: '/uploads/sticker.json' })

      expect(frames).toHaveLength(3)
      expect(lottieMocks.loadAnimation).toHaveBeenCalledWith(expect.objectContaining({ renderer: 'svg' }))
      expect(lottieMocks.animation.goToAndStop.mock.calls.map(([frame]) => frame)).toEqual([20, 50, 79])
      expect(lottieMocks.animation.destroy).toHaveBeenCalledTimes(1)
      expect(URL.revokeObjectURL).toHaveBeenCalledTimes(3)
    } finally {
      if (originalCreateObjectUrl) URL.createObjectURL = originalCreateObjectUrl
      else delete URL.createObjectURL
      if (originalRevokeObjectUrl) URL.revokeObjectURL = originalRevokeObjectUrl
      else delete URL.revokeObjectURL
    }
  })

  it('rejects stickers without a supported preview source', async () => {
    await expect(captureStickerFrames({ format: 'STATIC' })).rejects.toMatchObject({
      name: 'StickerFrameCaptureError',
      code: 'PREVIEW_MISSING'
    })
    await expect(captureStickerFrames({ format: 'UNKNOWN', previewUrl: '/uploads/sticker.bin' }))
      .rejects.toEqual(expect.any(StickerFrameCaptureError))
  })
})
