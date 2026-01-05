import { ipcMain } from 'electron'
import { Account, Settings } from '@shared/interfaces/store.types'
import { accounts, settings } from '../util/client-store-utils'

/**
 * Handle IPC calls related to client state
 */
export function setupClientStoreIPC(): void {
  ipcMain.handle('main:load-settings', async (): Promise<Settings> => {
    return settings.getSettings()
  })

  ipcMain.handle('main:save-settings', async (_event, newSettings: Settings): Promise<void> => {
    settings.setSettings(newSettings)
  })

  ipcMain.handle('main:load-accounts', async (): Promise<Record<string, Account>> => {
    return accounts.getAccounts()
  })
}
