import { ElectronAPI } from '@electron-toolkit/preload'
import { ConvertedInventory, TransferMode } from '@shared/interfaces/inventory.types'
import { GameSessionEvent, SteamLoginRequest } from '@shared/interfaces/session.types'
import { Settings, Account } from '@shared/interfaces/store.types'

export interface CustomAPI {
  /**
   * Renderer --->>> Main
   */
  loginSteam: (data: SteamLoginRequest) => Promise<string>
  loginCache: (userId: string) => Promise<string>
  loadInventory: (force: boolean) => Promise<ConvertedInventory>
  loadSettings: () => Promise<Settings>
  loadAccounts: () => Promise<Record<string, Account>>
  transferItems: (containerId: string, itemId: string, mode: TransferMode) => Promise<boolean>

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
