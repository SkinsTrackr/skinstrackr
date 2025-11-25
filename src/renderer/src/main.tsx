import '@/styles/globals.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import App from './App'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from 'sonner'
import { ClientStoreProvider } from './contexts/ClientStoreContext'
import { InventoryProvider } from './contexts/InventoryContext'
import { SessionProvider } from './contexts/SessionContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <BrowserRouter>
        <ClientStoreProvider>
          <SessionProvider>
            <InventoryProvider>
              <App />
            </InventoryProvider>
          </SessionProvider>
        </ClientStoreProvider>
      </BrowserRouter>
      <Toaster position="bottom-right" expand={true} richColors duration={8000} theme="dark" />
    </ThemeProvider>
  </StrictMode>
)
