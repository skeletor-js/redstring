/**
 * Redstring Electron main process.
 *
 * Handles:
 * - Window management (1200x800, hide until ready)
 * - Python backend integration via PythonManager
 * - IPC handlers for renderer communication
 * - Security: context isolation, sandbox, no node integration
 * - Single instance lock
 * - Navigation blocking for security
 */

import { app, BrowserWindow, ipcMain } from 'electron'
import * as path from 'path'
import { PythonManager } from './python-manager'

let mainWindow: BrowserWindow | null = null
let pythonManager: PythonManager | null = null

/**
 * Create the main application window.
 */
function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
    show: false, // Show when ready-to-show
  })

  // Load renderer (Vite dev server in dev, bundled HTML in production)
  const isDev = process.env.VITE_DEV_SERVER_URL !== undefined
  if (isDev) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL!)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
    console.log('[Main] Window shown')
  })

  // Security: block external navigation
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const allowedOrigins = ['http://localhost:3000', 'http://localhost:5000']
    try {
      const urlObj = new URL(url)
      if (
        !allowedOrigins.includes(urlObj.origin) &&
        !url.startsWith('file://')
      ) {
        event.preventDefault()
        console.warn(`[Security] Blocked navigation to: ${url}`)
      }
    } catch (error) {
      // Invalid URL, block it
      event.preventDefault()
      console.warn(`[Security] Blocked invalid URL: ${url}`)
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

/**
 * Start the Python backend process.
 */
async function startPythonBackend(): Promise<void> {
  try {
    pythonManager = new PythonManager()
    await pythonManager.start()

    // Notify renderer that backend is ready
    mainWindow?.webContents.send('backend-ready')
    console.log('[Main] Python backend ready, renderer notified')
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    console.error('[Main] Failed to start Python backend:', errorMessage)
    mainWindow?.webContents.send('backend-error', errorMessage)
  }
}

/**
 * Setup IPC handlers for renderer communication.
 */
function setupIPCHandlers(): void {
  ipcMain.handle('get-api-port', () => {
    return pythonManager?.getPort() ?? null
  })

  ipcMain.handle('get-api-url', () => {
    return pythonManager?.getApiUrl() ?? null
  })

  ipcMain.handle('get-app-version', () => {
    return app.getVersion()
  })
}

/**
 * Application ready event.
 */
app.on('ready', async () => {
  // Single instance lock - only allow one instance of the app
  const gotLock = app.requestSingleInstanceLock()
  if (!gotLock) {
    console.log('[Main] Another instance is already running, quitting')
    app.quit()
    return
  }

  console.log('[Main] App ready, initializing...')

  // Setup IPC handlers
  setupIPCHandlers()

  // Create window and start backend
  createWindow()
  await startPythonBackend()

  console.log('[Main] Initialization complete')
})

/**
 * All windows closed event.
 */
app.on('window-all-closed', () => {
  // On macOS, apps typically stay open until explicitly quit
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

/**
 * Activate event (macOS).
 */
app.on('activate', () => {
  // On macOS, re-create window when dock icon is clicked
  if (mainWindow === null) {
    createWindow()
  }
})

/**
 * Before quit event - cleanup.
 */
app.on('before-quit', () => {
  console.log('[Main] App quitting, stopping Python backend...')
  pythonManager?.stop()
})

/**
 * Second instance event - focus existing window.
 */
app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore()
    }
    mainWindow.focus()
  }
})
