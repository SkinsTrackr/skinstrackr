import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { GameSessionEvent, SteamLoginRequest, SteamSessionEvent } from '@shared/interfaces/session.types'
import { ConvertedInventory, TransferItems } from '@shared/interfaces/inventory.types'
import { env } from '@shared/env'
import { Account, Settings } from '@shared/interfaces/store.types'

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
  loadAccounts: (): Promise<Record<string, Account>> => {
    return ipcRenderer.invoke('main:load-accounts')
  },
  transferItems: (transfer: TransferItems): Promise<boolean> => {
    return ipcRenderer.invoke('main:transfer-items', transfer)
  },
  cancelTransfer: (): Promise<void> => {
    return ipcRenderer.invoke('main:cancel-transfer')
  },

  /**
   * Main --->>> Renderer
   */
  onSteamSessionEvent: (callback) =>
    ipcRenderer.on('renderer:steam-session-event', (_event, value: SteamSessionEvent) => callback(value)),
  onGameSessionEvent: (callback) =>
    ipcRenderer.on('renderer:game-session-event', (_event, value: GameSessionEvent) => callback(value)),
  onTransferProgress: (callback: (itemId, success) => void) => {
    // This function returns an unsubscribe function
    // Which prevents duplicate listener registrations
    const listener = (_event, itemId: number, success: boolean): void => callback(itemId, success)
    ipcRenderer.on('renderer:transfer-progress', listener)
    return () => ipcRenderer.removeListener('renderer:transfer-progress', listener)
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
      ICONS_BASE_URL: env.ICONS_BASE_URL
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
