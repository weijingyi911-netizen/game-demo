'use client'

import { useState, useEffect } from 'react'
import { Row, Col, Card, Statistic, Table, Tag, Button, Space, Select, DatePicker, Alert as AntAlert, Spin, message } from 'antd'
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  MinusOutlined,
  LineChartOutlined,
  AlertOutlined,
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import dayjs from 'dayjs'
import { dashboardService, Metric, Alert } from '@/services/dashboardService'
import { useSettingsStore } from '@/stores/settingsStore'

const { RangePicker } = DatePicker

const getTrendIcon = (type: string) => {
  switch (type) {
    case 'up':
      return <ArrowUpOutlined />
    case 'down':
      return <ArrowDownOutlined />
    default:
      return <MinusOutlined />
  }
}

const getTrendColor = (type: string) => {
  switch (type) {
    case 'up':
      return '#52c41a'
    case 'down':
      return '#ff4d4f'
    default:
      return '#8c8c8c'
  }
}

export default function DashboardPage() {
  const { merchantId } = useSettingsStore()
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState<Metric[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [timeRange, setTimeRange] = useState<string>('7d')

  useEffect(() => {
    fetchDashboardData()
  }, [merchantId, timeRange])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const data = await dashboardService.getMetrics(merchantId, timeRange)
      setMetrics(data.metrics)
      setAlerts(data.alerts)
    } catch (error) {
      message.error('获取数据失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const getGmvChartOption = () => ({
    title: {
      text: 'GMV 趋势',
      left: 'center',
    },
    tooltip: {
      trigger: 'axis',
    },
    xAxis: {
      type: 'category',
      data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: '¥{value}',
      },
    },
    series: [
      {
        name: 'GMV',
        type: 'line',
        smooth: true,
        data: [42000, 38000, 55000, 48000, 62000, 58000, 58320],
        itemStyle: {
          color: '#1677ff',
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(22, 119, 255, 0.3)' },
              { offset: 1, color: 'rgba(22, 119, 255, 0.05)' },
            ],
          },
        },
      },
    ],
  })

  const getTrafficChartOption = () => ({
    title: {
      text: '流量趋势',
      left: 'center',
    },
    tooltip: {
      trigger: 'axis',
    },
    xAxis: {
      type: 'category',
      data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
    },
    yAxis: {
      type: 'value',
    },
    series: [
      {
        name: 'UV',
        type: 'bar',
        data: [38000, 42000, 45000, 40000, 48000, 52000, 45678],
        itemStyle: {
          color: '#1677ff',
        },
      },
      {
        name: 'PV',
        type: 'bar',
        data: [120000, 135000, 142000, 128000, 155000, 168000, 145000],
        itemStyle: {
          color: '#52c41a',
        },
      },
    ],
  })

  const alertColumns = [
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const typeMap: Record<string, string> = {
          traffic_decline: '流量下降',
          conversion_drop: '转化率下降',
          gmv_decline: 'GMV下降',
          inventory_low: '库存不足',
        }
        return typeMap[type] || type
      },
    },
    {
      title: '级别',
      dataIndex: 'level',
      key: 'level',
      render: (level: string) => {
        const colorMap: Record<string, string> = {
          info: 'blue',
          warning: 'orange',
          danger: 'red',
        }
        const textMap: Record<string, string> = {
          info: '信息',
          warning: '警告',
          danger: '严重',
        }
        return <Tag color={colorMap[level]}>{textMap[level]}</Tag>
      },
    },
    {
      title: '描述',
      dataIndex: 'message',
      key: 'message',
    },
    {
      title: '建议操作',
      dataIndex: 'suggested_action',
      key: 'suggested_action',
      render: (action: string) => (
        <Button type="link" size="small">
          {action}
        </Button>
      ),
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold m-0">数据看板</h1>
        <Space>
          <Select
            value={timeRange}
            onChange={setTimeRange}
            style={{ width: 120 }}
            options={[
              { value: 'today', label: '今日' },
              { value: '7d', label: '近7天' },
              { value: '30d', label: '近30天' },
              { value: 'custom', label: '自定义' },
            ]}
          />
          <RangePicker />
        </Space>
      </div>

      {alerts.length > 0 && (
        <div className="mb-6">
          {alerts.slice(0, 2).map((alert) => (
            <AntAlert
              key={alert.id}
              message={alert.message}
              description={alert.suggested_action}
              type={alert.level === 'danger' ? 'error' : alert.level === 'warning' ? 'warning' : 'info'}
              showIcon
              icon={<AlertOutlined />}
              className="mb-2"
              action={
                <Button size="small" type="primary">
                  查看详情
                </Button>
              }
            />
          ))}
        </div>
      )}

      <Row gutter={[16, 16]}>
        {metrics.map((metric) => (
          <Col xs={24} sm={12} lg={6} key={metric.name}>
            <Card className="metric-card hover:shadow-md transition-shadow">
              <Statistic
                title={metric.display_name}
                value={metric.value}
                prefix={metric.unit === '¥' ? '¥' : undefined}
                suffix={metric.unit !== '¥' ? metric.unit : undefined}
                valueStyle={{ fontSize: '28px' }}
              />
              <div className="mt-2 flex items-center gap-2">
                <span
                  className="flex items-center gap-1"
                  style={{ color: getTrendColor(metric.trend.type) }}
                >
                  {getTrendIcon(metric.trend.type)}
                  {Math.abs(metric.trend.value)}%
                </span>
                <span className="text-gray-400 text-sm">{metric.trend.period}</span>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]} className="mt-6">
        <Col xs={24} lg={12}>
          <Card>
            <ReactECharts option={getGmvChartOption()} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card>
            <ReactECharts option={getTrafficChartOption()} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>

      <Card title="告警列表" className="mt-6">
        <Table
          columns={alertColumns}
          dataSource={alerts}
          rowKey="id"
          pagination={{ pageSize: 5 }}
        />
      </Card>
    </div>
  )
}
