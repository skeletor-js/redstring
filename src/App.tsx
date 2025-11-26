import { useEffect, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './App.css'
import { Welcome } from './components/onboarding/Welcome'
import { SetupProgress } from './components/onboarding/SetupProgress'
import { Layout } from './components/Layout/Layout'
import { useSyncTheme } from './stores/useUIStore'
import { ErrorBoundary } from './components/ErrorBoundary'
import { logError } from './utils/errorHandler'

// Create a client for React Query with error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
})

interface BackendStatus {
  connected: boolean
  apiUrl: string | null
  version: string | null
  error: string | null
}

interface SetupStatus {
  initialized: boolean
  record_count: number
  database_exists: boolean
}

type AppState = 'loading' | 'welcome' | 'setup' | 'ready' | 'error'

/**
 * Check if running in Electron environment.
 * Returns true if window.electronAPI is available.
 */
const isElectron = (): boolean => {
  return typeof window !== 'undefined' && window.electronAPI !== undefined
}

/**
 * Default API URL for browser development mode.
 * Used when running outside of Electron.
 * Note: Port 5000 is used by macOS Control Center, so we use 5001.
 */
const BROWSER_DEV_API_URL = 'http://localhost:5001'

function App() {
  const [appState, setAppState] = useState<AppState>('loading')
  const [status, setStatus] = useState<BackendStatus>({
    connected: false,
    apiUrl: null,
    version: null,
    error: null,
  })
  const [_setupStatus, setSetupStatus] = useState<SetupStatus | null>(null)
  const [isBrowserMode, setIsBrowserMode] = useState<boolean>(false)

  // Sync theme to document element
  useSyncTheme()

  useEffect(() => {
    async function initBackend() {
      try {
        let apiUrl: string

        // Check if running in Electron or browser
        if (isElectron()) {
          apiUrl = await window.electronAPI.getApiUrl()
        } else {
          // Browser fallback mode - use default dev API URL
          console.log('Running in browser mode - using fallback API URL')
          setIsBrowserMode(true)
          apiUrl = BROWSER_DEV_API_URL
        }

        setStatus((prev) => ({ ...prev, apiUrl }))

        // Test connection to backend
        const healthResponse = await fetch(`${apiUrl}/health`)
        const healthData = await healthResponse.json()

        if (healthData.status === 'healthy') {
          setStatus((prev) => ({
            ...prev,
            connected: true,
            version: healthData.version,
          }))

          // Check setup status
          const setupResponse = await fetch(`${apiUrl}/api/setup/status`)
          const setupData: SetupStatus = await setupResponse.json()
          setSetupStatus(setupData)

          if (setupData.initialized) {
            setAppState('ready')
          } else {
            setAppState('welcome')
          }
        }
      } catch (error) {
        console.error('Backend initialization error:', error)
        setStatus((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Connection failed',
        }))
        setAppState('error')
      }
    }

    initBackend()

    // Listen for backend events (only in Electron mode)
    if (isElectron()) {
      window.electronAPI.onBackendReady(() => {
        console.log('Backend ready event received')
        initBackend()
      })

      window.electronAPI.onBackendError((error) => {
        setStatus((prev) => ({ ...prev, error, connected: false }))
        setAppState('error')
      })
    }
  }, [])

  const handleBeginSetup = () => {
    setAppState('setup')
  }

  const handleSetupComplete = async () => {
    // Verify setup completed successfully
    try {
      if (status.apiUrl) {
        const setupResponse = await fetch(`${status.apiUrl}/api/setup/status`)
        const setupData: SetupStatus = await setupResponse.json()
        setSetupStatus(setupData)

        if (setupData.initialized) {
          setAppState('ready')
        }
      }
    } catch (error) {
      console.error('Error verifying setup:', error)
    }
  }

  // Loading state
  if (appState === 'loading') {
    return (
      <div className="app loading-screen">
        <div className="loading-content">
          <h1>Redstring</h1>
          <p>Connecting to backend...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (appState === 'error') {
    return (
      <div className="app error-screen">
        <div className="error-content">
          <h1>Connection Error</h1>
          <p>{status.error || 'Unable to connect to backend'}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    )
  }

  // Welcome screen (first-time setup)
  if (appState === 'welcome') {
    return <Welcome onBeginSetup={handleBeginSetup} />
  }

  // Setup in progress
  if (appState === 'setup') {
    return <SetupProgress onComplete={handleSetupComplete} />
  }

  // Main application (ready state)
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Log errors to console and file
        logError(error, {
          componentStack: errorInfo.componentStack,
          context: 'app-root-boundary',
        })
      }}
    >
      <QueryClientProvider client={queryClient}>
        <div className="app">
          <Layout />
        </div>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
