import { Route, Routes } from 'react-router'
import LoginPage from './pages/login'
import DashboardPage from './pages/dashboard'
import { SteamSessionEvent } from '@shared/interfaces/session.types'

function App(): React.JSX.Element {
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

window.api.onSteamSessionEvent((value: SteamSessionEvent) => {
  console.log('Received Steam session event in renderer: ', value)
})

export default App
