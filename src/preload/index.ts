import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { LoginRequest, LoginResponse } from '@shared/interfaces/login.types'

// Custom APIs for renderer
const api = {
  /**
   * Renderer --->>> Main
   */
  loginSteam: (data: LoginRequest): Promise<LoginResponse> => {
    return ipcRenderer.invoke('main:game-session-login', data)
  },

  /**
   * Main --->>> Renderer
   */
  onEventMsg: (callback) => ipcRenderer.on('renderer:event-msg', (_event, value) => callback(value))
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
