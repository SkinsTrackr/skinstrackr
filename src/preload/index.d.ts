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
  saveSettings: (settings: Settings) => Promise<void>
  loadAccounts: () => Promise<Record<string, Account>>
  transferItems: (transfer: TransferItems) => Promise<boolean>
  cancelTransfer: () => Promise<void>
  getRawItemData: (itemId: number) => Promise<GlobalOffensive.InventoryItem>
  downloadUpdate: () => Promise<void>
  installUpdate: () => Promise<void>
  getAppVersion: () => Promise<string>

  /**
   * Main --->>> Renderer
   */
  onSteamSessionEvent: (callback: (value: SteamSessionEvent) => void) => () => void
  onGameSessionEvent: (callback: (value: GameSessionEvent) => void) => () => void
  onTransferProgress: (callback: (itemId: number, success: boolean) => void) => () => void
  onUpdateAvailable: (callback: (version: string) => void) => () => void
  onUpdateDownloaded: (callback: () => void) => () => void
  onAppInitialized: (callback: () => void) => () => void
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: CustomAPI
    env: { ICONS_BASE_URL: string; GOOGLE_FORMS_URL: string; DISCORD_INVITE_URL: string; GITHUB_REPO_URL: string }
  }
}
