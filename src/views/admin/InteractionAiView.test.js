import { h } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

const aiApiMocks = vi.hoisted(() => ({
  create: vi.fn(),
  delete: vi.fn(),
  getList: vi.fn(),
  update: vi.fn()
}))

const stickerApiMocks = vi.hoisted(() => ({
  getLibraries: vi.fn(),
  getLibrary: vi.fn()
}))

const messageMocks = vi.hoisted(() => ({
  error: vi.fn(),
  success: vi.fn(),
  warning: vi.fn()
}))

vi.mock('../../services/api.js', () => ({
  interactionAiApi: aiApiMocks,
  interactionStickerApi: stickerApiMocks
}))

vi.mock('element-plus', () => ({
  ElMessage: messageMocks,
  ElMessageBox: { confirm: vi.fn() }
}))

vi.mock('../../components/admin/interaction-stickers/TelegramStickerPreview.vue', () => ({
  default: { name: 'TelegramStickerPreview', template: '<div data-testid="sticker-preview" />' }
}))

import InteractionAiView from './InteractionAiView.vue'

const ElButtonStub = {
  props: {
    disabled: Boolean
  },
  emits: ['click'],
  template: '<button :disabled="disabled" @click="$emit(\'click\')"><slot /></button>'
}

const ElDialogStub = {
  props: {
    modelValue: Boolean
  },
  setup(props, { slots }) {
    return () => props.modelValue
      ? h('section', { 'data-testid': 'route-editor' }, [slots.default?.(), slots.footer?.()])
      : null
  }
}

const ElFormStub = {
  setup(_props, { expose, slots }) {
    expose({ validate: vi.fn().mockResolvedValue(undefined) })
    return () => h('form', {}, slots.default?.())
  }
}

const ElFormItemStub = {
  props: {
    label: { type: String, default: '' }
  },
  setup(props, { slots }) {
    return () => h('section', { 'data-label': props.label }, [
      h('span', {}, props.label),
      slots.default?.()
    ])
  }
}

const ElSwitchStub = {
  props: {
    disabled: Boolean,
    modelValue: Boolean
  },
  emits: ['update:modelValue', 'change'],
  setup(props, { emit }) {
    return () => h('button', {
      class: 'switch-stub',
      disabled: props.disabled,
      type: 'button',
      onClick: () => {
        const nextValue = !props.modelValue
        emit('update:modelValue', nextValue)
        emit('change', nextValue)
      }
    }, String(props.modelValue))
  }
}

const passthroughStub = {
  setup(_props, { slots }) {
    return () => h('div', {}, [slots.header?.(), slots.default?.()])
  }
}

const mountView = () => mount(InteractionAiView, {
  global: {
    directives: { loading: () => {} },
    stubs: {
      TelegramStickerPreview: true,
      'el-alert': true,
      'el-button': ElButtonStub,
      'el-card': passthroughStub,
      'el-checkbox': passthroughStub,
      'el-dialog': ElDialogStub,
      'el-empty': true,
      'el-form': ElFormStub,
      'el-form-item': ElFormItemStub,
      'el-input': true,
      'el-input-number': true,
      'el-option': true,
      'el-radio-button': passthroughStub,
      'el-radio-group': passthroughStub,
      'el-select': passthroughStub,
      'el-slider': true,
      'el-switch': ElSwitchStub,
      'el-tab-pane': passthroughStub,
      'el-table': passthroughStub,
      'el-table-column': true,
      'el-tabs': passthroughStub,
      'el-tag': passthroughStub
    }
  }
})

describe('InteractionAiView sticker validation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    aiApiMocks.getList.mockResolvedValue({ code: 200, data: [] })
    stickerApiMocks.getLibraries.mockResolvedValue({ code: 200, data: { libraries: [] } })
  })

  it('blocks saving when sticker capability is enabled without selecting a sticker', async () => {
    const wrapper = mountView()
    await flushPromises()

    const addButton = wrapper.findAll('button').find((button) => button.text() === '新增线路')
    await addButton.trigger('click')
    await flushPromises()

    const stickerCapability = wrapper.get('[data-label="启用贴图能力"]')
    await stickerCapability.get('button.switch-stub').trigger('click')

    const saveButton = wrapper.findAll('button').find((button) => button.text() === '保存线路')
    await saveButton.trigger('click')
    await flushPromises()

    expect(messageMocks.warning).toHaveBeenCalledWith('启用贴图能力时至少选择一张可用贴图')
    expect(aiApiMocks.create).not.toHaveBeenCalled()
    expect(aiApiMocks.update).not.toHaveBeenCalled()
  })
})
