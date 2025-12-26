import { createContext, useContext, ReactNode, JSX, useEffect, useState, useCallback, Dispatch } from 'react'
import { GameSessionEvent, SteamSessionEvent, SteamLoginRequest } from '@shared/interfaces/session.types'
import { GameSessionEventType, SteamSessionEventType, UserSessionType } from '@shared/enums/session-type'
import { showToast } from '../components/toast'
import { useInventory } from './InventoryContext'
import { useClientStore } from './ClientStoreContext'
import { Account, Settings } from '@shared/interfaces/store.types'

interface SessionContextType {
  loginSteam: (tokenDetails: SteamLoginRequest) => Promise<void>
  loginCache: (steamId: string) => Promise<void>
  activeSteamId: string
  userSession: UserSessionType
}

const SessionContext = createContext<SessionContextType | undefined>(undefined)

export function SessionProvider({ children }: { children: ReactNode }): JSX.Element {
  const { loadInventory } = useInventory()
  const { loadSettings, loadAccounts } = useClientStore()

  const [activeSteamId, setActiveSteamId] = useState('')
  const [userSession, setUserSession] = useState<UserSessionType>(UserSessionType.NONE)

  const loginSteam = useCallback(async (tokenDetails: SteamLoginRequest): Promise<void> => {
    try {
      const returnedSteamId = await window.api.loginSteam(tokenDetails)
      setActiveSteamId(returnedSteamId)
      // Inventory will be loaded when we receive CONNECTED game session event
    } catch (error) {
      console.error('Failed to login to Steam:', error)
      throw error
    }
  }, [])

  const loginCache = useCallback(
    async (steamId: string): Promise<void> => {
      try {
        const returnedSteamId = await window.api.loginCache(steamId)
        setActiveSteamId(returnedSteamId)
        showToast('Logged in from cache', 'info')
        setUserSession(UserSessionType.CACHE)
        await loadInventory(true, false)
      } catch (error) {
        console.error('Failed to login to cache:', error)
        throw error
      }
    },
    [loadInventory]
  )

  useGlobalEvents(loadInventory, loginCache, loadSettings, loadAccounts, activeSteamId, setUserSession)

  return (
    <SessionContext.Provider value={{ loginSteam, loginCache, activeSteamId, userSession }}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSession(): SessionContextType {
  const context = useContext(SessionContext)
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider')
  }
  return context
}

function useGlobalEvents(
  loadInventory: (fromCache: boolean, onlyChangedContainers: boolean) => Promise<void>,
  loginCache: (steamId: string) => Promise<void>,
  loadSettings: () => Promise<Settings>,
  loadAccounts: () => Promise<Record<string, Account>>,
  activeSteamId: string,
  setUserSession: Dispatch<React.SetStateAction<UserSessionType>>
): void {
  useEffect(() => {
    console.log('Setting up global event listeners...')

    const unsubscribeSteam = window.api.onSteamSessionEvent((value: SteamSessionEvent) => {
      console.log('Received Steam session event: ', value)

      switch (value.eventType) {
        case SteamSessionEventType.LOGIN_SUCCESS:
          showToast('Logged in to Steam', 'success')
          setUserSession(UserSessionType.LOGGED_IN_ONLINE)
          loadSettings()
          loadAccounts()
          break
        case SteamSessionEventType.LOGIN_FAILURE:
          showToast(value.message, 'error')
          loginCache(value.user?.id || activeSteamId)
          break
        case SteamSessionEventType.LOGIN_FAILURE_OTHER_SESSION_ACTIVE:
          // TODO give option to force logout other session?
          showToast('Login failed: Another session is active', 'error')
          loginCache(value.user?.id || activeSteamId)
          break
        case SteamSessionEventType.DISCONNECTED_LOGOUT:
          showToast(value.message, 'info')
          break
        case SteamSessionEventType.DISCONNECTED:
          showToast(value.message, 'error')
          setUserSession(UserSessionType.LOGGED_IN_OFFLINE)
          break
        case SteamSessionEventType.DISCONNECTED_SHOULD_RELOGIN:
          showToast(value.message, 'error')
          loginCache(value.user?.id || activeSteamId)
          break
      }
    })

    const unsubscribeGame = window.api.onGameSessionEvent((value: GameSessionEvent) => {
      console.log('Received Game session event: ', value)

      switch (value.eventType) {
        case GameSessionEventType.CONNECTED:
          showToast('Connected to CS2', 'success')
          // We load inventory every time the user logs in, but only changed containers.
          // TODO: Could probably optimize a bit, but is it worth it?
          loadInventory(false, true)
          break
        case GameSessionEventType.DISCONNECTED:
          showToast('Disconnected from CS2', 'error')
          //   loadInventory(true, true)
          break
      }
    })

    return () => {
      console.log('Cleaning up global event listeners...')
      unsubscribeSteam()
      unsubscribeGame()
    }
  }, [loadInventory, loginCache, activeSteamId, loadSettings, loadAccounts, setUserSession])
}
