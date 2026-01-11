import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { GameSessionEvent, SteamLoginRequest, SteamSessionEvent } from '@shared/interfaces/session.types'
import { ConvertedInventory, TransferItems } from '@shared/interfaces/inventory.types'
import { env } from '@shared/env'
import { Account, Settings } from '@shared/interfaces/store.types'
import GlobalOffensive from 'globaloffensive'

// Custom APIs for renderer
const api = {
  /**
   * Renderer --->>> Main
   */
  loginSteam: (data: SteamLoginRequest): Promise<string> => {
    return ipcRenderer.invoke('main:steam-session-login', data)
  },
  loginCache: (userId: string): Promise<string> => {
    return ipcRenderer.invoke('main:cache-session-login', userId)
  },
  loadInventory: (fromCache: boolean, onlyChangedContainers: boolean): Promise<ConvertedInventory> => {
    return ipcRenderer.invoke('main:load-inventory', fromCache, onlyChangedContainers)
  },
  loadSettings: (): Promise<Settings> => {
    return ipcRenderer.invoke('main:load-settings')
  },
  saveSettings: (settings: Settings): Promise<void> => {
    return ipcRenderer.invoke('main:save-settings', settings)
  },
  loadAccounts: (): Promise<Record<string, Account>> => {
    return ipcRenderer.invoke('main:load-accounts')
  },
  transferItems: (transfer: TransferItems): Promise<boolean> => {
    return ipcRenderer.invoke('main:transfer-items', transfer)
  },
  cancelTransfer: (): Promise<void> => {
    return ipcRenderer.invoke('main:cancel-transfer')
  },
  getRawItemData: (itemId: number): Promise<GlobalOffensive.InventoryItem> => {
    return ipcRenderer.invoke('main:get-raw-item-data', itemId)
  },
  downloadUpdate: (): Promise<void> => {
    return ipcRenderer.invoke('main:download-update')
  },
  installUpdate: (): Promise<void> => {
    return ipcRenderer.invoke('main:install-update')
  },
  getAppVersion: (): Promise<string> => {
    return ipcRenderer.invoke('main:get-app-version')
  },

  /**
   * Main --->>> Renderer
   */
  onSteamSessionEvent: (callback) => {
    const listener = (_event, value: SteamSessionEvent): void => callback(value)
    ipcRenderer.on('renderer:steam-session-event', listener)
    return () => ipcRenderer.removeListener('renderer:steam-session-event', listener)
  },
  onGameSessionEvent: (callback) => {
    const listener = (_event, value: GameSessionEvent): void => callback(value)
    ipcRenderer.on('renderer:game-session-event', listener)
    return () => ipcRenderer.removeListener('renderer:game-session-event', listener)
  },
  onTransferProgress: (callback: (itemId, success) => void) => {
    // This function returns an unsubscribe function
    // Which prevents duplicate listener registrations
    const listener = (_event, itemId: number, success: boolean): void => callback(itemId, success)
    ipcRenderer.on('renderer:transfer-progress', listener)
    return () => ipcRenderer.removeListener('renderer:transfer-progress', listener)
  },
  onUpdateAvailable: (callback: (version: string) => void) => {
    const listener = (_event, version: string): void => callback(version)
    ipcRenderer.on('renderer:update-available', listener)
    return () => ipcRenderer.removeListener('renderer:update-available', listener)
  },
  onUpdateDownloaded: (callback: () => void) => {
    const listener = (): void => callback()
    ipcRenderer.on('renderer:update-downloaded', listener)
    return () => ipcRenderer.removeListener('renderer:update-downloaded', listener)
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
    contextBridge.exposeInMainWorld('env', {
      ICONS_BASE_URL: env.ICONS_BASE_URL,
      GOOGLE_FORMS_URL: env.GOOGLE_FORMS_URL,
      DISCORD_INVITE_URL: env.DISCORD_INVITE_URL,
      GITHUB_REPO_URL: env.GITHUB_REPO_URL
    })
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
