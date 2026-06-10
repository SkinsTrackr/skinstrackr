import { ipcMain } from 'electron'
import { LogOnDetailsNameToken } from 'steam-user'
import { LoginSession, EAuthTokenPlatformType, EAuthSessionGuardType } from 'steam-session'
import {
  CredentialsGuardResponse,
  CredentialsLoginEvent,
  CredentialsLoginRequest,
  QrLoginEvent,
  SteamLoginRequest
} from '@shared/interfaces/session.types'
import { CredentialsGuardType, CredentialsLoginEventType, QrLoginEventType } from '@shared/enums/session-type'
import SteamSession from '../steam-session'
import { getMainWindow } from '../index'
import log from 'electron-log/main'

let activeQrSession: LoginSession | null = null
let activeCredentialsSession: LoginSession | null = null

function sendQrLoginEvent(event: QrLoginEvent): void {
  getMainWindow()?.webContents.send('renderer:qr-login-event', event)
}

function clearQrSession(): void {
  activeQrSession?.cancelLoginAttempt()
  activeQrSession?.removeAllListeners()
  activeQrSession = null
}

function sendCredentialsLoginEvent(event: CredentialsLoginEvent): void {
  getMainWindow()?.webContents.send('renderer:credentials-login-event', event)
}

function clearCredentialsSession(): void {
  activeCredentialsSession?.cancelLoginAttempt()
  activeCredentialsSession?.removeAllListeners()
  activeCredentialsSession = null
}

export function setupSessionIPC(): void {
  ipcMain.handle('main:steam-token-login', async (_event, loginRequest: SteamLoginRequest): Promise<string> => {
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

  ipcMain.handle('main:steam-qr-login-start', async (): Promise<string> => {
    if (SteamSession.getInstance().isLoggedIn()) {
      throw new Error('Already logged into a Steam session. Logout first.')
    }

    clearQrSession()

    const session = new LoginSession(EAuthTokenPlatformType.SteamClient)
    session.loginTimeout = 120000
    activeQrSession = session

    session.on('remoteInteraction', () => {
      sendQrLoginEvent({ eventType: QrLoginEventType.SCANNED })
    })

    session.on('timeout', () => {
      activeQrSession = null
      sendQrLoginEvent({ eventType: QrLoginEventType.TIMEOUT })
    })

    session.on('error', (err: Error) => {
      log.error('QR login session error:', err)
      activeQrSession = null
      sendQrLoginEvent({ eventType: QrLoginEventType.ERROR, message: err.message })
    })

    session.on('authenticated', async () => {
      activeQrSession = null
      try {
        await SteamSession.getInstance().loginUserToSteam({ refreshToken: session.refreshToken })
      } catch (err) {
        log.error('Failed to log in with QR refresh token:', err)
        sendQrLoginEvent({
          eventType: QrLoginEventType.ERROR,
          message: err instanceof Error ? err.message : 'Failed to log in'
        })
      }
    })

    const { qrChallengeUrl } = await session.startWithQR()
    return qrChallengeUrl!
  })

  ipcMain.handle('main:steam-qr-login-cancel', async (): Promise<void> => {
    clearQrSession()
  })

  ipcMain.handle(
    'main:steam-credentials-login-start',
    async (_event, req: CredentialsLoginRequest): Promise<CredentialsGuardResponse> => {
      if (SteamSession.getInstance().isLoggedIn()) {
        throw new Error('Already logged into a Steam session. Logout first.')
      }

      clearCredentialsSession()

      const session = new LoginSession(EAuthTokenPlatformType.SteamClient)
      session.loginTimeout = 120000
      activeCredentialsSession = session

      session.on('timeout', () => {
        activeCredentialsSession = null
        sendCredentialsLoginEvent({ eventType: CredentialsLoginEventType.TIMEOUT })
      })

      session.on('error', (err: Error) => {
        log.error('Credentials login session error:', err)
        activeCredentialsSession = null
        sendCredentialsLoginEvent({ eventType: CredentialsLoginEventType.ERROR, message: err.message })
      })

      session.on('authenticated', async () => {
        activeCredentialsSession = null
        try {
          await SteamSession.getInstance().loginUserToSteam({ refreshToken: session.refreshToken })
        } catch (err) {
          log.error('Failed to log in with credentials refresh token:', err)
          sendCredentialsLoginEvent({
            eventType: CredentialsLoginEventType.ERROR,
            message: err instanceof Error ? err.message : 'Failed to log in'
          })
        }
      })

      let result: Awaited<ReturnType<LoginSession['startWithCredentials']>>
      try {
        result = await session.startWithCredentials({
          accountName: req.accountName,
          password: req.password
        })
      } catch (err) {
        clearCredentialsSession()
        throw err
      }

      if (!result.actionRequired) {
        return { guard: CredentialsGuardType.NONE, mobileConfirmation: false }
      }

      const actions = result.validActions ?? []
      const deviceCode = actions.find((a) => a.type === EAuthSessionGuardType.DeviceCode)
      const emailCode = actions.find((a) => a.type === EAuthSessionGuardType.EmailCode)
      const mobileConfirmation = actions.some((a) => a.type === EAuthSessionGuardType.DeviceConfirmation)

      if (deviceCode) {
        return { guard: CredentialsGuardType.DEVICE_CODE, mobileConfirmation }
      }
      if (emailCode) {
        return { guard: CredentialsGuardType.EMAIL_CODE, detail: emailCode.detail, mobileConfirmation }
      }
      return { guard: CredentialsGuardType.CONFIRMATION, mobileConfirmation }
    }
  )

  ipcMain.handle('main:steam-credentials-submit-guard', async (_event, code: string): Promise<void> => {
    if (!activeCredentialsSession) {
      throw new Error('No active login attempt. Start over.')
    }
    await activeCredentialsSession.submitSteamGuardCode(code)
  })

  ipcMain.handle('main:steam-credentials-cancel', async (): Promise<void> => {
    clearCredentialsSession()
  })
}
