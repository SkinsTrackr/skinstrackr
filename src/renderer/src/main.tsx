import '@/styles/globals.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router'
import App from './App'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from 'sonner'
import { ClientStoreProvider } from './contexts/ClientStoreContext'
import { InventoryProvider } from './contexts/InventoryContext'
import { SessionProvider } from './contexts/SessionContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <HashRouter>
        <ClientStoreProvider>
          <InventoryProvider>
            <SessionProvider>
              <App />
            </SessionProvider>
          </InventoryProvider>
        </ClientStoreProvider>
      </HashRouter>
      <Toaster position="bottom-right" expand={true} richColors duration={8000} theme="dark" />
    </ThemeProvider>
  </StrictMode>
)
