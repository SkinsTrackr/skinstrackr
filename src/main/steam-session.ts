import SteamUser, { EResult } from 'steam-user'
import GlobalOffensive from 'globaloffensive'

/**
 * Singleton class to manage Steam session across the application
 */
class SteamSession {
  private static instance: SteamSession | null = null
  private userSession: SteamUser | null = null
  private csgoSession: GlobalOffensive | null = null
  private loggedIn: boolean = false
  private cachedSessionUserId: string | null = null

  private constructor() {
    /* empty */
  }

  /**
   * Get the singleton instance
   */
  static getInstance(): SteamSession {
    if (!SteamSession.instance) {
      SteamSession.instance = new SteamSession()
    }

    return SteamSession.instance
  }

  initializeUser(user: SteamUser): SteamUser {
    // If an instance exists, disconnect and create new
    if (this.userSession) {
      throw new Error('A SteamSession user already initialized')
    }

    this.userSession = user
    return this.userSession
  }

  /**
   * If not logged in, login user to Steam.
   * Eventually "logs out" cached user if different.
   */
  async loginUserToSteam(details: SteamUser.LogOnDetailsNameToken): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const loggedOnListener = (response): void => {
        this.cachedSessionUserId = null
        this.getUser().off('error', errorListener)
        resolve()
      }

      const errorListener = (err: Error & { eresult: number }): void => {
        this.getUser().off('loggedOn', loggedOnListener)
        reject(err)
      }

      this.getUser().once('loggedOn', loggedOnListener)
      this.getUser().once('error', errorListener)

      this.getUser().logOn(details)
    })
  }

  /**
   * If logged into steam keep user, unless different than cached user. Then we log out first.
   */
  async loginCachedUser(steamId: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const disconnectedListener = (eresult: EResult, msg?: string): void => {
        this.getUser().off('error', errorListener)
        if (eresult === EResult.OK) {
          this.cachedSessionUserId = steamId
          resolve()
        } else {
          reject()
        }
      }

      const errorListener = (err: Error & { eresult: number }): void => {
        this.getUser().off('disconnected', disconnectedListener)
        reject(err)
      }

      if (this.isLoggedIn()) {
        if (this.getSteamId() === steamId) {
          console.warn('Already logged in to the requested cached user:', steamId)
          return
        }

        this.getUser().once('disconnected', disconnectedListener)
        this.getUser().once('error', errorListener)

        // TODO test this
        console.log('Logging out from current user before logging in to cached user:', steamId)
        this.getUser().logOff()
      } else {
        this.cachedSessionUserId = steamId
        resolve()
      }
    })
  }

  getSteamId(): string | null {
    if (this.isLoggedIn()) {
      if (this.userSession && this.userSession.steamID) {
        return this.userSession.steamID.getSteamID64()
      }
      return null
    } else {
      return this.cachedSessionUserId
    }
  }

  getUser(): SteamUser {
    return this.userSession!
  }

  isLoggedIn(): boolean {
    return this.loggedIn
  }

  setLoggedIn(status: boolean): void {
    this.loggedIn = status
  }

  initializeCsgo(csgo: GlobalOffensive): GlobalOffensive {
    this.csgoSession = csgo
    return this.csgoSession
  }

  getCsgo(): GlobalOffensive | null {
    return this.csgoSession
  }

  /**
   * Destroy the singleton instance (for cleanup)
   */
  static destroy(): void {
    if (SteamSession.instance) {
      SteamSession.instance.userSession = null
      SteamSession.instance.csgoSession = null
      SteamSession.instance = null
    }
  }
}

export default SteamSession
