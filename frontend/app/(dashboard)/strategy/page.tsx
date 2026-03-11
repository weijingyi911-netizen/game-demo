'use client'

import { useState, useEffect } from 'react'
import {
  Card,
  Row,
  Col,
  Tag,
  Button,
  Space,
  Typography,
  List,
  Modal,
  Descriptions,
  Empty,
  Spin,
  message,
  Tabs,
  Timeline,
  Badge,
} from 'antd'
import {
  SolutionOutlined,
  RocketOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons'
import { strategyService, Strategy } from '@/services/strategyService'
import { useSettingsStore } from '@/stores/settingsStore'

const { Title, Text, Paragraph } = Typography

const typeMap: Record<string, { label: string; color: string }> = {
  marketing: { label: '营销策略', color: 'blue' },
  product: { label: '商品策略', color: 'green' },
  user: { label: '用户策略', color: 'orange' },
  traffic: { label: '流量策略', color: 'purple' },
  content: { label: '内容策略', color: 'cyan' },
}

const statusMap: Record<string, { label: string; color: BadgeProps['status'] }> = {
  pending: { label: '待执行', color: 'default' },
  in_progress: { label: '进行中', color: 'processing' },
  completed: { label: '已完成', color: 'success' },
  cancelled: { label: '已取消', color: 'error' },
}

interface BadgeProps {
  status: 'default' | 'processing' | 'success' | 'error' | 'warning'
}

export default function StrategyPage() {
  const { merchantId } = useSettingsStore()
  const [loading, setLoading] = useState(true)
  const [strategies, setStrategies] = useState<Strategy[]>([])
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null)
  const [detailVisible, setDetailVisible] = useState(false)
  const [activeTab, setActiveTab] = useState('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    fetchStrategies()
  }, [merchantId, activeTab, statusFilter])

  const fetchStrategies = async () => {
    setLoading(true)
    try {
      const data = await strategyService.getList(
        merchantId,
        activeTab === 'all' ? undefined : activeTab,
        statusFilter === 'all' ? undefined : statusFilter
      )
      setStrategies(data.items)
    } catch (error) {
      message.error('获取数据失败')
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetail = async (strategy: Strategy) => {
    const detail = await strategyService.getDetail(strategy.id)
    setSelectedStrategy(detail)
    setDetailVisible(true)
  }

  const handleExecute = async (strategyId: string) => {
    try {
      await strategyService.markExecuted(strategyId)
      message.success('已标记为执行中')
      fetchStrategies()
    } catch (error) {
      message.error('操作失败')
    }
  }

  const filteredStrategies = strategies.filter((s) => {
    if (activeTab !== 'all' && s.type !== activeTab) return false
    if (statusFilter !== 'all' && s.status !== statusFilter) return false
    return true
  })

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
        <div>
          <Title level={2} className="m-0">
            策略中心
          </Title>
          <Paragraph type="secondary" className="m-0">
            将 AI 分析结果转化为具体可执行的策略建议
          </Paragraph>
        </div>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          { key: 'all', label: '全部策略' },
          { key: 'marketing', label: '营销策略' },
          { key: 'product', label: '商品策略' },
          { key: 'user', label: '用户策略' },
          { key: 'traffic', label: '流量策略' },
          { key: 'content', label: '内容策略' },
        ].map((tab) => ({
          key: tab.key,
          label: tab.label,
        }))}
      />

      <div className="mb-4">
        <Space>
          <Text type="secondary">状态筛选:</Text>
          {['all', 'pending', 'in_progress', 'completed'].map((status) => (
            <Button
              key={status}
              size="small"
              type={statusFilter === status ? 'primary' : 'default'}
              onClick={() => setStatusFilter(status)}
            >
              {status === 'all'
                ? '全部'
                : statusMap[status]?.label || status}
            </Button>
          ))}
        </Space>
      </div>

      {filteredStrategies.length === 0 ? (
        <Empty description="暂无策略数据" className="py-16" />
      ) : (
        <Row gutter={[16, 16]}>
          {filteredStrategies.map((strategy) => {
            const typeInfo = typeMap[strategy.type] || {
              label: strategy.type,
              color: 'default',
            }
            const statusInfo = statusMap[strategy.status] || {
              label: strategy.status,
              color: 'default',
            }

            return (
              <Col xs={24} lg={12} xl={8} key={strategy.id}>
                <Card className="strategy-card h-full" hoverable>
                  <div className="flex justify-between items-start mb-4">
                    <Tag color={typeInfo.color}>{typeInfo.label}</Tag>
                    <Badge status={statusInfo.color} text={statusInfo.label} />
                  </div>

                  <Title level={5} className="mb-2">
                    {strategy.title}
                  </Title>
                  <Paragraph ellipsis={{ rows: 2 }} type="secondary" className="mb-4">
                    {strategy.description}
                  </Paragraph>

                  <div className="bg-blue-50 p-3 rounded mb-4">
                    <Text type="secondary" className="text-xs block mb-1">
                      目标
                    </Text>
                    <Text>{strategy.target}</Text>
                  </div>

                  <div className="flex justify-between items-center mb-4">
                    <Space>
                      <ClockCircleOutlined className="text-gray-400" />
                      <Text type="secondary" className="text-sm">
                        最佳执行: {strategy.best_time}
                      </Text>
                    </Space>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="primary"
                      size="small"
                      icon={<PlayCircleOutlined />}
                      onClick={() => handleExecute(strategy.id)}
                      disabled={strategy.status !== 'pending'}
                    >
                      开始执行
                    </Button>
                    <Button
                      size="small"
                      icon={<EyeOutlined />}
                      onClick={() => handleViewDetail(strategy)}
                    >
                      查看详情
                    </Button>
                  </div>
                </Card>
              </Col>
            )
          })}
        </Row>
      )}

      <Modal
        title="策略详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setDetailVisible(false)}>
            关闭
          </Button>,
          <Button
            key="execute"
            type="primary"
            icon={<PlayCircleOutlined />}
            disabled={selectedStrategy?.status !== 'pending'}
            onClick={() => {
              if (selectedStrategy) {
                handleExecute(selectedStrategy.id)
                setDetailVisible(false)
              }
            }}
          >
            开始执行
          </Button>,
        ]}
        width={700}
      >
        {selectedStrategy && (
          <div>
            <Descriptions column={2} bordered className="mb-4">
              <Descriptions.Item label="策略类型" span={1}>
                <Tag color={typeMap[selectedStrategy.type]?.color || 'default'}>
                  {typeMap[selectedStrategy.type]?.label || selectedStrategy.type}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="状态" span={1}>
                <Badge
                  status={statusMap[selectedStrategy.status]?.color}
                  text={statusMap[selectedStrategy.status]?.label}
                />
              </Descriptions.Item>
              <Descriptions.Item label="最佳执行时间" span={2}>
                {selectedStrategy.best_time}
              </Descriptions.Item>
            </Descriptions>

            <Title level={5}>策略描述</Title>
            <Paragraph>{selectedStrategy.description}</Paragraph>

            <Title level={5}>目标</Title>
            <Paragraph>{selectedStrategy.target}</Paragraph>

            <Title level={5}>执行步骤</Title>
            <Timeline
              items={selectedStrategy.steps.map((step) => ({
                color: 'blue',
                children: (
                  <div>
                    <Text strong>步骤 {step.order}</Text>
                    <br />
                    <Text>{step.action}</Text>
                    <br />
                    <Text type="secondary" className="text-sm">
                      {step.details}
                    </Text>
                  </div>
                ),
              }))}
            />

            <Title level={5}>预期效果</Title>
            <Paragraph className="bg-green-50 p-3 rounded text-green-700">
              {selectedStrategy.expected_effect}
            </Paragraph>
          </div>
        )}
      </Modal>
    </div>
  )
}
