import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

const lottieAnimation = {
  destroy: vi.fn(),
  goToAndStop: vi.fn(),
  play: vi.fn()
}

vi.mock('lottie-web/build/player/esm/lottie_light.min.js', () => ({
  default: {
    loadAnimation: vi.fn(() => lottieAnimation)
  }
}))

import lottie from 'lottie-web/build/player/esm/lottie_light.min.js'
import TelegramStickerPreview from './TelegramStickerPreview.vue'

class VisibleIntersectionObserver {
  constructor(callback) {
    this.callback = callback
  }

  observe() {
    this.callback([{ isIntersecting: true }])
  }

  disconnect() {}
}

describe('TelegramStickerPreview', () => {
  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', VisibleIntersectionObserver)
    vi.stubGlobal('fetch', vi.fn())
    vi.spyOn(window.HTMLMediaElement.prototype, 'play').mockResolvedValue()
    vi.spyOn(window.HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
    lottie.loadAnimation.mockClear()
    lottieAnimation.destroy.mockClear()
    lottieAnimation.goToAndStop.mockClear()
    lottieAnimation.play.mockClear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders static WebP previews as images', () => {
    const wrapper = mount(TelegramStickerPreview, {
      props: {
        sticker: { format: 'STATIC', previewUrl: '/uploads/sticker.webp' },
        alt: '静态贴图'
      },
      global: { stubs: { 'el-icon': true } }
    })

    expect(wrapper.get('img').attributes('src')).toBe('/uploads/sticker.webp')
    expect(wrapper.get('img').attributes('alt')).toBe('静态贴图')
    expect(wrapper.find('video').exists()).toBe(false)
  })

  it('renders WebM previews as muted looping videos', () => {
    const wrapper = mount(TelegramStickerPreview, {
      props: {
        sticker: { format: 'VIDEO', previewUrl: '/uploads/sticker.webm' }
      },
      global: { stubs: { 'el-icon': true } }
    })

    const video = wrapper.get('video')
    expect(video.attributes('src')).toBe('/uploads/sticker.webm')
    expect(video.attributes()).toHaveProperty('loop')
    expect(video.attributes()).toHaveProperty('playsinline')
  })

  it('fetches TGS JSON and passes animation data to lottie', async () => {
    const animationData = { v: '5.7.4', layers: [] }
    fetch.mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue(animationData) })

    mount(TelegramStickerPreview, {
      props: {
        sticker: { format: 'ANIMATED', previewType: 'LOTTIE', previewUrl: '/uploads/sticker.json' },
        alwaysPlay: true
      },
      global: { stubs: { 'el-icon': true } }
    })
    await flushPromises()

    expect(fetch).toHaveBeenCalledWith('/uploads/sticker.json')
    expect(lottie.loadAnimation).toHaveBeenCalledWith(expect.objectContaining({
      renderer: 'svg',
      animationData
    }))
    expect(lottieAnimation.play).toHaveBeenCalled()
  })

  it('replaces a failed media preview with a visible error placeholder', async () => {
    const wrapper = mount(TelegramStickerPreview, {
      props: {
        sticker: { format: 'STATIC', previewUrl: '/uploads/missing.webp' }
      },
      global: { stubs: { 'el-icon': true } }
    })

    await wrapper.get('img').trigger('error')

    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.text()).toContain('预览加载失败')
    expect(wrapper.emitted('preview-error')).toHaveLength(1)
  })
})
