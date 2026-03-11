import { api, ApiResponse } from './api'

export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  created_at: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
  user: User
}

export interface RegisterRequest {
  email: string
  password: string
  name: string
}

export const authService = {
  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await api.post<ApiResponse<LoginResponse>>('/auth/login', data)
    return response.data.data
  },

  async register(data: RegisterRequest): Promise<User> {
    const response = await api.post<ApiResponse<User>>('/auth/register', data)
    return response.data.data
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get<ApiResponse<User>>('/auth/me')
    return response.data.data
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout')
  },
}
