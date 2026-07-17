import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import InteractionMetricRail from './InteractionMetricRail.vue'

describe('InteractionMetricRail', () => {
  it('labels indexed messages and token sources with their real scope', () => {
    const wrapper = mount(InteractionMetricRail, {
      props: {
        summary: {
          totalRuns: 5,
          successRuns: 4,
          failedRuns: 1,
          runningRuns: 0,
          successRate: 80,
          recordedReplies: 3,
          triggerUsers: 2,
          indexedMessages: 9,
          promptTokens: 100,
          completionTokens: 30,
          totalTokens: 130,
          averageLatencyMs: 450,
          p95LatencyMs: 800,
          webSearchRequests: 1
        }
      },
      global: {
        stubs: {
          ElSkeleton: { template: '<div />' }
        }
      }
    })

    expect(wrapper.text()).toContain('Bot 已索引消息')
    expect(wrapper.text()).toContain('不等于群组总消息')
    expect(wrapper.text()).toContain('不叠加 ai_usage_logs')
    expect(wrapper.text()).toContain('模型执行成功率')
  })
})
