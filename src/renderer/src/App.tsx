import { Route, Routes, useLocation, useNavigate } from 'react-router'
import LoginPage from './pages/login'
import { useEffect, useRef } from 'react'
import TopNavbar from './components/top-navbar'
import InventoryPage from './pages/inventory'
import BottomNavbar from './components/bottom-navbar'
import { useClientStore } from './contexts/ClientStoreContext'
import { useSession } from './contexts/SessionContext'

function App(): React.JSX.Element {
  const location = useLocation()
  const navigate = useNavigate()
  const { loadSettings, loadAccounts } = useClientStore()
  const { loginCache } = useSession()
  const hideNavbars = location.pathname === '/'
  const checkedDefaultAccount = useRef(false)

  // Login default account if cache exists
  useEffect(() => {
    if (checkedDefaultAccount.current) return
    checkedDefaultAccount.current = true

    const checkDefaultAccount = async (): Promise<void> => {
      try {
        const loadedSettings = await loadSettings()
        if (loadedSettings.defaultAccountID) {
          await loginCache(loadedSettings.defaultAccountID)
          await loadSettings()
          await loadAccounts()
          navigate('/inventory')
        }
      } catch (error) {
        console.error('Failed to check default account:', error)
      }
    }

    checkDefaultAccount()
  }, [loadSettings, loadAccounts, location.pathname, navigate, loginCache])

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {!hideNavbars && <TopNavbar />}
      <main className="flex-1 overflow-hidden bg-muted/10">
        <Routes>
          <Route path="/" element={<LoginPage />} />
          {/* <Route path="/overview" element={<DashboardPage />} /> */}
          <Route path="/inventory" element={<InventoryPage />} />
        </Routes>
      </main>
      {!hideNavbars && <BottomNavbar />}
    </div>
  )
}

export default App
