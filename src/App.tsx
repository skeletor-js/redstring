import React, { useEffect, useState } from 'react';
import './App.css';
import { Welcome } from './components/onboarding/Welcome';
import { SetupProgress } from './components/onboarding/SetupProgress';

interface BackendStatus {
  connected: boolean;
  apiUrl: string | null;
  version: string | null;
  error: string | null;
}

interface SetupStatus {
  initialized: boolean;
  record_count: number;
  database_exists: boolean;
}

type AppState = 'loading' | 'welcome' | 'setup' | 'ready' | 'error';

function App() {
  const [appState, setAppState] = useState<AppState>('loading');
  const [status, setStatus] = useState<BackendStatus>({
    connected: false,
    apiUrl: null,
    version: null,
    error: null,
  });
  const [setupStatus, setSetupStatus] = useState<SetupStatus | null>(null);

  useEffect(() => {
    async function initBackend() {
      try {
        const apiUrl = await window.electronAPI.getApiUrl();
        setStatus((prev) => ({ ...prev, apiUrl }));

        // Test connection to backend
        const healthResponse = await fetch(`${apiUrl}/health`);
        const healthData = await healthResponse.json();

        if (healthData.status === 'healthy') {
          setStatus((prev) => ({
            ...prev,
            connected: true,
            version: healthData.version,
          }));

          // Check setup status
          const setupResponse = await fetch(`${apiUrl}/api/setup/status`);
          const setupData: SetupStatus = await setupResponse.json();
          setSetupStatus(setupData);

          if (setupData.initialized) {
            setAppState('ready');
          } else {
            setAppState('welcome');
          }
        }
      } catch (error) {
        console.error('Backend initialization error:', error);
        setStatus((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Connection failed',
        }));
        setAppState('error');
      }
    }

    initBackend();

    // Listen for backend events
    window.electronAPI.onBackendReady(() => {
      console.log('Backend ready event received');
      initBackend();
    });

    window.electronAPI.onBackendError((error) => {
      setStatus((prev) => ({ ...prev, error, connected: false }));
      setAppState('error');
    });
  }, []);

  const handleBeginSetup = () => {
    setAppState('setup');
  };

  const handleSetupComplete = async () => {
    // Verify setup completed successfully
    try {
      if (status.apiUrl) {
        const setupResponse = await fetch(`${status.apiUrl}/api/setup/status`);
        const setupData: SetupStatus = await setupResponse.json();
        setSetupStatus(setupData);

        if (setupData.initialized) {
          setAppState('ready');
        }
      }
    } catch (error) {
      console.error('Error verifying setup:', error);
    }
  };

  // Loading state
  if (appState === 'loading') {
    return (
      <div className="app loading-screen">
        <div className="loading-content">
          <h1>Redstring</h1>
          <p>Connecting to backend...</p>
        </div>
      </div>
    );
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
    );
  }

  // Welcome screen (first-time setup)
  if (appState === 'welcome') {
    return <Welcome onBeginSetup={handleBeginSetup} />;
  }

  // Setup in progress
  if (appState === 'setup') {
    return <SetupProgress onComplete={handleSetupComplete} />;
  }

  // Main application (ready state)
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
              <span className={`value ${status.connected ? 'success' : 'error'}`}>
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
            <div className="status-item">
              <span className="label">Records:</span>
              <span className="value success">
                {setupStatus?.record_count.toLocaleString() ?? 'N/A'}
              </span>
            </div>
          </div>
        </div>

        <div className="info-card">
          <h3>Phase 3: Database & Data Pipeline</h3>
          <p>✅ Database schema created (9 tables)</p>
          <p>✅ CSV data imported ({setupStatus?.record_count.toLocaleString()} records)</p>
          <p>✅ Indexes created for performance</p>
          <p>✅ Setup marked as complete</p>
          <p>🔄 Ready for Phase 4: Basic API & Frontend Skeleton</p>
        </div>
      </main>
    </div>
  );
}

export default App;
