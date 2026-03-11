import { api, ApiResponse, PaginatedResponse } from './api'

export interface DiagnosisReport {
  id: string
  problem_type: string
  summary: string
  factors: AnalysisFactor[]
  deep_analysis: DeepAnalysis[]
  recommendations: Recommendation[]
  expected_outcome: string
  created_at: string
}

export interface AnalysisFactor {
  name: string
  current_value: number
  previous_value: number
  change_percent: number
  contribution: number
  is_main_factor: boolean
}

export interface DeepAnalysis {
  dimension: string
  finding: string
  reason: string
  evidence: string
}

export interface Recommendation {
  priority: 'urgent' | 'important' | 'suggested'
  action: string
  expected_effect: string
}

export interface DiagnosisRequest {
  merchant_id: string
  problem_type: string
  time_range: {
    start: string
    end: string
  }
  additional_context?: string
}

export const diagnosisService = {
  async analyze(data: DiagnosisRequest): Promise<{ report_id: string; status: string }> {
    const response = await api.post<ApiResponse<{ report_id: string; status: string }>>(
      '/diagnosis/analyze',
      data
    )
    return response.data.data
  },

  async getReports(merchantId: string, page = 1, pageSize = 10): Promise<PaginatedResponse<DiagnosisReport>> {
    const response = await api.get<ApiResponse<PaginatedResponse<DiagnosisReport>>>(
      `/diagnosis/reports?merchant_id=${merchantId}&page=${page}&page_size=${pageSize}`
    )
    return response.data.data
  },

  async getReport(reportId: string): Promise<DiagnosisReport> {
    const response = await api.get<ApiResponse<DiagnosisReport>>(`/diagnosis/reports/${reportId}`)
    return response.data.data
  },
}
