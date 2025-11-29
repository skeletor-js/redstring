import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import './styles/theme.css'

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

// Log Electron API availability
if (window.electronAPI) {
  window.electronAPI.getAppVersion().then((version) => {
    console.log(`Redstring v${version}`)
  })
} else {
  console.log(
    '%c🌐 Browser Mode',
    'background: #3b82f6; color: white; padding: 2px 8px; border-radius: 4px;',
    '- Running without Electron. Using fallback API at http://localhost:5000'
  )
}
