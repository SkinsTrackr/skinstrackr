import { createContext, useContext, useState, ReactNode, JSX, useCallback } from 'react'
import { Account, Settings } from '@shared/interfaces/store.types'

interface ClientStoreContextType {
  settings: Settings
  loadSettings: () => Promise<Settings>
  accounts: Record<string, Account>
  loadAccounts: () => Promise<Record<string, Account>>
}

const ClientStoreContext = createContext<ClientStoreContextType | undefined>(undefined)

export function ClientStoreProvider({ children }: { children: ReactNode }): JSX.Element {
  const [settings, setSettings] = useState<Settings>({})
  const [accounts, setAccounts] = useState<Record<string, Account>>({})

  const loadSettings = useCallback(async (): Promise<Settings> => {
    try {
      const result = await window.api.loadSettings()
      setSettings(result)
      return result
    } catch (error) {
      console.error('Failed to load settings:', error)
      throw error
    }
  }, [])

  const loadAccounts = useCallback(async (): Promise<Record<string, Account>> => {
    try {
      const result = await window.api.loadAccounts()
      setAccounts(result)
      return result
    } catch (error) {
      console.error('Failed to load accounts:', error)
      throw error
    }
  }, [])

  return (
    <ClientStoreContext.Provider value={{ settings, loadSettings, accounts, loadAccounts }}>
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
