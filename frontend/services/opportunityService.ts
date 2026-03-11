import { api, ApiResponse, PaginatedResponse } from './api'

export interface Opportunity {
  id: string
  type: string
  title: string
  description: string
  data_evidence: string
  value_score: number
  effort_score: number
  expected_roi: string
  recommended_actions: string[]
  status: 'new' | 'viewed' | 'in_progress' | 'completed'
  created_at: string
}

export const opportunityService = {
  async getList(merchantId: string, page = 1, pageSize = 10): Promise<PaginatedResponse<Opportunity>> {
    const response = await api.get<ApiResponse<PaginatedResponse<Opportunity>>>(
      `/opportunities?merchant_id=${merchantId}&page=${page}&page_size=${pageSize}`
    )
    return response.data.data
  },

  async getDetail(opportunityId: string): Promise<Opportunity> {
    const response = await api.get<ApiResponse<Opportunity>>(`/opportunities/${opportunityId}`)
    return response.data.data
  },

  async scan(merchantId: string): Promise<Opportunity[]> {
    const response = await api.post<ApiResponse<Opportunity[]>>('/opportunities/scan', {
      merchant_id: merchantId,
    })
    return response.data.data
  },

  async updateStatus(opportunityId: string, status: string): Promise<void> {
    await api.patch(`/opportunities/${opportunityId}/status`, { status })
  },
}
