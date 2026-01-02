import { Route, Routes, useLocation, Navigate } from 'react-router'
import { useEffect, useRef } from 'react'
import TopNavbar from './components/top-navbar'
import InventoryPage from './pages/inventory'
import BottomNavbar from './components/bottom-navbar'
import { useClientStore } from './contexts/ClientStoreContext'
import { useSession } from './contexts/SessionContext'

function App(): React.JSX.Element {
  const location = useLocation()
  const { loadSettings, accounts, accountsLoaded } = useClientStore()
  const { loginCache } = useSession()
  const hideNavbars = location.pathname === '/'
  const checkedDefaultAccount = useRef(false)

  // Login default account if cache exists - wait for accounts to be loaded
  useEffect(() => {
    if (checkedDefaultAccount.current) return

    // Wait for accounts to finish loading (regardless of whether they're empty or not)
    if (!accountsLoaded) {
      console.log('Waiting for accounts to load...')
      return
    }

    checkedDefaultAccount.current = true

    const checkDefaultAccount = async (): Promise<void> => {
      try {
        const loadedSettings = await loadSettings()
        if (loadedSettings.defaultAccountID) {
          console.log('Attempting to login with default account:', loadedSettings.defaultAccountID)
          await loginCache(loadedSettings.defaultAccountID)
        } else {
          console.log('No default account configured')
        }
      } catch (error) {
        console.error('Failed to check default account:', error)
      }
    }

    checkDefaultAccount()
  }, [loadSettings, accounts, accountsLoaded, loginCache])

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {!hideNavbars && <TopNavbar />}
      <main className="flex-1 overflow-hidden bg-muted/10">
        <Routes>
          <Route path="/" element={<Navigate to="/inventory" replace />} />
          {/* <Route path="/overview" element={<DashboardPage />} /> */}
          <Route path="/inventory" element={<InventoryPage />} />
          {/* <Route path="/settings" element={<SettingsPage />} /> */}
        </Routes>
      </main>
      {!hideNavbars && <BottomNavbar />}
    </div>
  )
}

export default App
