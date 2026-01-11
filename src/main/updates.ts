import { autoUpdater } from 'electron-updater'
import { ipcMain, BrowserWindow, app } from 'electron'
import { is } from '@electron-toolkit/utils'

export function initializeUpdater(mainWindow: BrowserWindow): void {
  ipcMain.handle('main:get-app-version', () => {
    return app.getVersion()
  })

  // Disable updater in development mode
  if (is.dev) {
    return
  }

  // Disable auto-download - user will trigger it
  autoUpdater.autoDownload = false

  // Check for updates on startup
  autoUpdater.checkForUpdates()

  // When update is available, notify renderer with version info
  autoUpdater.on('update-available', (info) => {
    mainWindow.webContents.send('renderer:update-available', info.version)
  })

  // When update is downloaded, notify renderer
  autoUpdater.on('update-downloaded', () => {
    mainWindow.webContents.send('renderer:update-downloaded')
  })

  // Handle download request from renderer
  ipcMain.handle('main:download-update', async () => {
    await autoUpdater.downloadUpdate()
  })

  // Handle install request from renderer
  ipcMain.handle('main:install-update', () => {
    autoUpdater.quitAndInstall()
  })
}
