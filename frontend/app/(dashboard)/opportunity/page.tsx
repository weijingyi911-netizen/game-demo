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
  Rate,
  Modal,
  Descriptions,
  Empty,
  Spin,
  message,
  Tabs,
} from 'antd'
import {
  BulbOutlined,
  UserOutlined,
  ShoppingOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  RocketOutlined,
  EyeOutlined,
} from '@ant-design/icons'
import { opportunityService, Opportunity } from '@/services/opportunityService'
import { useSettingsStore } from '@/stores/settingsStore'

const { Title, Text, Paragraph } = Typography

const opportunityTypeMap: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  user_segment: { label: '用户群体', icon: <UserOutlined />, color: 'blue' },
  product: { label: '潜力商品', icon: <ShoppingOutlined />, color: 'green' },
  timing: { label: '营销时机', icon: <ClockCircleOutlined />, color: 'orange' },
  channel: { label: '流量渠道', icon: <RocketOutlined />, color: 'purple' },
  pricing: { label: '价格优化', icon: <DollarOutlined />, color: 'cyan' },
}

const statusMap: Record<string, { label: string; color: string }> = {
  new: { label: '新发现', color: 'blue' },
  viewed: { label: '已查看', color: 'default' },
  in_progress: { label: '进行中', color: 'orange' },
  completed: { label: '已完成', color: 'green' },
}

export default function OpportunityPage() {
  const { merchantId } = useSettingsStore()
  const [loading, setLoading] = useState(true)
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null)
  const [detailVisible, setDetailVisible] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => {
    fetchOpportunities()
  }, [merchantId])

  const fetchOpportunities = async () => {
    setLoading(true)
    try {
      const data = await opportunityService.getList(merchantId)
      setOpportunities(data.items)
    } catch (error) {
      message.error('获取数据失败')
    } finally {
      setLoading(false)
    }
  }

  const handleScan = async () => {
    setScanning(true)
    try {
      const newOpportunities = await opportunityService.scan(merchantId)
      setOpportunities([...newOpportunities, ...opportunities])
      message.success(`发现 ${newOpportunities.length} 个新机会`)
    } catch (error) {
      message.error('扫描失败')
    } finally {
      setScanning(false)
    }
  }

  const handleViewDetail = async (opportunity: Opportunity) => {
    setSelectedOpportunity(opportunity)
    setDetailVisible(true)
    if (opportunity.status === 'new') {
      await opportunityService.updateStatus(opportunity.id, 'viewed')
      fetchOpportunities()
    }
  }

  const filteredOpportunities = opportunities.filter((o) => {
    if (activeTab === 'all') return true
    return o.type === activeTab
  })

  const getValueStars = (score: number) => {
    return Math.round(score)
  }

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
            机会发现
          </Title>
          <Paragraph type="secondary" className="m-0">
            基于数据分析，主动发现商家可能忽略的增长机会点
          </Paragraph>
        </div>
        <Button type="primary" icon={<BulbOutlined />} onClick={handleScan} loading={scanning}>
          扫描新机会
        </Button>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          { key: 'all', label: '全部机会' },
          { key: 'user_segment', label: '用户群体' },
          { key: 'product', label: '潜力商品' },
          { key: 'timing', label: '营销时机' },
          { key: 'channel', label: '流量渠道' },
          { key: 'pricing', label: '价格优化' },
        ].map((tab) => ({
          key: tab.key,
          label: tab.label,
        }))}
      />

      {filteredOpportunities.length === 0 ? (
        <Empty description="暂无机会数据" className="py-16" />
      ) : (
        <Row gutter={[16, 16]}>
          {filteredOpportunities.map((opportunity) => {
            const typeInfo = opportunityTypeMap[opportunity.type] || {
              label: opportunity.type,
              icon: <BulbOutlined />,
              color: 'default',
            }
            const statusInfo = statusMap[opportunity.status] || {
              label: opportunity.status,
              color: 'default',
            }

            return (
              <Col xs={24} lg={12} xl={8} key={opportunity.id}>
                <Card
                  className="opportunity-card h-full"
                  hoverable
                  onClick={() => handleViewDetail(opportunity)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <Space>
                      <Tag color={typeInfo.color} icon={typeInfo.icon}>
                        {typeInfo.label}
                      </Tag>
                      <Tag color={statusInfo.color}>{statusInfo.label}</Tag>
                    </Space>
                    <Rate
                      disabled
                      defaultValue={getValueStars(opportunity.value_score)}
                      count={5}
                      className="text-sm"
                    />
                  </div>

                  <Title level={5} className="mb-2">
                    {opportunity.title}
                  </Title>
                  <Paragraph ellipsis={{ rows: 2 }} type="secondary" className="mb-4">
                    {opportunity.description}
                  </Paragraph>

                  <div className="bg-gray-50 p-3 rounded mb-4">
                    <Text type="secondary" className="text-xs">
                      数据支撑
                    </Text>
                    <Paragraph className="mb-0 text-sm">{opportunity.data_evidence}</Paragraph>
                  </div>

                  <div className="flex justify-between items-center">
                    <Space>
                      <Text type="secondary">预期 ROI:</Text>
                      <Text strong className="text-green-600">
                        {opportunity.expected_roi}
                      </Text>
                    </Space>
                    <Button type="link" icon={<EyeOutlined />} size="small">
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
        title="机会详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setDetailVisible(false)}>
            关闭
          </Button>,
          <Button key="strategy" type="primary">
            生成策略
          </Button>,
        ]}
        width={700}
      >
        {selectedOpportunity && (
          <div>
            <Descriptions column={2} bordered className="mb-4">
              <Descriptions.Item label="机会类型" span={1}>
                <Tag color={opportunityTypeMap[selectedOpportunity.type]?.color || 'default'}>
                  {opportunityTypeMap[selectedOpportunity.type]?.label || selectedOpportunity.type}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="价值评分" span={1}>
                <Rate disabled defaultValue={selectedOpportunity.value_score} count={5} />
              </Descriptions.Item>
              <Descriptions.Item label="执行难度" span={1}>
                <Rate disabled defaultValue={selectedOpportunity.effort_score} count={5} />
              </Descriptions.Item>
              <Descriptions.Item label="预期 ROI" span={1}>
                <Text strong className="text-green-600">
                  {selectedOpportunity.expected_roi}
                </Text>
              </Descriptions.Item>
            </Descriptions>

            <Title level={5}>机会描述</Title>
            <Paragraph>{selectedOpportunity.description}</Paragraph>

            <Title level={5}>数据支撑</Title>
            <Paragraph>{selectedOpportunity.data_evidence}</Paragraph>

            <Title level={5}>推荐行动</Title>
            <List
              dataSource={selectedOpportunity.recommended_actions}
              renderItem={(action, index) => (
                <List.Item>
                  <Text>
                    {index + 1}. {action}
                  </Text>
                </List.Item>
              )}
            />
          </div>
        )}
      </Modal>
    </div>
  )
}
