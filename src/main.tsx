import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import './styles/index.css'
import { restoreSession } from './auth/refresh'
import { env } from './config/env'
import { GlobalLoaderOverlay } from './components/GlobalLoaderOverlay'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: env.QUERY_RETRY_COUNT,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 15_000),
    },
  },
})

function AppBootstrap() {
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
        title="Iniciando KeyGo"
        description="Estamos validando tu sesion para cargar la aplicacion de forma segura."
      />
    )
  }

  return <App />
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppBootstrap />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
)
