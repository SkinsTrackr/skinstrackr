import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { GameSessionEvent, SteamLoginRequest, SteamSessionEvent } from '@shared/interfaces/session.types'
import { Inventory } from '@shared/interfaces/inventory.types'
import { env } from '@shared/env'

// Custom APIs for renderer
const api = {
  /**
   * Renderer --->>> Main
   */
  loginSteam: (data: SteamLoginRequest) => {
    ipcRenderer.send('main:steam-session-login', data)
  },
  loadInventory: (force: boolean): Promise<Inventory> => {
    return ipcRenderer.invoke('main:load-inventory', force)
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
