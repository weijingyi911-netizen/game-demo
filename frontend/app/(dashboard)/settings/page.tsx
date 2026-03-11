'use client'

import { useState } from 'react'
import {
  Card,
  Form,
  Input,
  Button,
  Select,
  Switch,
  Divider,
  message,
  Typography,
  Space,
} from 'antd'
import { SaveOutlined, SettingOutlined } from '@ant-design/icons'
import { useSettingsStore } from '@/stores/settingsStore'

const { Title, Text } = Typography

export default function SettingsPage() {
  const { merchantId, setMerchantId, theme, setTheme, language, setLanguage } = useSettingsStore()
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()

  const handleSave = async () => {
    setLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 500))
      message.success('设置已保存')
    } catch (error) {
      message.error('保存失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Title level={2}>系统设置</Title>
      <Text type="secondary">管理您的账户和系统偏好设置</Text>

      <Divider />

      <Card title="基本设置" className="mb-6">
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            merchantId,
            theme,
            language,
          }}
        >
          <Form.Item label="商家 ID" name="merchantId">
            <Input
              placeholder="请输入商家 ID"
              onChange={(e) => setMerchantId(e.target.value)}
            />
          </Form.Item>

          <Form.Item label="界面主题" name="theme">
            <Select
              options={[
                { value: 'light', label: '浅色模式' },
                { value: 'dark', label: '深色模式' },
              ]}
              onChange={setTheme}
            />
          </Form.Item>

          <Form.Item label="语言" name="language">
            <Select
              options={[
                { value: 'zh-CN', label: '简体中文' },
                { value: 'en-US', label: 'English' },
              ]}
              onChange={setLanguage}
            />
          </Form.Item>
        </Form>
      </Card>

      <Card title="告警设置" className="mb-6">
        <Form layout="vertical">
          <Form.Item label="流量下降告警阈值">
            <Space>
              <Input type="number" defaultValue={15} style={{ width: 100 }} />
              <Text>%</Text>
            </Space>
          </Form.Item>

          <Form.Item label="转化率下降告警阈值">
            <Space>
              <Input type="number" defaultValue={10} style={{ width: 100 }} />
              <Text>%</Text>
            </Space>
          </Form.Item>

          <Form.Item label="GMV 下降告警阈值">
            <Space>
              <Input type="number" defaultValue={20} style={{ width: 100 }} />
              <Text>%</Text>
            </Space>
          </Form.Item>

          <Form.Item label="启用邮件通知">
            <Switch defaultChecked />
          </Form.Item>

          <Form.Item label="启用短信通知">
            <Switch />
          </Form.Item>
        </Form>
      </Card>

      <Card title="AI 设置" className="mb-6">
        <Form layout="vertical">
          <Form.Item label="默认 AI 模型">
            <Select
              defaultValue="openai"
              options={[
                { value: 'openai', label: 'OpenAI GPT-4' },
                { value: 'qwen', label: '通义千问' },
                { value: 'ernie', label: '文心一言' },
              ]}
            />
          </Form.Item>

          <Form.Item label="分析深度">
            <Select
              defaultValue="standard"
              options={[
                { value: 'quick', label: '快速分析（响应快，深度浅）' },
                { value: 'standard', label: '标准分析（平衡响应和深度）' },
                { value: 'deep', label: '深度分析（响应慢，深度高）' },
              ]}
            />
          </Form.Item>

          <Form.Item label="启用流式输出">
            <Switch defaultChecked />
          </Form.Item>
        </Form>
      </Card>

      <Card title="数据源设置">
        <Form layout="vertical">
          <Form.Item label="数据同步频率">
            <Select
              defaultValue="daily"
              options={[
                { value: 'realtime', label: '实时同步' },
                { value: 'hourly', label: '每小时' },
                { value: 'daily', label: '每天' },
              ]}
            />
          </Form.Item>

          <Form.Item label="数据保留时间">
            <Select
              defaultValue="365"
              options={[
                { value: '30', label: '30 天' },
                { value: '90', label: '90 天' },
                { value: '365', label: '1 年' },
                { value: 'forever', label: '永久保留' },
              ]}
            />
          </Form.Item>
        </Form>
      </Card>

      <div className="mt-6 flex justify-end">
        <Button
          type="primary"
          icon={<SaveOutlined />}
          onClick={handleSave}
          loading={loading}
          size="large"
        >
          保存设置
        </Button>
      </div>
    </div>
  )
}
