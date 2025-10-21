import { BrowserWindow } from 'electron'
import SteamSession from './steam-session'
import SteamUser, { EResult } from 'steam-user'
import { SteamSessionEventType } from '@shared/enums/session-type'

export function setupSteamListeners(): void {
  const user = SteamSession.getInstance().getUser()!

  console.log('Setting up Steam listeners...')

  user.on('loggedOn', (response) => {
    SteamSession.getInstance().setLoggedIn(true)
    console.log('🚀 Logged in successfully', response)

    // Notify renderer about login status
    BrowserWindow.getFocusedWindow()?.webContents.send('renderer:steam-session-event', {
      eventType: SteamSessionEventType.LOGIN_SUCCESS,
      message: 'Logged in successfully',
      user: {
        id: user.steamID,
        username: user.accountInfo?.name
      }
    })

    // TODO Check if we are logged in elsewhere with CSGO playing

    user.gamesPlayed([730], false)
  })

  // Emitted fatal error (Since we have autorelogin=true, else it would emit 'disconnected' event)
  user.on('error', (err: Error & { eresult: EResult }) => {
    console.error('Steam client error:', err)
    const session = SteamSession.getInstance()

    // Probably tried to login, but failed
    if (!session.isLoggedIn()) {
      session.setLoggedIn(false)
      BrowserWindow.getFocusedWindow()?.webContents.send('renderer:steam-session-event', {
        eventType: SteamSessionEventType.LOGIN_FAILURE,
        message: `Login failed: ${SteamUser.EResult[err.eresult] || err || 'Unknown error'}`
      })
    }
    // Got logged out for some fatal reason. So we should relogin
    else if (SteamSession.getInstance().getUser()?.steamID) {
      session.setLoggedIn(false)
      BrowserWindow.getFocusedWindow()?.webContents.send('renderer:steam-session-event', {
        eventType: SteamSessionEventType.DISCONNECTED_SHOULD_RELOGIN,
        message: `Got disconnected: ${SteamUser.EResult[err.eresult] || err || 'Unknown error'}`
      })
    }
    // We are still logged in, but got some other error
    else {
      console.log('Some weird error occurred: ', err)
      // TODO general event msg toast?
    }
  })

  // Logged off for some reason
  user.on('disconnected', (eresult: EResult, msg?: string) => {
    SteamSession.getInstance().setLoggedIn(false)
    console.log(`❌ Disconnected from Steam. Code: ${eresult}, Msg: ${msg}`)

    BrowserWindow.getFocusedWindow()?.webContents.send('renderer:steam-session-event', {
      eventType: SteamSessionEventType.DISCONNECTED,
      message: `Disconnected from Steam: ${SteamUser.EResult[eresult] || msg || 'Unknown reason'}`
    })
  })

  // App launch
  user.on('appLaunched', (appid: unknown) => {
    console.log('App Launched', appid)
    // 4004 = ClientHello in TF2
    //client.sendToGC(appid, 4004, {}, Buffer.alloc(0));
  })

  user.on('receivedFromGC', () => {
    // console.log(`Received message ${_msgType} from GC ${_appid} with ${_payload.length} bytes`)
  })
}

export function setupCsgoListeners(): void {
  const csgo = SteamSession.getInstance().getCsgo()!

  console.log('Setting up CSGO listeners...')

  csgo.on('connectedToGC', () => {
    console.log(`🎮 Connected to CSGO Game Coordinator [${csgo.haveGCSession}]`)
  })

  csgo.on('disconnectedFromGC', (reason) => {
    console.log('❌ Disconnected from CSGO GC:', reason)
  })
}
