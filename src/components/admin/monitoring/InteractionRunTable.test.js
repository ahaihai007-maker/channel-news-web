import { computed, h, inject, provide } from 'vue'
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import InteractionRunTable from './InteractionRunTable.vue'

const rowsKey = Symbol('interaction-run-table-rows')

const ElTableStub = {
  props: {
    data: { type: Array, default: () => [] }
  },
  setup(props, { slots }) {
    provide(rowsKey, computed(() => props.data))
    return () => h('div', { 'data-testid': 'table' }, slots.default?.())
  }
}

const ElTableColumnStub = {
  setup(_props, { slots }) {
    const rows = inject(rowsKey)
    return () => h(
      'section',
      {},
      slots.default ? rows.value.map((row) => slots.default({ row })) : []
    )
  }
}

const ElTooltipStub = {
  props: {
    content: { type: String, default: '' }
  },
  setup(props, { slots }) {
    return () => h('span', { class: 'tooltip-stub' }, [
      slots.default?.(),
      h('span', { class: 'tooltip-content' }, props.content)
    ])
  }
}

const passthroughStub = {
  setup(_props, { slots }) {
    return () => h('div', {}, slots.default?.())
  }
}

describe('InteractionRunTable', () => {
  it('renders combined reply failure state and its diagnostic detail', () => {
    const wrapper = mount(InteractionRunTable, {
      props: {
        rows: [{
          id: 81,
          createdAt: '2026-07-18T08:00:00Z',
          status: 'SUCCESS',
          routeName: '讨论线路',
          chatId: '-100123',
          articleTitle: '测试文章',
          mode: 'ARTICLE_DISCUSSION',
          requestMode: 'OPINION',
          triggerType: 'mention',
          modelId: 'test/model',
          totalTokens: 42,
          latencyMs: 350,
          replyType: 'TEXT_AND_STICKER',
          replyMessageId: 991,
          selectedStickerId: 17,
          stickerDecisionReason: 'CONTENT_PLUS_REACTION',
          stickerSendStatus: 'FAILED',
          stickerErrorSummary: 'BadRequest: wrong file identifier',
          errorSummary: null,
          policyViolationCodes: []
        }],
        total: 1,
        filters: { status: '', modelId: '', mode: '', triggerType: '' }
      },
      global: {
        directives: { loading: () => {} },
        stubs: {
          'el-table': ElTableStub,
          'el-table-column': ElTableColumnStub,
          'el-tooltip': ElTooltipStub,
          'el-select': passthroughStub,
          'el-option': true,
          'el-tag': passthroughStub,
          'el-pagination': true
        }
      }
    })

    expect(wrapper.text()).toContain('文字 + 贴图 · 贴图发送失败')
    expect(wrapper.text()).toContain('决策：文字回答后补充贴图')
    expect(wrapper.text()).toContain('贴图 ID：17')
    expect(wrapper.text()).toContain('错误：BadRequest: wrong file identifier')
  })
})
