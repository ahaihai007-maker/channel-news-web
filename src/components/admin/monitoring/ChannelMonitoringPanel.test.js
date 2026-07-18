import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ChannelMonitoringPanel from './ChannelMonitoringPanel.vue'

const unrelatedPanelStubs = {
  ArticlePerformanceTable: true,
  ChannelTelemetryTable: true,
  MetricRail: true,
  MonitoringToolbar: true,
  PipelineFunnelPanel: true,
  TokenUsagePanel: true,
  TrafficTrendPanel: true,
  'el-alert': true,
  'el-tag': { template: '<span><slot /></span>' }
}

describe('ChannelMonitoringPanel', () => {
  it('does not display or include Telegram traffic collection in global status', () => {
    const wrapper = mount(ChannelMonitoringPanel, {
      props: {
        filters: { days: 7, channel: '' },
        services: [
          { key: 'fastapi', label: 'FastAPI', status: 'healthy' },
          {
            key: 'telegram_metrics',
            label: 'Telegram 流量采集',
            status: 'offline',
            detail: '服务心跳未在预期时间内更新'
          }
        ],
        incidents: [
          {
            key: 'service:telegram_metrics',
            severity: 'critical',
            title: 'Telegram 流量采集 offline',
            detail: '服务心跳未在预期时间内更新'
          }
        ]
      },
      global: { stubs: unrelatedPanelStubs }
    })

    expect(wrapper.text()).toContain('FastAPI')
    expect(wrapper.text()).toContain('1 个服务')
    expect(wrapper.text()).toContain('运行状态正常')
    expect(wrapper.text()).not.toContain('Telegram 流量采集')
    expect(wrapper.text()).not.toContain('存在严重异常')
  })
})
