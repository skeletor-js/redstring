import React, { useEffect, useState } from 'react'
import './App.css'

interface BackendStatus {
  connected: boolean
  apiUrl: string | null
  version: string | null
  error: string | null
}

function App() {
  const [status, setStatus] = useState<BackendStatus>({
    connected: false,
    apiUrl: null,
    version: null,
    error: null,
  })

  useEffect(() => {
    async function initBackend() {
      try {
        const apiUrl = await window.electronAPI.getApiUrl()
        setStatus((prev) => ({ ...prev, apiUrl }))

        // Test connection to backend
        const response = await fetch(`${apiUrl}/health`)
        const data = await response.json()

        if (data.status === 'healthy') {
          setStatus((prev) => ({
            ...prev,
            connected: true,
            version: data.version,
          }))
        }
      } catch (error) {
        setStatus((prev) => ({
          ...prev,
          error:
            error instanceof Error ? error.message : 'Connection failed',
        }))
      }
    }

    initBackend()

    // Listen for backend events
    window.electronAPI.onBackendReady(() => {
      console.log('Backend ready event received')
      initBackend()
    })

    window.electronAPI.onBackendError((error) => {
      setStatus((prev) => ({ ...prev, error, connected: false }))
    })
  }, [])

  return (
    <div className="app">
      <header className="app-header">
        <h1>Redstring</h1>
        <p className="subtitle">Murder Accountability Project Case Analyzer</p>
      </header>

      <main className="app-main">
        <div className="status-card">
          <h2>Backend Status</h2>
          <div className="status-grid">
            <div className="status-item">
              <span className="label">Connection:</span>
              <span
                className={`value ${status.connected ? 'success' : 'error'}`}
              >
                {status.connected ? '✓ Connected' : '✗ Disconnected'}
              </span>
            </div>
            <div className="status-item">
              <span className="label">API URL:</span>
              <span className="value">{status.apiUrl ?? 'N/A'}</span>
            </div>
            <div className="status-item">
              <span className="label">Version:</span>
              <span className="value">{status.version ?? 'N/A'}</span>
            </div>
            {status.error && (
              <div className="status-item error-item">
                <span className="label">Error:</span>
                <span className="value">{status.error}</span>
              </div>
            )}
          </div>
        </div>

        <div className="info-card">
          <h3>Phase 2: Electron + Python Bridge</h3>
          <p>✅ Electron main process running</p>
          <p>✅ Python FastAPI backend spawned</p>
          <p>✅ IPC communication established</p>
          <p>🔄 Ready for Phase 3: Database & Data Pipeline</p>
        </div>
      </main>
    </div>
  )
}

export default App
