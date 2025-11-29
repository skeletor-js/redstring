/**
 * Python subprocess manager for Redstring.
 *
 * Manages the Python FastAPI backend lifecycle including:
 * - Port detection and health checks
 * - Automatic restart on crash
 * - Graceful shutdown
 * - Development vs production path resolution
 */

import { spawn, ChildProcess } from 'child_process'
import * as path from 'path'
import * as net from 'net'
import axios from 'axios'
import { app } from 'electron'

export class PythonManager {
  private process: ChildProcess | null = null
  private port: number = 5001
  private restartAttempts: number = 0
  private readonly maxRestartAttempts: number = 3
  private readonly portRangeStart: number = 5001
  private readonly portRangeEnd: number = 5099
  private isShuttingDown: boolean = false
  private isDevMode: boolean = false
  private readonly devModePort: number = 5000 // Port used by npm run dev:backend

  /**
   * Start the Python backend process.
   * In development mode, connects to existing backend started by npm run dev:backend.
   * In production mode, spawns and manages the bundled Python backend.
   */
  async start(): Promise<void> {
    console.log('[PythonManager] Starting Python backend...')

    // Check if we're in development mode (Vite dev server running)
    const isDev = !app.isPackaged

    if (isDev) {
      // In development, check if backend is already running on dev port
      const devBackendRunning = await this.checkHealthAt(this.devModePort)
      if (devBackendRunning) {
        console.log(
          `[PythonManager] Development mode: Using existing backend on port ${this.devModePort}`
        )
        this.port = this.devModePort
        this.isDevMode = true
        return
      }
      console.log(
        '[PythonManager] Development mode: No existing backend found, starting new one...'
      )
    }

    // Find available port
    this.port = await this.findAvailablePort()
    console.log(`[PythonManager] Using port ${this.port}`)

    // Get paths
    const pythonPath = this.getPythonPath()
    const backendPath = this.getBackendPath()
    const resourcesPath = this.getResourcesPath()

    console.log(`[PythonManager] Python path: ${pythonPath}`)
    console.log(`[PythonManager] Backend path: ${backendPath}`)
    console.log(`[PythonManager] Resources path: ${resourcesPath}`)

    // Build args - different for dev vs production
    let args: string[]
    if (app.isPackaged) {
      // Production: PyInstaller bundle, run directly with server args
      args = ['--host', '127.0.0.1', '--port', this.port.toString()]
    } else {
      // Development: use python3 with uvicorn module
      args = [
        '-m',
        'uvicorn',
        'main:app',
        '--host',
        '127.0.0.1',
        '--port',
        this.port.toString(),
        '--reload',
      ]
    }

    // Spawn Python process
    this.process = spawn(pythonPath, args, {
      cwd: backendPath,
      env: {
        ...process.env,
        RESOURCES_PATH: resourcesPath,
        PYTHONUNBUFFERED: '1',
      },
    })

    this.setupProcessHandlers()
    await this.waitForHealth()
    console.log('[PythonManager] Python backend started successfully')
  }

  /**
   * Find an available port in the configured range.
   */
  private async findAvailablePort(): Promise<number> {
    for (let port = this.portRangeStart; port <= this.portRangeEnd; port++) {
      if (await this.isPortAvailable(port)) {
        return port
      }
    }
    throw new Error(
      `No available ports in range ${this.portRangeStart}-${this.portRangeEnd}`
    )
  }

  /**
   * Check if a port is available.
   */
  private isPortAvailable(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const server = net.createServer()
      server.once('error', () => resolve(false))
      server.once('listening', () => {
        server.close()
        resolve(true)
      })
      server.listen(port, '127.0.0.1')
    })
  }

  /**
   * Check if backend is healthy at a specific port.
   */
  private async checkHealthAt(port: number): Promise<boolean> {
    try {
      const response = await axios.get(`http://127.0.0.1:${port}/health`, {
        timeout: 2000,
      })
      return response.data.status === 'healthy'
    } catch (error) {
      return false
    }
  }

  /**
   * Wait for the backend to be healthy.
   * Increased timeout to 30 seconds for production where backend may need
   * more time to initialize database connections and load data.
   */
  private async waitForHealth(timeoutMs: number = 30000): Promise<void> {
    const startTime = Date.now()
    const apiUrl = this.getApiUrl()

    console.log(
      `[PythonManager] Waiting for backend health (timeout: ${timeoutMs}ms)...`
    )

    while (Date.now() - startTime < timeoutMs) {
      try {
        const response = await axios.get(`${apiUrl}/health`, { timeout: 2000 })
        if (response.data.status === 'healthy') {
          const elapsed = Date.now() - startTime
          console.log(`[PythonManager] Health check passed after ${elapsed}ms`)
          return
        }
      } catch (error) {
        // Keep trying - log progress every 5 seconds
        const elapsed = Date.now() - startTime
        if (elapsed > 0 && elapsed % 5000 < 500) {
          console.log(
            `[PythonManager] Still waiting for backend... (${Math.round(elapsed / 1000)}s)`
          )
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
    throw new Error(`Python backend failed to start within ${timeoutMs}ms`)
  }

  /**
   * Setup process event handlers for stdout, stderr, and exit.
   */
  private setupProcessHandlers(): void {
    if (!this.process) return

    this.process.stdout?.on('data', (data) => {
      const output = data.toString().trim()
      if (output) {
        console.log(`[Python] ${output}`)
      }
    })

    this.process.stderr?.on('data', (data) => {
      const output = data.toString().trim()
      if (output) {
        console.error(`[Python Error] ${output}`)
      }
    })

    this.process.on('exit', (code, signal) => {
      console.log(`[PythonManager] Process exited with code ${code}, signal ${signal}`)
      if (!this.isShuttingDown) {
        this.handleCrash()
      }
    })

    this.process.on('error', (error) => {
      console.error(`[PythonManager] Process error:`, error)
    })
  }

  /**
   * Handle unexpected process crash with auto-restart.
   */
  private async handleCrash(): Promise<void> {
    if (this.restartAttempts < this.maxRestartAttempts) {
      this.restartAttempts++
      console.log(
        `[PythonManager] Attempting restart (${this.restartAttempts}/${this.maxRestartAttempts})`
      )
      await new Promise((resolve) => setTimeout(resolve, 1000 * this.restartAttempts))
      try {
        await this.start()
        // Reset restart attempts on successful start
        this.restartAttempts = 0
      } catch (error) {
        console.error('[PythonManager] Restart failed:', error)
      }
    } else {
      console.error('[PythonManager] Max restart attempts reached, giving up')
    }
  }

  /**
   * Get the Python executable path (dev vs production).
   */
  private getPythonPath(): string {
    // Development: use system python3
    // Production: use bundled Python executable
    if (app.isPackaged) {
      const platform = process.platform
      if (platform === 'darwin') {
        return path.join(process.resourcesPath, 'backend', 'backend')
      } else if (platform === 'win32') {
        return path.join(process.resourcesPath, 'backend', 'backend.exe')
      }
    }
    return 'python3'
  }

  /**
   * Get the backend directory path (dev vs production).
   */
  private getBackendPath(): string {
    if (app.isPackaged) {
      return path.join(process.resourcesPath, 'backend')
    }
    return path.join(app.getAppPath(), 'backend')
  }

  /**
   * Get the resources directory path (dev vs production).
   */
  private getResourcesPath(): string {
    if (app.isPackaged) {
      return path.join(process.resourcesPath, 'resources')
    }
    return path.join(app.getAppPath(), 'resources')
  }

  /**
   * Stop the Python backend process gracefully.
   * In development mode with external backend, does nothing.
   */
  stop(): void {
    // Don't stop external dev backend
    if (this.isDevMode) {
      console.log('[PythonManager] Development mode: Not stopping external backend')
      return
    }

    if (!this.process) return

    this.isShuttingDown = true
    console.log('[PythonManager] Stopping Python backend...')

    // Try graceful shutdown with SIGTERM
    this.process.kill('SIGTERM')

    // Force kill after 5 seconds if still running
    setTimeout(() => {
      if (this.process && !this.process.killed) {
        console.log('[PythonManager] Force killing Python process')
        this.process.kill('SIGKILL')
      }
    }, 5000)
  }

  /**
   * Get the current port number.
   */
  getPort(): number {
    return this.port
  }

  /**
   * Get the full API URL.
   */
  getApiUrl(): string {
    return `http://127.0.0.1:${this.port}`
  }
}
