export interface ClientStore {
  schemaVersion: number
  settings: Settings
  accounts: Record<string, Account>
}

export interface Settings {
  defaultAccountID?: string // SteamID64
}

export interface Account {
  steamID: string // SteamID64
  username?: string
  avatarUrl?: string
}
