import { api } from './api'

export interface StoryProject {
  id: string
  name: string
  created_at: string
  updated_at: string
}

export interface StoryDraft {
  project_id: string
  yaml: string
  updated_at: string
}

export interface StoryRelease {
  id: string
  project_id: string
  version: number
  note?: string | null
  created_at: string
}

export interface StoryReleaseList {
  items: StoryRelease[]
}

export interface StoryAsset {
  id: string
  project_id?: string | null
  original_name: string
  file_name: string
  content_type?: string | null
  size: number
  url: string
  created_at: string
}

export const storyService = {
  async listProjects() {
    const res = await api.get<StoryProject[]>('/story/projects')
    return res.data
  },

  async createProject(name: string) {
    const res = await api.post<StoryProject>('/story/projects', { name })
    return res.data
  },

  async getDraft(projectId: string) {
    const res = await api.get<StoryDraft>(`/story/projects/${projectId}/draft`)
    return res.data
  },

  async saveDraft(projectId: string, yaml: string) {
    const res = await api.put<StoryDraft>(`/story/projects/${projectId}/draft`, { yaml })
    return res.data
  },

  async createRelease(projectId: string, note?: string) {
    const res = await api.post<StoryRelease>(`/story/projects/${projectId}/release`, { note })
    return res.data
  },

  async listReleases(projectId: string) {
    const res = await api.get<StoryReleaseList>(`/story/projects/${projectId}/releases`)
    return res.data
  },

  async rollback(projectId: string, releaseId: string) {
    const res = await api.post<StoryDraft>(`/story/projects/${projectId}/rollback`, {
      release_id: releaseId,
    })
    return res.data
  },

  async uploadAsset(file: File, projectId?: string) {
    const form = new FormData()
    form.append('file', file)
    const res = await api.post<StoryAsset>('/story/assets/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      params: projectId ? { project_id: projectId } : undefined,
    })
    return res.data
  },
}

