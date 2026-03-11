'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Card,
  Row,
  Col,
  Button,
  Space,
  Typography,
  Input,
  List,
  Avatar,
  Spin,
  message,
  Empty,
  Drawer,
} from 'antd'
import {
  SendOutlined,
  MessageOutlined,
  PlusOutlined,
  RobotOutlined,
  UserOutlined,
  HistoryOutlined,
} from '@ant-design/icons'
import { chatService, ChatSession, ChatMessage } from '@/services/chatService'
import { useChatStore } from '@/stores/chatStore'
import { useSettingsStore } from '@/stores/settingsStore'

const { Title, Text, Paragraph } = Typography
const { TextArea } = Input

const quickQuestions = [
  '为什么流量最近下降了？',
  '如何提升转化率？',
  '最近有哪些增长机会？',
  '哪些用户最有价值？',
  '哪些商品卖得最好？',
  '本周应该做什么？',
]

export default function ChatPage() {
  const { merchantId } = useSettingsStore()
  const {
    currentSession,
    sessions,
    messages,
    isLoading,
    setCurrentSession,
    setSessions,
    setMessages,
    addMessage,
    setLoading,
  } = useChatStore()

  const [inputValue, setInputValue] = useState('')
  const [drawerVisible, setDrawerVisible] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<any>(null)

  useEffect(() => {
    fetchSessions()
  }, [merchantId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchSessions = async () => {
    try {
      const data = await chatService.getSessions(merchantId)
      setSessions(data)
      if (data.length > 0 && !currentSession) {
        handleSelectSession(data[0])
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error)
    }
  }

  const handleSelectSession = async (session: ChatSession) => {
    setCurrentSession(session)
    try {
      const data = await chatService.getMessages(session.id)
      setMessages(data)
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    }
  }

  const handleCreateSession = async () => {
    try {
      const session = await chatService.createSession(merchantId)
      setSessions([session, ...sessions])
      setCurrentSession(session)
      setMessages([])
      setDrawerVisible(false)
    } catch (error) {
      message.error('创建会话失败')
    }
  }

  const handleSend = async () => {
    if (!inputValue.trim() || !currentSession) {
      if (!currentSession) {
        message.warning('请先创建会话')
      }
      return
    }

    const userMessage: ChatMessage = {
      id: `temp_${Date.now()}`,
      role: 'user',
      content: inputValue,
      created_at: new Date().toISOString(),
    }
    addMessage(userMessage)
    setInputValue('')
    setLoading(true)

    try {
      const assistantMessage = await chatService.sendMessage(currentSession.id, inputValue)
      addMessage(assistantMessage)
    } catch (error) {
      message.error('发送失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleQuickQuestion = (question: string) => {
    setInputValue(question)
    inputRef.current?.focus()
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="h-[calc(100vh-180px)] flex gap-4">
      <div className="w-64 bg-white rounded-lg p-4 hidden lg:block">
        <Button
          type="primary"
          icon={<PlusOutlined />}
          block
          onClick={handleCreateSession}
          className="mb-4"
        >
          新建对话
        </Button>

        <Title level={5} className="mb-2">
          <HistoryOutlined className="mr-2" />
          历史对话
        </Title>
        <List
          dataSource={sessions}
          renderItem={(session) => (
            <List.Item
              className={`cursor-pointer px-3 py-2 rounded hover:bg-gray-50 ${
                currentSession?.id === session.id ? 'bg-blue-50' : ''
              }`}
              onClick={() => handleSelectSession(session)}
            >
              <List.Item.Meta
                avatar={<MessageOutlined className="text-gray-400" />}
                title={session.title || '新对话'}
                description={new Date(session.created_at).toLocaleDateString()}
              />
            </List.Item>
          )}
        />
      </div>

      <Card className="flex-1 flex flex-col">
        <div className="flex justify-between items-center mb-4 pb-4 border-b">
          <div className="flex items-center gap-2">
            <RobotOutlined className="text-xl text-primary-500" />
            <Title level={4} className="m-0">
              AI 经营助手
            </Title>
          </div>
          <Button
            icon={<HistoryOutlined />}
            onClick={() => setDrawerVisible(true)}
            className="lg:hidden"
          >
            历史
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto mb-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center">
              <RobotOutlined className="text-6xl text-gray-200 mb-4" />
              <Title level={4} className="text-gray-400 mb-4">
                您好！我是您的 AI 经营助手
              </Title>
              <div className="text-center text-gray-500 mb-6">
                <p>我可以帮您：</p>
                <p>• 分析经营数据，找出问题原因</p>
                <p>• 发现增长机会，提供策略建议</p>
                <p>• 回答经营相关问题</p>
              </div>
              <div className="grid grid-cols-2 gap-2 max-w-md">
                {quickQuestions.map((question, index) => (
                  <Button
                    key={index}
                    onClick={() => handleQuickQuestion(question)}
                    className="text-left"
                  >
                    {question}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`flex gap-3 max-w-[80%] ${
                      msg.role === 'user' ? 'flex-row-reverse' : ''
                    }`}
                  >
                    <Avatar
                      icon={msg.role === 'user' ? <UserOutlined /> : <RobotOutlined />}
                      className={
                        msg.role === 'user' ? 'bg-primary-500' : 'bg-gray-200 text-gray-600'
                      }
                    />
                    <div
                      className={`p-4 rounded-lg ${
                        msg.role === 'user'
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <Paragraph className="m-0 whitespace-pre-wrap">{msg.content}</Paragraph>
                      {msg.data && (
                        <div className="mt-2 p-2 bg-white/20 rounded">
                          <Text className="text-sm">📊 数据图表</Text>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex gap-3">
                    <Avatar icon={<RobotOutlined />} className="bg-gray-200 text-gray-600" />
                    <div className="p-4 rounded-lg bg-gray-100">
                      <Spin size="small" />
                      <Text className="ml-2 text-gray-500">正在思考...</Text>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="border-t pt-4">
          <Space.Compact className="w-full">
            <TextArea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="请输入您的问题..."
              autoSize={{ minRows: 1, maxRows: 4 }}
              className="flex-1"
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSend}
              loading={isLoading}
              disabled={!inputValue.trim()}
            >
              发送
            </Button>
          </Space.Compact>
        </div>
      </Card>

      <Drawer
        title="历史对话"
        placement="right"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        className="lg:hidden"
      >
        <Button
          type="primary"
          icon={<PlusOutlined />}
          block
          onClick={handleCreateSession}
          className="mb-4"
        >
          新建对话
        </Button>
        <List
          dataSource={sessions}
          renderItem={(session) => (
            <List.Item
              className="cursor-pointer"
              onClick={() => {
                handleSelectSession(session)
                setDrawerVisible(false)
              }}
            >
              <List.Item.Meta
                avatar={<MessageOutlined />}
                title={session.title || '新对话'}
                description={new Date(session.created_at).toLocaleDateString()}
              />
            </List.Item>
          )}
        />
      </Drawer>
    </div>
  )
}
