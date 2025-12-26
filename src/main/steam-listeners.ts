import SteamSession from './steam-session'
import SteamUser, { EResult } from 'steam-user'
import { GameSessionEventType, SteamSessionEventType } from '@shared/enums/session-type'
import { accounts } from './util/client-store-utils'
import { getMainWindow } from './index'

export function setupSteamListeners(): void {
  const user = SteamSession.getInstance().getUser()

  console.log('Setting up Steam listeners...')

  user.on('loggedOn', async (response) => {
    SteamSession.getInstance().setLoggedIn(true)
    console.log('🚀 Logged in successfully', response)

    // Update client-store account info BEFORE notifying renderer
    await accounts.setAccount(user)

    // Notify renderer about login status
    getMainWindow()?.webContents.send('renderer:steam-session-event', {
      eventType: SteamSessionEventType.LOGIN_SUCCESS,
      message: 'Logged in successfully',
      user: {
        id: SteamSession.getInstance().getSteamId(),
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

    // Other cs2 session active
    if (err.eresult === EResult.AlreadyLoggedInElsewhere || err.eresult === EResult.LoggedInElsewhere) {
      session.setLoggedIn(false)
      getMainWindow()?.webContents.send('renderer:steam-session-event', {
        eventType: SteamSessionEventType.LOGIN_FAILURE_OTHER_SESSION_ACTIVE,
        message: 'Login failed: Another session is active. Close other session then try login again.',
        user: {
          id: SteamSession.getInstance().getSteamId(),
          username: user.accountInfo?.name
        }
      })
      return
    }

    // Probably tried to login, but failed
    if (!session.isLoggedIn()) {
      session.setLoggedIn(false)
      getMainWindow()?.webContents.send('renderer:steam-session-event', {
        eventType: SteamSessionEventType.LOGIN_FAILURE,
        message: `Login failed: ${SteamUser.EResult[err.eresult] || err || 'Unknown error'}`,
        user: {
          id: SteamSession.getInstance().getSteamId(),
          username: user.accountInfo?.name
        }
      })
    }
    // Got logged out for some fatal reason. So we should relogin
    else if (SteamSession.getInstance().getUser()?.steamID) {
      session.setLoggedIn(false)
      getMainWindow()?.webContents.send('renderer:steam-session-event', {
        eventType: SteamSessionEventType.DISCONNECTED_SHOULD_RELOGIN,
        message: `Got disconnected: ${SteamUser.EResult[err.eresult] || err || 'Unknown error'}. Logged out`,
        user: {
          id: SteamSession.getInstance().getSteamId(),
          username: user.accountInfo?.name
        }
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

    if (eresult === EResult.NoConnection) {
      getMainWindow()?.webContents.send('renderer:steam-session-event', {
        eventType: SteamSessionEventType.DISCONNECTED_LOGOUT,
        message: `Successfully logged out from Steam.`,
        user: {
          id: SteamSession.getInstance().getSteamId(),
          username: user.accountInfo?.name
        }
      })
    } else {
      getMainWindow()?.webContents.send('renderer:steam-session-event', {
        eventType: SteamSessionEventType.DISCONNECTED,
        message: `Disconnected from Steam: ${SteamUser.EResult[eresult] || msg || 'Unknown reason'}. Will attempt to relogin...`,
        user: {
          id: SteamSession.getInstance().getSteamId(),
          username: user.accountInfo?.name
        }
      })
    }
  })

  // App launch
  user.on('appLaunched', (appid: unknown) => {
    console.log('App Launched', appid)
    // 4004 = ClientHello in TF2
    //client.sendToGC(appid, 4004, {}, Buffer.alloc(0));
  })

  //   user.on('receivedFromGC', (msgType, appid, payload) => {
  //     console.log(`Received message ${msgType} from GC ${appid} with ${payload.length} bytes`)
  //   })
}

export function setupCsgoListeners(): void {
  const user = SteamSession.getInstance().getUser()
  const csgo = SteamSession.getInstance().getCsgo()!

  console.log('Setting up CSGO listeners...')

  csgo.on('connectedToGC', () => {
    console.log(`🎮 Connected to CSGO Game Coordinator [${csgo.haveGCSession}]`)

    getMainWindow()?.webContents.send('renderer:game-session-event', {
      eventType: GameSessionEventType.CONNECTED,
      message: `Connected to CSGO Game Coordinator`,
      user: {
        id: SteamSession.getInstance().getSteamId(),
        username: user.accountInfo?.name
      }
    })
  })

  csgo.on('disconnectedFromGC', (reason) => {
    console.log('❌ Disconnected from CSGO GC:', reason)

    getMainWindow()?.webContents.send('renderer:game-session-event', {
      eventType: GameSessionEventType.DISCONNECTED,
      message: `Disconnected from CSGO GC: ${reason}`,
      user: {
        id: SteamSession.getInstance().getSteamId(),
        username: user.accountInfo?.name
      }
    })
  })

  //   csgo.on('debug', (info) => {
  //     console.error('CSGO GC debug:', info)
  //   })
}
