export interface LoginRequest {
  account_name: string
  steamid: string
  token: string
}

export interface LoginResponse {
  success: boolean
  message: string
  user?: {
    id: string
    username: string
  }
}
