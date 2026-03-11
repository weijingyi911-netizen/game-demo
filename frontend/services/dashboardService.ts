import { api, ApiResponse } from './api'

export interface Metric {
  name: string
  display_name: string
  value: number
  unit: string
  trend: {
    value: number
    type: 'up' | 'down' | 'flat'
    period: string
  }
  status: 'normal' | 'warning' | 'danger'
}

export interface Alert {
  id: string
  type: string
  level: 'info' | 'warning' | 'danger'
  message: string
  suggested_action: string
  created_at: string
}

export interface TrendData {
  name: string
  data: { date: string; value: number }[]
}

export interface DashboardData {
  metrics: Metric[]
  alerts: Alert[]
  trends?: TrendData[]
}

export interface TimeRange {
  start: string
  end: string
}

export const dashboardService = {
  async getMetrics(merchantId: string, timeRange?: string): Promise<DashboardData> {
    const params = new URLSearchParams()
    params.append('merchant_id', merchantId)
    if (timeRange) {
      params.append('time_range', timeRange)
    }
    const response = await api.get<ApiResponse<DashboardData>>(`/dashboard/metrics?${params}`)
    return response.data.data
  },

  async getTrends(
    merchantId: string,
    metricName: string,
    timeRange?: TimeRange
  ): Promise<TrendData> {
    const params = new URLSearchParams()
    params.append('merchant_id', merchantId)
    params.append('metric', metricName)
    if (timeRange) {
      params.append('start', timeRange.start)
      params.append('end', timeRange.end)
    }
    const response = await api.get<ApiResponse<TrendData>>(`/dashboard/trends?${params}`)
    return response.data.data
  },

  async getAlerts(merchantId: string): Promise<Alert[]> {
    const response = await api.get<ApiResponse<Alert[]>>(`/dashboard/alerts?merchant_id=${merchantId}`)
    return response.data.data
  },
}
