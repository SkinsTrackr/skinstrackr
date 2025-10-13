import { Route, Routes } from 'react-router'
import LoginPage from './pages/login'
import DashboardPage from './pages/dashboard'

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

export default App
