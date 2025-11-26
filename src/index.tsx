import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
)

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
  console.warn('Electron API not available - running in browser?')
}
