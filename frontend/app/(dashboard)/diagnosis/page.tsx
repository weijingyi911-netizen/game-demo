'use client'

import { useState } from 'react'
import {
  Card,
  Row,
  Col,
  Button,
  Select,
  DatePicker,
  Input,
  Steps,
  Typography,
  Tag,
  Progress,
  List,
  Space,
  Spin,
  message,
  Empty,
  Descriptions,
  Divider,
} from 'antd'
import {
  SearchOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  BulbOutlined,
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import { diagnosisService, DiagnosisReport, AnalysisFactor } from '@/services/diagnosisService'
import { useSettingsStore } from '@/stores/settingsStore'

const { Title, Text, Paragraph } = Typography
const { RangePicker } = DatePicker
const { TextArea } = Input

const problemTypes = [
  { value: 'gmv_decline', label: 'GMV 下降分析' },
  { value: 'traffic_decline', label: '流量下跌分析' },
  { value: 'conversion_low', label: '转化率低分析' },
  { value: 'customer_price_low', label: '客单价低分析' },
  { value: 'repurchase_low', label: '复购率低分析' },
  { value: 'user_churn', label: '用户流失分析' },
]

export default function DiagnosisPage() {
  const { merchantId } = useSettingsStore()
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [problemType, setProblemType] = useState<string>()
  const [dateRange, setDateRange] = useState<[string, string] | null>(null)
  const [context, setContext] = useState('')
  const [report, setReport] = useState<DiagnosisReport | null>(null)

  const handleAnalyze = async () => {
    if (!problemType || !dateRange) {
      message.warning('请选择问题类型和时间范围')
      return
    }

    setLoading(true)
    setCurrentStep(1)

    try {
      const result = await diagnosisService.analyze({
        merchant_id: merchantId,
        problem_type: problemType,
        time_range: {
          start: dateRange[0],
          end: dateRange[1],
        },
        additional_context: context,
      })

      const pollReport = async () => {
        const reportData = await diagnosisService.getReport(result.report_id)
        setReport(reportData)
        setCurrentStep(2)
        setLoading(false)
      }

      setTimeout(pollReport, 2000)
    } catch (error) {
      message.error('分析失败，请稍后重试')
      setLoading(false)
      setCurrentStep(0)
    }
  }

  const getFactorChartOption = (factors: AnalysisFactor[]) => ({
    tooltip: {
      trigger: 'item',
    },
    legend: {
      bottom: 0,
    },
    series: [
      {
        name: '贡献度',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: true,
          formatter: '{b}: {d}%',
        },
        data: factors.map((f) => ({
          value: Math.abs(f.contribution),
          name: f.name,
          itemStyle: {
            color: f.is_main_factor ? '#ff4d4f' : '#1677ff',
          },
        })),
      },
    ],
  })

  const resetAnalysis = () => {
    setCurrentStep(0)
    setReport(null)
    setProblemType(undefined)
    setDateRange(null)
    setContext('')
  }

  return (
    <div>
      <Title level={2}>智能诊断</Title>
      <Paragraph type="secondary">
        通过 AI 分析，自动诊断经营问题的根本原因，回答"为什么"的问题
      </Paragraph>

      <Steps
        current={currentStep}
        items={[
          { title: '选择问题', description: '选择要分析的问题类型' },
          { title: 'AI 分析', description: '正在进行智能分析' },
          { title: '查看报告', description: '查看诊断结果和建议' },
        ]}
        className="mb-8"
      />

      {currentStep === 0 && (
        <Card>
          <Row gutter={[24, 24]}>
            <Col span={24}>
              <div className="mb-2 font-medium">问题类型</div>
              <Select
                placeholder="请选择要分析的问题"
                value={problemType}
                onChange={setProblemType}
                style={{ width: '100%' }}
                options={problemTypes}
                size="large"
              />
            </Col>
            <Col span={24}>
              <div className="mb-2 font-medium">时间范围</div>
              <RangePicker
                style={{ width: '100%' }}
                size="large"
                onChange={(_, dateStrings) => setDateRange(dateStrings as [string, string])}
              />
            </Col>
            <Col span={24}>
              <div className="mb-2 font-medium">补充说明（可选）</div>
              <TextArea
                rows={4}
                placeholder="请输入您对问题的补充说明，帮助 AI 更准确地分析..."
                value={context}
                onChange={(e) => setContext(e.target.value)}
              />
            </Col>
            <Col span={24}>
              <Button
                type="primary"
                size="large"
                icon={<SearchOutlined />}
                onClick={handleAnalyze}
                loading={loading}
              >
                开始分析
              </Button>
            </Col>
          </Row>
        </Card>
      )}

      {currentStep === 1 && (
        <Card className="text-center py-16">
          <Spin size="large" />
          <Title level={4} className="mt-6">
            AI 正在分析中...
          </Title>
          <Paragraph type="secondary">
            正在拆解指标、分析数据、生成诊断报告，预计需要 10-30 秒
          </Paragraph>
          <Progress percent={50} status="active" className="max-w-md mx-auto" />
        </Card>
      )}

      {currentStep === 2 && report && (
        <div>
          <Card className="mb-6">
            <div className="flex justify-between items-center">
              <Title level={4} className="m-0">
                📋 诊断报告
              </Title>
              <Space>
                <Button onClick={resetAnalysis}>重新分析</Button>
                <Button type="primary">导出报告</Button>
              </Space>
            </div>
          </Card>

          <Card title="📊 问题概述" className="mb-6">
            <Paragraph className="text-lg">{report.summary}</Paragraph>
          </Card>

          <Card title="🔍 归因分析" className="mb-6">
            <Row gutter={24}>
              <Col xs={24} lg={12}>
                <List
                  dataSource={report.factors}
                  renderItem={(item) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={
                          item.is_main_factor ? (
                            <ExclamationCircleOutlined className="text-2xl text-red-500" />
                          ) : (
                            <CheckCircleOutlined className="text-2xl text-green-500" />
                          )
                        }
                        title={
                          <Space>
                            <Text strong>{item.name}</Text>
                            {item.is_main_factor && <Tag color="red">主因</Tag>}
                          </Space>
                        }
                        description={
                          <Space direction="vertical" size={0}>
                            <Text>
                              当前值: {item.current_value} | 对比值: {item.previous_value}
                            </Text>
                            <Text type={item.change_percent < 0 ? 'danger' : 'success'}>
                              变化: {item.change_percent > 0 ? '+' : ''}
                              {item.change_percent}%
                            </Text>
                            <Text type="secondary">贡献度: {item.contribution}%</Text>
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              </Col>
              <Col xs={24} lg={12}>
                <ReactECharts
                  option={getFactorChartOption(report.factors)}
                  style={{ height: 300 }}
                />
              </Col>
            </Row>
          </Card>

          <Card title="📌 深度分析" className="mb-6">
            {report.deep_analysis.map((item, index) => (
              <div key={index} className="mb-4">
                <Title level={5}>{item.dimension}</Title>
                <Descriptions column={1} bordered size="small">
                  <Descriptions.Item label="发现">{item.finding}</Descriptions.Item>
                  <Descriptions.Item label="原因">{item.reason}</Descriptions.Item>
                  <Descriptions.Item label="数据支撑">{item.evidence}</Descriptions.Item>
                </Descriptions>
              </div>
            ))}
          </Card>

          <Card title="💡 改善建议" className="mb-6">
            <List
              dataSource={report.recommendations}
              renderItem={(item, index) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <Tag
                        color={
                          item.priority === 'urgent'
                            ? 'red'
                            : item.priority === 'important'
                            ? 'orange'
                            : 'blue'
                        }
                      >
                        {item.priority === 'urgent'
                          ? '紧急'
                          : item.priority === 'important'
                          ? '重要'
                          : '建议'}
                      </Tag>
                    }
                    title={`${index + 1}. ${item.action}`}
                    description={item.expected_effect}
                  />
                </List.Item>
              )}
            />
          </Card>

          <Card title="📈 预期效果">
            <Alert
              message={report.expected_outcome}
              type="success"
              showIcon
              className="text-lg"
            />
          </Card>
        </div>
      )}
    </div>
  )
}

function Alert({ message, type, showIcon, className }: { message: string; type: string; showIcon?: boolean; className?: string }) {
  const bgColor = type === 'success' ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'
  const textColor = type === 'success' ? 'text-green-700' : 'text-blue-700'
  return (
    <div className={`p-4 rounded border ${bgColor} ${textColor} ${className}`}>
      {showIcon && <BulbOutlined className="mr-2" />}
      {message}
    </div>
  )
}
