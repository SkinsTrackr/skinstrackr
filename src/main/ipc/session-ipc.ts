import { ipcMain } from 'electron'
import { LogOnDetailsNameToken } from 'steam-user'
import { SteamLoginRequest } from '@shared/interfaces/session.types'
import SteamSession from '../steam-session'

export function setupSessionIPC(): void {
  ipcMain.handle('main:steam-session-login', async (_event, loginRequest: SteamLoginRequest): Promise<string> => {
    if (
      !loginRequest.token ||
      !loginRequest.steamid ||
      !loginRequest.account_name ||
      loginRequest.account_name === '' ||
      loginRequest.token === '' ||
      loginRequest.steamid === ''
    ) {
      throw new Error('Invalid login details. Make sure you are logged into Steam in the browser.')
    }

    // Active session already exists
    if (SteamSession.getInstance().isLoggedIn()) {
      throw new Error('Already logged into a Steam session. Logout first.')
    }

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
