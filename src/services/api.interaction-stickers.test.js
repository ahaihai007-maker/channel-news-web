import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./request.js', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn()
  }
}))

import request from './request.js'
import { interactionStickerApi } from './api.js'

describe('interactionStickerApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('imports and synchronizes Telegram sticker sets through admin endpoints', () => {
    interactionStickerApi.importSet({ sourceUrl: 'https://t.me/addstickers/example' })
    interactionStickerApi.syncLibrary(7)

    expect(request.post).toHaveBeenNthCalledWith(1, '/admin/interaction-sticker-libraries/import', {
      sourceUrl: 'https://t.me/addstickers/example'
    })
    expect(request.post).toHaveBeenNthCalledWith(2, '/admin/interaction-sticker-libraries/7/sync')
  })

  it('loads and updates library and sticker records', () => {
    interactionStickerApi.getLibraries()
    interactionStickerApi.getLibrary(4)
    interactionStickerApi.updateLibrary(4, { displayName: '测试库' })
    interactionStickerApi.updateSticker(12, { displayName: '无语', enabled: true })

    expect(request.get).toHaveBeenNthCalledWith(1, '/admin/interaction-sticker-libraries')
    expect(request.get).toHaveBeenNthCalledWith(2, '/admin/interaction-sticker-libraries/4')
    expect(request.put).toHaveBeenNthCalledWith(1, '/admin/interaction-sticker-libraries/4', { displayName: '测试库' })
    expect(request.put).toHaveBeenNthCalledWith(2, '/admin/interaction-sticker-libraries/items/12', {
      displayName: '无语',
      enabled: true
    })
  })

  it('loads analysis settings and sends captured frames for one sticker', () => {
    const frames = ['data:image/png;base64,AAAA']

    interactionStickerApi.getAnalysisConfig()
    interactionStickerApi.updateAnalysisConfig({ modelId: 'provider/vision-model' })
    interactionStickerApi.analyzeSticker(12, {
      frames,
      applyMode: 'FILL_MISSING',
      expectedUpdatedAt: '2026-07-18T10:00:00'
    })

    expect(request.get).toHaveBeenCalledWith('/admin/interaction-sticker-libraries/analysis-config')
    expect(request.put).toHaveBeenCalledWith('/admin/interaction-sticker-libraries/analysis-config', {
      modelId: 'provider/vision-model'
    })
    expect(request.post).toHaveBeenCalledWith('/admin/interaction-sticker-libraries/items/12/analyze', {
      frames,
      applyMode: 'FILL_MISSING',
      expectedUpdatedAt: '2026-07-18T10:00:00'
    })
  })
})
