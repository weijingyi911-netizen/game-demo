import { api, ApiResponse, PaginatedResponse } from './api'

export interface ChatSession {
  id: string
  title: string
  created_at: string
  updated_at: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  data?: Record<string, unknown>
  created_at: string
}

export const chatService = {
  async getSessions(merchantId: string): Promise<ChatSession[]> {
    const response = await api.get<ApiResponse<ChatSession[]>>(
      `/chat/sessions?merchant_id=${merchantId}`
    )
    return response.data.data
  },

  async createSession(merchantId: string, title?: string): Promise<ChatSession> {
    const response = await api.post<ApiResponse<ChatSession>>('/chat/sessions', {
      merchant_id: merchantId,
      title,
    })
    return response.data.data
  },

  async getMessages(sessionId: string): Promise<ChatMessage[]> {
    const response = await api.get<ApiResponse<ChatMessage[]>>(
      `/chat/sessions/${sessionId}/messages`
    )
    return response.data.data
  },

  async sendMessage(
    sessionId: string,
    content: string
  ): Promise<ChatMessage> {
    const response = await api.post<ApiResponse<ChatMessage>>(
      `/chat/sessions/${sessionId}/messages`,
      { content }
    )
    return response.data.data
  },

  async *sendMessageStream(
    sessionId: string,
    content: string
  ): AsyncGenerator<ChatMessage> {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

    const response = await fetch(`${API_URL}/api/v1/chat/sessions/${sessionId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify({ content, stream: true }),
    })

    const reader = response.body?.getReader()
    if (!reader) throw new Error('No reader available')

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') return
          try {
            const parsed = JSON.parse(data)
            yield parsed
          } catch {
            continue
          }
        }
      }
    }
  },
}
