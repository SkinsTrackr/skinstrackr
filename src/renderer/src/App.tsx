import { Route, Routes, Navigate } from 'react-router'
import { useEffect, useState } from 'react'
import TopNavbar from './components/top-navbar'
import InventoryPage from './pages/inventory'
import BottomNavbar from './components/bottom-navbar'
import { useClientStore } from './contexts/ClientStoreContext'
import { useSession } from './contexts/SessionContext'
import SettingsPage from './pages/settings'
import LoadingScreen from './components/loading-screen'
import log from 'electron-log/renderer'
import { showToast } from './components/toast'

function App(): React.JSX.Element {
  const { settings } = useClientStore()
  const { loginCache } = useSession()
  const [appInitialized, setAppInitialized] = useState(false)

  // Listen for app initialization event from main process
  // Do ALL initialization logic here on startup
  useEffect(() => {
    const unsubscribe = window.api.onAppInitialized(async () => {
      try {
        if (settings.defaultAccountID) {
          log.info('Attempting to login with default account:', settings.defaultAccountID)
          await loginCache(settings.defaultAccountID)
        } else {
          log.error('No default account configured. This should not happen.')
          showToast('No default account configured. Please set a default account in settings.', 'error')
        }
      } catch (error) {
        log.error('Failed to check default account:', error)
      }
      setAppInitialized(true)
    })
    return unsubscribe
  }, [settings, loginCache])

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {!appInitialized && <LoadingScreen message="Initializing SkinsTrackr" />}
      <TopNavbar />
      <main className="flex-1 overflow-hidden bg-muted/10">
        <Routes>
          <Route path="/" element={<Navigate to="/inventory" replace />} />
          {/* <Route path="/overview" element={<DashboardPage />} /> */}
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>
      <BottomNavbar />
    </div>
  )
}

export default App
