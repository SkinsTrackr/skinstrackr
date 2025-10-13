import { ElectronAPI } from '@electron-toolkit/preload'
import { LoginRequest, LoginResponse } from '@shared/interfaces/login.types'

export interface CustomAPI {
  /**
   * Renderer --->>> Main
   */
  loginSteam: (data: LoginRequest) => Promise<LoginResponse>

  /**
   * Main --->>> Renderer
   */
  onEventMsg: (callback: (value: EventMsg<unknown>) => void) => void
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: CustomAPI
  }
}
