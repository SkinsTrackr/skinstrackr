import SteamUser from 'steam-user'
import GlobalOffensive from 'globaloffensive'

/**
 * Singleton class to manage Steam session across the application
 */
class SteamSession {
  private static instance: SteamSession | null = null
  private user: SteamUser | null = null
  private csgo: GlobalOffensive | null = null
  private loggedIn: boolean = false

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
    if (this.user) {
      throw new Error('A SteamSession instance already initialized')
    }

    this.user = user
    return this.user
  }

  getUser(): SteamUser | null {
    return this.user
  }

  isLoggedIn(): boolean {
    return this.loggedIn
  }

  setLoggedIn(status: boolean): void {
    this.loggedIn = status
  }

  initializeCsgo(csgo: GlobalOffensive): GlobalOffensive {
    this.csgo = csgo
    return this.csgo
  }

  getCsgo(): GlobalOffensive | null {
    return this.csgo
  }

  /**
   * Destroy the singleton instance (for cleanup)
   */
  static destroy(): void {
    if (SteamSession.instance) {
      SteamSession.instance.user = null
      SteamSession.instance.csgo = null
      SteamSession.instance = null
    }
  }
}

export default SteamSession
