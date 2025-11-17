import { Route, Routes, useLocation, useNavigate } from 'react-router'
import LoginPage from './pages/login'
import DashboardPage from './pages/dashboard'
import { GameSessionEvent, SteamSessionEvent } from '@shared/interfaces/session.types'
import { GameSessionEventType, SteamSessionEventType } from '@shared/enums/session-type'
import { showToast } from './components/toast'
import { useEffect, useRef } from 'react'
import TopNavbar from './components/top-navbar'
import InventoryPage from './pages/inventory'
import { InventoryProvider } from './contexts/InventoryContext'
import BottomNavbar from './components/bottom-navbar'

function App(): React.JSX.Element {
  const location = useLocation()
  const hideNavbars = location.pathname === '/'
  useGlobalEvents()

  return (
    <InventoryProvider>
      <div className="flex h-full flex-col overflow-hidden">
        {!hideNavbars && <TopNavbar />}
        <main className="flex-1 overflow-hidden bg-muted/10">
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/overview" element={<DashboardPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
          </Routes>
        </main>
        {!hideNavbars && <BottomNavbar />}
      </div>
    </InventoryProvider>
  )
}

function useGlobalEvents(): void {
  const navigate = useNavigate()
  const location = useLocation()
  const registered = useRef(false) // Fix double-registration in <StrictMode>

  useEffect(() => {
    if (registered.current) return
    registered.current = true

    window.api.onSteamSessionEvent((value: SteamSessionEvent) => {
      console.log('Received Steam session event: ', value)

      switch (value.eventType) {
        case SteamSessionEventType.LOGIN_SUCCESS:
          if (location.pathname == '/') {
            navigate('/dashboard')
            showToast('Logged in successfully!', 'success')
          }
          break
        case SteamSessionEventType.LOGIN_FAILURE:
          showToast(value.message, 'error')
          break
        case SteamSessionEventType.LOGIN_FAILURE_OTHER_SESSION_ACTIVE:
          // TODO give option to force logout other session?
          showToast('Login failed: Another session is active', 'error')
          break
        case SteamSessionEventType.DISCONNECTED:
          // TODO unless user manually logged out
          showToast(value.message, 'error')
          break
        case SteamSessionEventType.DISCONNECTED_SHOULD_RELOGIN:
          showToast(value.message, 'error')
          navigate('/')
          break
      }
    })

    window.api.onGameSessionEvent((value: GameSessionEvent) => {
      console.log('Received Game session event: ', value)

      switch (value.eventType) {
        case GameSessionEventType.CONNECTED:
          showToast('Connected to CS2', 'success')
          break
        case GameSessionEventType.DISCONNECTED:
          showToast('Disconnected from CS2', 'error')
          break
      }
    })
  }, [])
}

export default App
