'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Button,
  Card,
  Input,
  Modal,
  Select,
  Space,
  Tabs,
  Table,
  Typography,
  message,
  Upload,
} from 'antd'
import type { UploadRequestOption } from 'rc-upload/lib/interface'
import { PlusOutlined, SaveOutlined, CloudUploadOutlined, SyncOutlined, RollbackOutlined } from '@ant-design/icons'
import { storyService, type StoryProject, type StoryRelease } from '@/services/storyService'

const { Title, Text } = Typography
const { TextArea } = Input

type EditorMessage =
  | { type: 'REQUEST_YAML' }
  | { type: 'EDITOR_YAML'; yaml: string }

function getOrigin(url: string) {
  try {
    return new URL(url).origin
  } catch {
    return '*'
  }
}

export default function StoryPage() {
  const editorUrl = process.env.NEXT_PUBLIC_STORY_EDITOR_URL || 'http://localhost:5173/editor.html'
  const editorOrigin = useMemo(() => getOrigin(editorUrl), [editorUrl])

  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const [projects, setProjects] = useState<StoryProject[]>([])
  const [projectId, setProjectId] = useState<string>('')
  const [yaml, setYaml] = useState<string>('')
  const [yamlLoading, setYamlLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [releases, setReleases] = useState<StoryRelease[]>([])
  const [releasesLoading, setReleasesLoading] = useState(false)
  const [publishing, setPublishing] = useState(false)

  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [newProjectName, setNewProjectName] = useState('我的文字互动游戏')

  const refreshProjects = useCallback(async () => {
    const list = await storyService.listProjects()
    setProjects(list)
    if (!projectId && list.length > 0) {
      setProjectId(list[0].id)
    }
  }, [projectId])

  const refreshDraft = async (id: string) => {
    setYamlLoading(true)
    try {
      const draft = await storyService.getDraft(id)
      setYaml(draft.yaml)
    } finally {
      setYamlLoading(false)
    }
  }

  const refreshReleases = async (id: string) => {
    setReleasesLoading(true)
    try {
      const res = await storyService.listReleases(id)
      setReleases(res.items)
    } finally {
      setReleasesLoading(false)
    }
  }

  useEffect(() => {
    refreshProjects().catch(() => {
      message.error('加载项目失败')
    })
  }, [refreshProjects])

  useEffect(() => {
    if (!projectId) return
    refreshDraft(projectId).catch(() => message.error('加载草稿失败'))
    refreshReleases(projectId).catch(() => message.error('加载版本失败'))
  }, [projectId])

  useEffect(() => {
    const handler = (event: MessageEvent<EditorMessage>) => {
      if (editorOrigin !== '*' && event.origin !== editorOrigin) return
      if (!event.data || typeof event.data !== 'object') return
      if (event.data.type === 'EDITOR_YAML') {
        setYaml(event.data.yaml)
        message.success('已从可视化编辑器同步 YAML')
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [editorOrigin])

  const requestYamlFromEditor = () => {
    const win = iframeRef.current?.contentWindow
    if (!win) {
      message.warning('编辑器未加载')
      return
    }
    win.postMessage({ type: 'REQUEST_YAML' }, editorOrigin)
  }

  const saveDraft = async () => {
    if (!projectId) return
    setSaving(true)
    try {
      await storyService.saveDraft(projectId, yaml)
      message.success('草稿已保存')
    } catch {
      message.error('保存失败')
    } finally {
      setSaving(false)
    }
  }

  const publishRelease = async () => {
    if (!projectId) return
    setPublishing(true)
    try {
      const note = `发布于 ${new Date().toLocaleString()}`
      await storyService.createRelease(projectId, note)
      await refreshReleases(projectId)
      message.success('已发布新版本')
    } catch {
      message.error('发布失败')
    } finally {
      setPublishing(false)
    }
  }

  const rollback = async (releaseId: string) => {
    if (!projectId) return
    try {
      await storyService.rollback(projectId, releaseId)
      await refreshDraft(projectId)
      message.success('已回滚到指定版本')
    } catch {
      message.error('回滚失败')
    }
  }

  const createProject = async () => {
    const name = newProjectName.trim()
    if (!name) {
      message.warning('请输入项目名称')
      return
    }
    try {
      const p = await storyService.createProject(name)
      setCreateModalOpen(false)
      setNewProjectName(name)
      await refreshProjects()
      setProjectId(p.id)
      message.success('项目已创建')
    } catch {
      message.error('创建失败')
    }
  }

  const uploadRequest = async (options: UploadRequestOption) => {
    if (!projectId) {
      options.onError?.(new Error('No project selected'))
      return
    }
    try {
      const file = options.file as File
      const asset = await storyService.uploadAsset(file, projectId)
      options.onSuccess?.(asset)
      message.success('上传成功')
    } catch (e) {
      options.onError?.(e as Error)
      message.error('上传失败')
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <div>
          <Title level={2} style={{ marginBottom: 0 }}>
            剧情配置
          </Title>
          <Text type="secondary">可视化编辑、草稿保存、版本发布与资源上传</Text>
        </div>

        <Card>
          <Space wrap>
            <Select
              style={{ width: 320 }}
              placeholder="选择项目"
              value={projectId || undefined}
              options={projects.map((p) => ({ value: p.id, label: p.name }))}
              onChange={setProjectId}
            />
            <Button icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)}>
              新建项目
            </Button>
            <Button icon={<SyncOutlined />} onClick={requestYamlFromEditor}>
              从编辑器同步 YAML
            </Button>
            <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={saveDraft}>
              保存草稿
            </Button>
            <Button icon={<CloudUploadOutlined />} loading={publishing} onClick={publishRelease}>
              发布版本
            </Button>
          </Space>
        </Card>

        <Tabs
          items={[
            {
              key: 'visual',
              label: '可视化编辑器',
              children: (
                <Card>
                  <div style={{ border: '1px solid #f0f0f0', borderRadius: 8, overflow: 'hidden' }}>
                    <iframe
                      ref={iframeRef}
                      src={editorUrl}
                      style={{ width: '100%', height: 760, border: 0 }}
                      title="story-editor"
                    />
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <Text type="secondary">
                      编辑器地址：{editorUrl}
                    </Text>
                  </div>
                </Card>
              ),
            },
            {
              key: 'yaml',
              label: '草稿 YAML',
              children: (
                <Card>
                  <TextArea
                    value={yaml}
                    onChange={(e) => setYaml(e.target.value)}
                    rows={28}
                    spellCheck={false}
                    disabled={yamlLoading}
                    placeholder="在这里编辑或从可视化编辑器同步 YAML"
                  />
                </Card>
              ),
            },
            {
              key: 'releases',
              label: '版本',
              children: (
                <Card>
                  <Table
                    rowKey="id"
                    loading={releasesLoading}
                    dataSource={releases}
                    pagination={false}
                    columns={[
                      { title: '版本', dataIndex: 'version', width: 100 },
                      { title: '说明', dataIndex: 'note' },
                      { title: '发布时间', dataIndex: 'created_at', width: 220 },
                      {
                        title: '操作',
                        width: 140,
                        render: (_, r) => (
                          <Button
                            icon={<RollbackOutlined />}
                            onClick={() => rollback(r.id)}
                          >
                            回滚
                          </Button>
                        ),
                      },
                    ]}
                  />
                </Card>
              ),
            },
            {
              key: 'assets',
              label: '资源',
              children: (
                <Card>
                  <Upload
                    multiple
                    customRequest={uploadRequest}
                    showUploadList
                  >
                    <Button icon={<CloudUploadOutlined />}>上传资源</Button>
                  </Upload>
                </Card>
              ),
            },
          ]}
        />
      </Space>

      <Modal
        title="新建项目"
        open={createModalOpen}
        onCancel={() => setCreateModalOpen(false)}
        onOk={createProject}
        okText="创建"
        cancelText="取消"
      >
        <Input value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} placeholder="项目名称" />
      </Modal>
    </div>
  )
}
