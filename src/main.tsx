import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import App from './App'
import './styles/index.css'
import { restoreSession } from './auth/refresh'
import { env } from './config/env'
import { GlobalLoaderOverlay } from './components/GlobalLoaderOverlay'
import './i18n/config'

// ⏳ pendiente backend (modulos varios) — Activa MSW para endpoints temporales
// (connections, users suspend/activate, user sessions, feature/* pending) cuando
// VITE_MOCK_CONNECTIONS=true. Solo opera en modo desarrollo.
async function prepareMocks(): Promise<void> {
  if (!env.MOCK_CONNECTIONS || !env.DEV) return
  const { worker } = await import('./mocks/browser')
  await worker.start({ onUnhandledRequest: 'bypass' })
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: env.QUERY_RETRY_COUNT,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 15_000),
    },
  },
})

function AppBootstrap() {
  const { t } = useTranslation()
  const [isBootstrapping, setIsBootstrapping] = React.useState(true)

  React.useEffect(() => {
    let mounted = true
    restoreSession().finally(() => {
      if (mounted) setIsBootstrapping(false)
    })
    return () => {
      mounted = false
    }
  }, [])

  if (isBootstrapping) {
    return (
      <GlobalLoaderOverlay
        active
        skipDelays
        zIndexClassName="z-50"
        title={t('common.bootTitle')}
        description={t('common.bootDescription')}
      />
    )
  }

  return <App />
}

prepareMocks().then(() => {
  createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AppBootstrap />
        </BrowserRouter>
      </QueryClientProvider>
    </React.StrictMode>
  )
})
