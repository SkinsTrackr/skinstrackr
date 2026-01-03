import { ElectronAPI } from '@electron-toolkit/preload'
import { ConvertedInventory, TransferItems } from '@shared/interfaces/inventory.types'
import { GameSessionEvent, SteamLoginRequest, SteamSessionEvent } from '@shared/interfaces/session.types'
import { Settings, Account } from '@shared/interfaces/store.types'

export interface CustomAPI {
  /**
   * Renderer --->>> Main
   */
  loginSteam: (data: SteamLoginRequest) => Promise<string>
  loginCache: (userId: string) => Promise<string>
  loadInventory: (fromCache: boolean, onlyChangedContainers: boolean) => Promise<ConvertedInventory>
  loadSettings: () => Promise<Settings>
  loadAccounts: () => Promise<Record<string, Account>>
  transferItems: (transfer: TransferItems) => Promise<boolean>
  cancelTransfer: () => Promise<void>
  getRawItemData: (itemId: number) => Promise<GlobalOffensive.InventoryItem>

  /**
   * Main --->>> Renderer
   */
  onSteamSessionEvent: (callback: (value: SteamSessionEvent) => void) => () => void
  onGameSessionEvent: (callback: (value: GameSessionEvent) => void) => () => void
  onTransferProgress: (callback: (itemId: number, success: boolean) => void) => () => void
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: CustomAPI
    env: { ICONS_BASE_URL: string }
  }
}
