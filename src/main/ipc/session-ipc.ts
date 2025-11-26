import { ipcMain } from 'electron'
import { LogOnDetailsNameToken } from 'steam-user'
import { SteamLoginRequest } from '@shared/interfaces/session.types'
import SteamSession from '../steam-session'

export function setupSessionIPC(): void {
  ipcMain.handle('main:steam-session-login', async (_event, loginRequest: SteamLoginRequest): Promise<string> => {
    const details: LogOnDetailsNameToken = {
      anonymous: false,
      accountName: loginRequest.account_name,
      webLogonToken: loginRequest.token,
      steamID: loginRequest.steamid,
      autoRelogin: true
    }

    return SteamSession.getInstance().loginUserToSteam(details)
  })

  ipcMain.handle('main:cache-session-login', async (_event, userId: string): Promise<string> => {
    return SteamSession.getInstance().loginCachedUser(userId)
  })
}
