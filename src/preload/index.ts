import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { GameSessionEvent, SteamLoginRequest, SteamSessionEvent } from '@shared/interfaces/session.types'
import { ConvertedItem } from '@shared/interfaces/inventory.types'

// Custom APIs for renderer
const api = {
  /**
   * Renderer --->>> Main
   */
  loginSteam: (data: SteamLoginRequest) => {
    ipcRenderer.send('main:steam-session-login', data)
  },
  loadInventory: (): Promise<ConvertedItem[]> => {
    return ipcRenderer.invoke('main:load-inventory')
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
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
