import { ElectronAPI } from '@electron-toolkit/preload'
import { GameSessionEvent, SteamLoginRequest } from '@shared/interfaces/session.types'

export interface CustomAPI {
  /**
   * Renderer --->>> Main
   */
  loginSteam: (data: SteamLoginRequest) => void
  loadInventory: (force: boolean) => Promise<Inventory>

  /**
   * Main --->>> Renderer
   */
  onSteamSessionEvent: (callback: (value: SteamSessionEvent) => void) => void
  onGameSessionEvent: (callback: (value: GameSessionEvent) => void) => void
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: CustomAPI
    env: { ICONS_BASE_URL: string }
  }
}
