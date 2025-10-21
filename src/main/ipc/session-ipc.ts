import { ipcMain } from 'electron'
import { LogOnDetailsNameToken } from 'steam-user'
import { SteamLoginRequest } from '@shared/interfaces/session.types'
import SteamSession from '../steam-session'

export function setupSessionIPC(): void {
  console.log('Setting up Session IPC handlers...')

  ipcMain.on('main:steam-session-login', async (_event, loginRequest: SteamLoginRequest) => {
    const user = SteamSession.getInstance().getUser()!

    console.log('Received Steam session login request:', loginRequest)

    // Convert LoginRequest to LogOnDetailsNameToken
    const details: LogOnDetailsNameToken = {
      anonymous: false,
      accountName: loginRequest.account_name,
      webLogonToken: loginRequest.token,
      steamID: loginRequest.steamid,
      autoRelogin: true
    }

    console.log('Logging in with details:', details)
    user.logOn(details)
  })
}
