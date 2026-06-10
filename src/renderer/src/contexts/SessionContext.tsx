import { createContext, useContext, ReactNode, JSX, useEffect, useState, useCallback, Dispatch } from 'react'
import {
  CredentialsGuardResponse,
  CredentialsLoginRequest,
  GameSessionEvent,
  SteamSessionEvent,
  SteamLoginRequest
} from '@shared/interfaces/session.types'
import { GameSessionEventType, SteamSessionEventType, UserSessionType } from '@shared/enums/session-type'
import { showToast } from '../components/toast'
import { useInventory } from './InventoryContext'
import { useClientStore } from './ClientStoreContext'
import { Account, Settings } from '@shared/interfaces/store.types'
import { getCleanErrorMessage } from '@/lib/error-utils'
import log from 'electron-log/renderer'

interface SessionContextType {
  tokenLogin: (tokenDetails: SteamLoginRequest) => Promise<void>
  loginCache: (steamId: string) => Promise<void>
  startQrLogin: () => Promise<string>
  cancelQrLogin: () => Promise<void>
  startCredentialsLogin: (data: CredentialsLoginRequest) => Promise<CredentialsGuardResponse>
  submitCredentialsGuard: (code: string) => Promise<void>
  cancelCredentialsLogin: () => Promise<void>
  activeSteamId?: string
  userSession: UserSessionType
}

const SessionContext = createContext<SessionContextType | undefined>(undefined)

export function SessionProvider({ children }: { children: ReactNode }): JSX.Element {
  const { loadInventory } = useInventory()
  const { loadSettings, loadAccounts, accounts } = useClientStore()

  const [activeSteamId, setActiveSteamId] = useState<string | undefined>(undefined)
  const [userSession, setUserSession] = useState<UserSessionType>(UserSessionType.NONE)

  const tokenLogin = useCallback(async (tokenDetails: SteamLoginRequest): Promise<void> => {
    try {
      const returnedSteamId = await window.api.tokenLogin(tokenDetails)
      setActiveSteamId(returnedSteamId)
      // Inventory will be loaded when we receive CONNECTED game session event
    } catch (error) {
      log.error('Failed to login to Steam: ', error)
      showToast('Failed to login to Steam: ' + getCleanErrorMessage(error), 'error')
      throw error
    }
  }, [])

  const loginCache = useCallback(
    async (steamId: string): Promise<void> => {
      try {
        const account: Account | undefined = accounts[steamId]

        if (!account) {
          throw new Error('No account found for cached SteamID: ' + steamId)
        }

        const returnedSteamId = await window.api.loginCache(steamId)
        setActiveSteamId(returnedSteamId)
        setUserSession(UserSessionType.CACHE)
        await loadInventory(true, false)
        showToast('Loaded ' + account.username + ' from cache', 'info')
      } catch (error) {
        log.error('Failed to load cache:', error)
        showToast('Failed to load cache: ' + getCleanErrorMessage(error), 'error')
        throw error
      }
    },
    [accounts, loadInventory]
  )

  const startQrLogin = useCallback(async (): Promise<string> => {
    try {
      return await window.api.startQrLogin()
    } catch (error) {
      log.error('Failed to start QR login: ', error)
      showToast('Failed to start QR login: ' + getCleanErrorMessage(error), 'error')
      throw error
    }
  }, [])

  const cancelQrLogin = useCallback(async (): Promise<void> => {
    try {
      await window.api.cancelQrLogin()
    } catch (error) {
      log.error('Failed to cancel QR login: ', error)
    }
  }, [])

  const startCredentialsLogin = useCallback(
    async (data: CredentialsLoginRequest): Promise<CredentialsGuardResponse> => {
      try {
        return await window.api.startCredentialsLogin(data)
      } catch (error) {
        log.error('Failed to start credentials login: ', error)
        throw error
      }
    },
    []
  )

  const submitCredentialsGuard = useCallback(async (code: string): Promise<void> => {
    try {
      await window.api.submitCredentialsGuard(code)
    } catch (error) {
      log.error('Failed to submit Steam Guard code: ', error)
      throw error
    }
  }, [])

  const cancelCredentialsLogin = useCallback(async (): Promise<void> => {
    try {
      await window.api.cancelCredentialsLogin()
    } catch (error) {
      log.error('Failed to cancel credentials login: ', error)
    }
  }, [])

  useGlobalEvents(
    loadInventory,
    loginCache,
    loadSettings,
    loadAccounts,
    setUserSession,
    setActiveSteamId,
    activeSteamId
  )

  return (
    <SessionContext.Provider
      value={{
        tokenLogin,
        loginCache,
        startQrLogin,
        cancelQrLogin,
        startCredentialsLogin,
        submitCredentialsGuard,
        cancelCredentialsLogin,
        activeSteamId,
        userSession
      }}
    >
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
  setUserSession: Dispatch<React.SetStateAction<UserSessionType>>,
  setActiveSteamId: Dispatch<React.SetStateAction<string | undefined>>,
  activeSteamId: string | undefined
): void {
  useEffect(() => {
    log.debug('Setting up global event listeners...')

    const unsubscribeSteam = window.api.onSteamSessionEvent((value: SteamSessionEvent) => {
      log.debug('Received Steam session event: ', value)
      const steamId = value.user?.id || activeSteamId

      switch (value.eventType) {
        case SteamSessionEventType.LOGIN_SUCCESS:
          if (value.user?.id) setActiveSteamId(value.user.id)
          setUserSession(UserSessionType.LOGGED_IN_OFFLINE) // Game coordinator will decide online status
          showToast('Logged in to Steam', 'success')
          loadSettings()
          loadAccounts()
          break
        case SteamSessionEventType.LOGIN_FAILURE:
          setUserSession(UserSessionType.NONE)
          showToast(value.message, 'error')
          if (steamId) loginCache(steamId)
          break
        case SteamSessionEventType.LOGIN_FAILURE_OTHER_SESSION_ACTIVE:
          setUserSession(UserSessionType.NONE)
          // TODO give option to force logout other session?
          showToast('Login failed: Another session is active. Log out there first, then reconnect', 'error')
          if (steamId) loginCache(steamId)
          break
        case SteamSessionEventType.DISCONNECTED_LOGOUT:
          log.debug(activeSteamId, steamId)
          setUserSession(UserSessionType.CACHE)
          showToast(value.message, 'info')
          break
        case SteamSessionEventType.DISCONNECTED:
          setUserSession(UserSessionType.LOGGED_IN_OFFLINE)
          showToast(value.message, 'error')
          break
        case SteamSessionEventType.DISCONNECTED_SHOULD_RELOGIN:
          setUserSession(UserSessionType.NONE)
          showToast(value.message, 'error')
          if (steamId) loginCache(steamId)
          break
      }
    })

    const unsubscribeGame = window.api.onGameSessionEvent((value: GameSessionEvent) => {
      log.debug('Received Game session event: ', value)

      switch (value.eventType) {
        case GameSessionEventType.CONNECTED:
          showToast('Connected to CS2', 'success')
          setUserSession(UserSessionType.LOGGED_IN_ONLINE)
          // We load inventory every time the user logs in, but only changed containers.
          loadInventory(false, true)
          break
        case GameSessionEventType.DISCONNECTED:
          showToast('Disconnected from CS2', 'error')
          setUserSession(UserSessionType.LOGGED_IN_OFFLINE)
          break
      }
    })

    return () => {
      log.debug('Cleaning up global event listeners...')
      unsubscribeSteam()
      unsubscribeGame()
    }
  }, [loadInventory, loginCache, activeSteamId, loadSettings, loadAccounts, setUserSession, setActiveSteamId])
}
