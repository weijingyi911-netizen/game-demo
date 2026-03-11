import { api, ApiResponse, PaginatedResponse } from './api'

export interface Strategy {
  id: string
  title: string
  description: string
  type: 'marketing' | 'product' | 'user' | 'traffic' | 'content'
  target: string
  steps: StrategyStep[]
  best_time: string
  expected_effect: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  created_at: string
}

export interface StrategyStep {
  order: number
  action: string
  details: string
}

export const strategyService = {
  async getList(
    merchantId: string,
    type?: string,
    status?: string,
    page = 1,
    pageSize = 10
  ): Promise<PaginatedResponse<Strategy>> {
    const params = new URLSearchParams()
    params.append('merchant_id', merchantId)
    params.append('page', String(page))
    params.append('page_size', String(pageSize))
    if (type) params.append('type', type)
    if (status) params.append('status', status)

    const response = await api.get<ApiResponse<PaginatedResponse<Strategy>>>(
      `/strategies?${params}`
    )
    return response.data.data
  },

  async getDetail(strategyId: string): Promise<Strategy> {
    const response = await api.get<ApiResponse<Strategy>>(`/strategies/${strategyId}`)
    return response.data.data
  },

  async markExecuted(strategyId: string): Promise<void> {
    await api.post(`/strategies/${strategyId}/execute`)
  },

  async updateStatus(strategyId: string, status: string): Promise<void> {
    await api.patch(`/strategies/${strategyId}/status`, { status })
  },
}
