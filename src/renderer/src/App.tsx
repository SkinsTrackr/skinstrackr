import { Route, Routes, useLocation, useNavigate } from 'react-router'
import LoginPage from './pages/login'
import DashboardPage from './pages/dashboard'
import { GameSessionEvent, SteamSessionEvent } from '@shared/interfaces/session.types'
import { GameSessionEventType, SteamSessionEventType } from '@shared/enums/session-type'
import { showToast } from './components/toast'
import { useEffect, useRef } from 'react'

function App(): React.JSX.Element {
  useGlobalEvents()

  return (
    <>
      <div className="isolate"></div>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
      </Routes>
    </>
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
