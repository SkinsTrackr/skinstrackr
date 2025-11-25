import Store from 'electron-store'
import { Account, ClientStore, Settings } from '@shared/interfaces/store.types'
import SteamUser from 'steam-user'

// Handle both ES module and CommonJS import patterns
const StoreConstructor = (Store as unknown as { default: typeof Store }).default || Store
const store = new StoreConstructor<ClientStore>({
  defaults: {
    settings: {},
    accounts: {}
  }
})

export const settings = {
  getSettings: (): Settings => store.get('settings'),
  setSettings: (value: Settings) => store.set('settings', value)
}

export const accounts = {
  getAccounts: (): Record<string, Account> => store.get('accounts'),

  /**
   * Updates an existing account or adds a new one if not present
   */
  setAccount: async (user: SteamUser): Promise<void> => {
    if (!user.steamID) {
      throw new Error('Cannot update account metadata: User has no SteamID')
    }
    const steamId = user.steamID!.getSteamID64()
    const persona = await (await user.getPersonas([user.steamID?.getSteamID64() || ''])).personas[steamId]
    const currSettings = store.get('settings')
    const currAccounts = store.get('accounts')

    // New account
    if (!currAccounts[steamId]) {
      currAccounts[steamId] = {
        steamID: steamId
      }
    }
    currAccounts[steamId].username = user.accountInfo?.name || undefined
    currAccounts[steamId].avatarUrl = persona.avatar_url_icon

    // Set new account if no default set
    if (!currSettings.defaultAccountID) {
      currSettings.defaultAccountID = steamId
    }

    store.set('accounts', currAccounts)
    store.set('settings', currSettings)
  }
}
