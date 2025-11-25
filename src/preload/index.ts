import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { GameSessionEvent, SteamLoginRequest, SteamSessionEvent } from '@shared/interfaces/session.types'
import { ConvertedInventory } from '@shared/interfaces/inventory.types'
import { env } from '@shared/env'
import { Account, Settings } from '@shared/interfaces/store.types'

// Custom APIs for renderer
const api = {
  /**
   * Renderer --->>> Main
   */
  loginSteam: (data: SteamLoginRequest) => {
    ipcRenderer.send('main:steam-session-login', data)
  },
  loginCache: (userId: string) => {
    ipcRenderer.send('main:cache-session-login', userId)
  },
  loadInventory: (force: boolean): Promise<ConvertedInventory> => {
    return ipcRenderer.invoke('main:load-inventory', force)
  },
  loadSettings: (): Promise<Settings> => {
    return ipcRenderer.invoke('main:load-settings')
  },
  loadAccounts: (): Promise<Record<string, Account>> => {
    return ipcRenderer.invoke('main:load-accounts')
  },

  /**
   * Main --->>> Renderer
   */
  onSteamSessionEvent: (callback) =>
    ipcRenderer.on('renderer:steam-session-event', (_event, value: SteamSessionEvent) => callback(value)),
  onGameSessionEvent: (callback) =>
    ipcRenderer.on('renderer:game-session-event', (_event, value: GameSessionEvent) => callback(value))
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
