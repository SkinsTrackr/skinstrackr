import { createContext, useContext, useState, ReactNode, JSX, useCallback, useEffect } from 'react'
import { Account, Settings } from '@shared/interfaces/store.types'
import log from 'electron-log/renderer'

interface ClientStoreContextType {
  settings: Settings
  loadSettings: () => Promise<Settings>
  saveSettings: (settings: Settings) => Promise<void>
  accounts: Record<string, Account>
  loadAccounts: () => Promise<Record<string, Account>>
  accountsLoaded: boolean
}

const ClientStoreContext = createContext<ClientStoreContextType | undefined>(undefined)

export function ClientStoreProvider({ children }: { children: ReactNode }): JSX.Element {
  const [settings, setSettings] = useState<Settings>({})
  const [accounts, setAccounts] = useState<Record<string, Account>>({})
  const [accountsLoaded, setAccountsLoaded] = useState(false)

  const loadSettings = useCallback(async (): Promise<Settings> => {
    try {
      const result = await window.api.loadSettings()
      setSettings(result)
      return result
    } catch (error) {
      log.error('Failed to load settings:', error)
      throw error
    }
  }, [])

  const saveSettings = useCallback(async (newSettings: Settings): Promise<void> => {
    try {
      await window.api.saveSettings(newSettings)
      setSettings(newSettings)
    } catch (error) {
      log.error('Failed to save settings:', error)
      throw error
    }
  }, [])

  const loadAccounts = useCallback(async (): Promise<Record<string, Account>> => {
    try {
      setAccountsLoaded(false)
      const result = await window.api.loadAccounts()
      setAccounts(result)
      return result
    } catch (error) {
      log.error('Failed to load accounts:', error)
      throw error
    } finally {
      setAccountsLoaded(true)
    }
  }, [])

  // Load accounts on mount so they're always available.
  // This also avoids race conditions
  useEffect(() => {
    loadAccounts().catch(log.error)
    loadSettings().catch(log.error)
  }, [loadAccounts, loadSettings])

  return (
    <ClientStoreContext.Provider
      value={{ settings, loadSettings, saveSettings, accounts, loadAccounts, accountsLoaded }}
    >
      {children}
    </ClientStoreContext.Provider>
  )
}

export function useClientStore(): ClientStoreContextType {
  const context = useContext(ClientStoreContext)
  if (context === undefined) {
    throw new Error('useClientStore must be used within an ClientStoreProvider')
  }
  return context
}
