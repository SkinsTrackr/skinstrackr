import { ElectronAPI } from '@electron-toolkit/preload'
import { GameSessionEvent, SteamLoginRequest } from '@shared/interfaces/session.types'

export interface CustomAPI {
  /**
   * Renderer --->>> Main
   */
  loginSteam: (data: SteamLoginRequest) => void
  loadInventory: () => Promise<ConvertedItem[]>

  /**
   * Main --->>> Renderer
   */
  onEventMsg: (callback: (value: EventMsg<unknown>) => void) => void
  onSteamSessionEvent: (callback: (value: SteamSessionEvent) => void) => void
  onGameSessionEvent: (callback: (value: GameSessionEvent) => void) => void
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: CustomAPI
  }
}
