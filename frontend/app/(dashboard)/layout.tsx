'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Layout,
  Menu,
  Avatar,
  Dropdown,
  Button,
  Badge,
  Space,
  Typography,
} from 'antd'
import {
  DashboardOutlined,
  SearchOutlined,
  BulbOutlined,
  SolutionOutlined,
  MessageOutlined,
  ApartmentOutlined,
  SettingOutlined,
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons'
import { useAuthStore } from '@/stores/authStore'
import { useSettingsStore } from '@/stores/settingsStore'
import type { MenuProps } from 'antd'

const { Header, Sider, Content } = Layout
const { Text } = Typography

const menuItems: MenuProps['items'] = [
  {
    key: '/dashboard',
    icon: <DashboardOutlined />,
    label: <Link href="/dashboard">数据看板</Link>,
  },
  {
    key: '/diagnosis',
    icon: <SearchOutlined />,
    label: <Link href="/diagnosis">智能诊断</Link>,
  },
  {
    key: '/opportunity',
    icon: <BulbOutlined />,
    label: <Link href="/opportunity">机会发现</Link>,
  },
  {
    key: '/strategy',
    icon: <SolutionOutlined />,
    label: <Link href="/strategy">策略中心</Link>,
  },
  {
    key: '/chat',
    icon: <MessageOutlined />,
    label: <Link href="/chat">AI 对话</Link>,
  },
  {
    key: '/story',
    icon: <ApartmentOutlined />,
    label: <Link href="/story">剧情配置</Link>,
  },
  {
    type: 'divider',
  },
  {
    key: '/settings',
    icon: <SettingOutlined />,
    label: <Link href="/settings">系统设置</Link>,
  },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { user, logout } = useAuthStore()
  const { collapsed, toggleCollapsed } = useSettingsStore()
  const [alertCount] = useState(3)

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人中心',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '设置',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: logout,
    },
  ]

  return (
    <Layout className="min-h-screen">
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        className="bg-white shadow-sm"
        width={220}
      >
        <div className="flex items-center justify-center h-16 border-b border-gray-100">
          {!collapsed ? (
            <Text strong className="text-lg text-primary-500">
              AI 经营决策
            </Text>
          ) : (
            <Text strong className="text-xl text-primary-500">
              AI
            </Text>
          )}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[pathname]}
          items={menuItems}
          className="border-none"
        />
      </Sider>
      <Layout>
        <Header className="flex items-center justify-between px-4 bg-white shadow-sm">
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={toggleCollapsed}
            className="text-lg"
          />
          <Space size="middle">
            <Badge count={alertCount} size="small">
              <Button type="text" icon={<BellOutlined />} />
            </Badge>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Space className="cursor-pointer">
                <Avatar icon={<UserOutlined />} />
                <Text>{user?.name || '商家用户'}</Text>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content className="p-6 m-4 bg-gray-50 rounded-lg min-h-[calc(100vh-112px)]">
          {children}
        </Content>
      </Layout>
    </Layout>
  )
}
