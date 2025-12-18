import { createContext, useContext, ReactNode, JSX, useRef, useEffect, useState } from 'react'
import { LoginRequest } from '@shared/interfaces/login.types'
import { GameSessionEvent, SteamSessionEvent } from '@shared/interfaces/session.types'
import { GameSessionEventType, SteamSessionEventType } from '@shared/enums/session-type'
import { showToast } from '../components/toast'
import { useNavigate } from 'react-router'
import { useInventory } from './InventoryContext'

interface SessionContextType {
  loginSteam: (tokenDetails: LoginRequest) => Promise<void>
  loginCache: (steamId: string) => Promise<void>
  activeSteamId: string
  isLoggedInSteam: boolean
  isLoggedInCache: boolean
}

const SessionContext = createContext<SessionContextType | undefined>(undefined)

export function SessionProvider({ children }: { children: ReactNode }): JSX.Element {
  const { loadInventory } = useInventory()

  const [isLoggedInSteam, setIsLoggedInSteam] = useState(false)
  const [isLoggedInCache, setIsLoggedInCache] = useState(false)
  const [activeSteamId, setActiveSteamId] = useState('')

  const loginSteam = async (tokenDetails: LoginRequest): Promise<void> => {
    try {
      const returnedSteamId = await window.api.loginSteam(tokenDetails)
      setActiveSteamId(returnedSteamId)
      setIsLoggedInSteam(true)
      setIsLoggedInCache(false)
      // Inventory will be loaded when we receive CONNECTED game session event
    } catch (error) {
      console.error('Failed to load settings:', error)
      throw error
    }
  }
  const loginCache = async (steamId: string): Promise<void> => {
    try {
      const returnedSteamId = await window.api.loginCache(steamId)
      setActiveSteamId(returnedSteamId)
      setIsLoggedInSteam(false)
      setIsLoggedInCache(true)
      await loadInventory(true, false)
    } catch (error) {
      console.error('Failed to load settings:', error)
      throw error
    }
  }

  useGlobalEvents(loadInventory, loginCache, activeSteamId)

  return (
    <SessionContext.Provider value={{ loginSteam, loginCache, activeSteamId, isLoggedInSteam, isLoggedInCache }}>
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
  activeSteamId: string
): void {
  const navigate = useNavigate()
  const registered = useRef(false) // Fix double-registration in <StrictMode>

  useEffect(() => {
    if (registered.current) return
    registered.current = true

    window.api.onSteamSessionEvent((value: SteamSessionEvent) => {
      console.log('Received Steam session event: ', value)

      switch (value.eventType) {
        case SteamSessionEventType.LOGIN_SUCCESS:
          showToast('Logged in successfully!', 'success')
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
          break
        case SteamSessionEventType.DISCONNECTED_SHOULD_RELOGIN:
          showToast(value.message, 'error')
          loginCache(value.user?.id || activeSteamId)
          break
      }
    })

    window.api.onGameSessionEvent((value: GameSessionEvent) => {
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
  }, [navigate, loadInventory, loginCache, activeSteamId])
}
