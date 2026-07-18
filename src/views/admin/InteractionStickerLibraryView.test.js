import { h } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

const apiMocks = vi.hoisted(() => ({
  archiveLibrary: vi.fn(),
  analyzeSticker: vi.fn(),
  getAnalysisConfig: vi.fn(),
  getLibraries: vi.fn(),
  getLibrary: vi.fn(),
  importSet: vi.fn(),
  syncLibrary: vi.fn(),
  updateAnalysisConfig: vi.fn(),
  updateLibrary: vi.fn(),
  updateSticker: vi.fn()
}))

const captureMocks = vi.hoisted(() => ({
  captureStickerFrames: vi.fn()
}))

const messageMocks = vi.hoisted(() => ({
  error: vi.fn(),
  success: vi.fn(),
  warning: vi.fn()
}))

const confirmMock = vi.hoisted(() => vi.fn())

vi.mock('../../services/api.js', () => ({
  interactionStickerApi: apiMocks
}))

vi.mock('element-plus', () => ({
  ElMessage: messageMocks,
  ElMessageBox: { confirm: confirmMock }
}))

vi.mock('../../utils/stickerFrameCapture.js', () => captureMocks)

vi.mock('../../components/admin/interaction-stickers/TelegramStickerPreview.vue', () => ({
  default: { name: 'TelegramStickerPreview', template: '<div data-testid="sticker-preview" />' }
}))

import InteractionStickerLibraryView from './InteractionStickerLibraryView.vue'

const ElInputStub = {
  props: {
    modelValue: { type: String, default: '' },
    placeholder: { type: String, default: '' }
  },
  emits: ['update:modelValue'],
  template: `
    <input
      :value="modelValue"
      :placeholder="placeholder"
      @input="$emit('update:modelValue', $event.target.value)"
    >
  `
}

const ElButtonStub = {
  props: {
    disabled: Boolean,
    loading: Boolean
  },
  emits: ['click'],
  template: '<button :disabled="disabled" @click="$emit(\'click\')"><slot /></button>'
}

const passthroughStub = {
  setup(_props, { slots }) {
    return () => h('section', {}, [slots.header?.(), slots.default?.(), slots.footer?.()])
  }
}

const mountView = () => mount(InteractionStickerLibraryView, {
  global: {
    directives: { loading: () => {} },
    stubs: {
      TelegramStickerPreview: true,
      'el-alert': passthroughStub,
      'el-button': ElButtonStub,
      'el-card': passthroughStub,
      'el-dialog': passthroughStub,
      'el-drawer': passthroughStub,
      'el-empty': true,
      'el-form': passthroughStub,
      'el-form-item': passthroughStub,
      'el-input': ElInputStub,
      'el-progress': true,
      'el-radio-button': true,
      'el-radio-group': true,
      'el-select': true,
      'el-switch': true,
      'el-tag': true
    }
  }
})

const importButton = (wrapper) => wrapper
  .findAll('button')
  .find((button) => button.text() === '解析并导入')

describe('InteractionStickerLibraryView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    confirmMock.mockResolvedValue()
    captureMocks.captureStickerFrames.mockResolvedValue(['data:image/png;base64,AAAA'])
    apiMocks.getAnalysisConfig.mockResolvedValue({
      code: 200,
      data: { modelId: 'provider/vision-model', apiKeyConfigured: true }
    })
    apiMocks.getLibraries.mockResolvedValue({ code: 200, data: { libraries: [] } })
    apiMocks.getLibrary.mockResolvedValue({
      code: 200,
      data: {
        library: {
          id: 7,
          displayName: '果果贴图',
          sourceSetName: 'guoguo777899',
          sourceUrl: 'https://t.me/addstickers/guoguo777899',
          status: 'DRAFT'
        },
        stickers: []
      }
    })
  })

  it.each([
    'http://t.me/addstickers/guoguo777899',
    'https://telegram.me/addstickers/guoguo777899',
    'https://t.me/addstickers/guoguo777899?start=1',
    'https://t.me/guoguo777899'
  ])('rejects a non-canonical addstickers URL: %s', async (url) => {
    const wrapper = mountView()
    await flushPromises()

    await wrapper.get('input[placeholder="https://t.me/addstickers/guoguo777899"]').setValue(url)
    await importButton(wrapper).trigger('click')

    expect(apiMocks.importSet).not.toHaveBeenCalled()
    expect(messageMocks.warning).toHaveBeenCalledWith('请输入有效的 Telegram addstickers 链接')
  })

  it('imports a canonical link, refreshes the list, selects the result, and reports success', async () => {
    apiMocks.importSet.mockResolvedValue({ code: 200, data: { id: 7 } })
    apiMocks.getLibraries
      .mockResolvedValueOnce({ code: 200, data: { libraries: [] } })
      .mockResolvedValueOnce({
        code: 200,
        data: {
          libraries: [{
            id: 7,
            displayName: '果果贴图',
            sourceSetName: 'guoguo777899',
            status: 'DRAFT',
            stickerCount: 0
          }]
        }
      })

    const wrapper = mountView()
    await flushPromises()

    const input = wrapper.get('input[placeholder="https://t.me/addstickers/guoguo777899"]')
    await input.setValue('https://t.me/addstickers/guoguo777899')
    await importButton(wrapper).trigger('click')
    await flushPromises()

    expect(apiMocks.importSet).toHaveBeenCalledWith({
      sourceUrl: 'https://t.me/addstickers/guoguo777899'
    })
    expect(apiMocks.getLibraries).toHaveBeenCalledTimes(2)
    expect(apiMocks.getLibrary).toHaveBeenCalledWith(7)
    expect(messageMocks.success).toHaveBeenCalledWith('贴图包已导入，请补充每张贴图的语义说明')
    expect(input.element.value).toBe('')
  })

  it('uses PREVIEW mode to fill blank fields in the editor without saving the sticker', async () => {
    let resolveAnalysisConfig
    apiMocks.getAnalysisConfig.mockReturnValueOnce(new Promise((resolve) => {
      resolveAnalysisConfig = resolve
    }))
    const sticker = {
      id: 11,
      displayName: '',
      meaning: '',
      useWhen: '',
      avoidWhen: '',
      keywords: [],
      enabled: false,
      format: 'STATIC',
      telegramStatus: 'AVAILABLE',
      previewStatus: 'SUCCESS',
      previewUrl: '/uploads/11.webp',
      updatedAt: '2026-07-18T10:00:00'
    }
    apiMocks.getLibraries.mockResolvedValue({
      code: 200,
      data: { libraries: [{ id: 7, displayName: '果果贴图', status: 'DRAFT', stickerCount: 1 }] }
    })
    apiMocks.getLibrary.mockResolvedValue({
      code: 200,
      data: { library: { id: 7, displayName: '果果贴图', status: 'DRAFT' }, stickers: [sticker] }
    })
    apiMocks.analyzeSticker.mockResolvedValue({
      code: 200,
      data: {
        suggestion: {
          displayName: '无语摇头',
          meaning: '表达无语',
          useWhen: '回应离谱内容',
          avoidWhen: '正式通知',
          keywords: ['无语', '摇头'],
          confidence: 'HIGH',
          visualDescription: '角色缓慢摇头'
        }
      }
    })

    const wrapper = mountView()
    await flushPromises()
    await wrapper.get('.library-item').trigger('click')
    await flushPromises()
    await wrapper.get('.sticker-card').trigger('click')
    const analyzeButton = wrapper.findAll('button').find((button) => button.text() === 'AI 解析并填入空白字段')
    analyzeButton.element.click()
    analyzeButton.element.click()
    expect(apiMocks.getAnalysisConfig).toHaveBeenCalledTimes(1)
    resolveAnalysisConfig({
      code: 200,
      data: { modelId: 'provider/vision-model', apiKeyConfigured: true }
    })
    await vi.waitFor(() => expect(apiMocks.analyzeSticker).toHaveBeenCalledTimes(1))
    await flushPromises()

    expect(apiMocks.analyzeSticker).toHaveBeenCalledWith(11, {
      frames: ['data:image/png;base64,AAAA'],
      applyMode: 'PREVIEW',
      expectedUpdatedAt: '2026-07-18T10:00:00'
    })
    expect(apiMocks.updateSticker).not.toHaveBeenCalled()
    expect(wrapper.findAll('input').some((input) => input.element.value === '无语摇头')).toBe(true)
    expect(messageMocks.success).toHaveBeenCalledWith('AI 已填入 5 项空白资讯，请检查后保存')
  })

  it('processes incomplete stickers with a fixed concurrency of two and FILL_MISSING mode', async () => {
    const makeSticker = (id) => ({
      id,
      displayName: '',
      meaning: '',
      useWhen: '',
      avoidWhen: '',
      keywords: [],
      enabled: false,
      format: 'STATIC',
      telegramStatus: 'AVAILABLE',
      previewStatus: 'SUCCESS',
      previewUrl: `/uploads/${id}.webp`,
      updatedAt: `2026-07-18T10:00:0${id}`,
      sortOrder: id - 1
    })
    const sourceStickers = [makeSticker(1), makeSticker(2), makeSticker(3)]
    apiMocks.getLibraries.mockResolvedValue({
      code: 200,
      data: { libraries: [{ id: 7, displayName: '批量贴图', status: 'DRAFT', stickerCount: 3 }] }
    })
    apiMocks.getLibrary.mockResolvedValue({
      code: 200,
      data: { library: { id: 7, displayName: '批量贴图', status: 'DRAFT' }, stickers: sourceStickers }
    })

    let activeRequests = 0
    let maximumActiveRequests = 0
    apiMocks.analyzeSticker.mockImplementation(async (id) => {
      activeRequests += 1
      maximumActiveRequests = Math.max(maximumActiveRequests, activeRequests)
      await new Promise((resolve) => setTimeout(resolve, 5))
      activeRequests -= 1
      return {
        code: 200,
        data: {
          sticker: {
            ...makeSticker(id),
            displayName: `AI 贴图 ${id}`,
            meaning: '含义',
            useWhen: '场景',
            avoidWhen: '禁止场景',
            keywords: ['关键词']
          }
        }
      }
    })

    const wrapper = mountView()
    await flushPromises()
    await wrapper.get('.library-item').trigger('click')
    await flushPromises()
    const batchButton = wrapper.findAll('button')
      .find((button) => button.text() === 'AI 填写未完成贴图（3）')
    await batchButton.trigger('click')
    await vi.waitFor(() => expect(apiMocks.analyzeSticker).toHaveBeenCalledTimes(3))
    await vi.waitFor(() => expect(messageMocks.success).toHaveBeenCalledWith('批量解析完成，成功填写 3 张贴图'))

    expect(maximumActiveRequests).toBe(2)
    expect(apiMocks.analyzeSticker).toHaveBeenCalledWith(1, {
      frames: ['data:image/png;base64,AAAA'],
      applyMode: 'FILL_MISSING',
      expectedUpdatedAt: '2026-07-18T10:00:01'
    })
    expect(wrapper.text()).toContain('AI 贴图 1')
    expect(wrapper.text()).toContain('成功 3')
  })
})
