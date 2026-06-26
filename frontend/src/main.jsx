import React, { Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as Sentry from '@sentry/react'
import App from './App'
import 'leaflet/dist/leaflet.css'
import './index.css'
import './i18n/i18n'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
    tracesSampleRate: 0.2,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  })
}

const Fallback = () => (
  <div className="flex items-center justify-center h-screen text-gray-500">Yuklanmoqda...</div>
)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={<Fallback />}>
        <App />
      </Suspense>
    </QueryClientProvider>
  </React.StrictMode>
)
