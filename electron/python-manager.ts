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
  private port: number = 5000
  private restartAttempts: number = 0
  private readonly maxRestartAttempts: number = 3
  private readonly portRangeStart: number = 5000
  private readonly portRangeEnd: number = 5099
  private isShuttingDown: boolean = false

  /**
   * Start the Python backend process.
   */
  async start(): Promise<void> {
    console.log('[PythonManager] Starting Python backend...')

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

    // Spawn Python process
    this.process = spawn(
      pythonPath,
      [
        '-m',
        'uvicorn',
        'main:app',
        '--host',
        '127.0.0.1',
        '--port',
        this.port.toString(),
        '--reload',
      ],
      {
        cwd: backendPath,
        env: {
          ...process.env,
          RESOURCES_PATH: resourcesPath,
          PYTHONUNBUFFERED: '1',
        },
      }
    )

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
   * Wait for the backend to be healthy.
   */
  private async waitForHealth(timeoutMs: number = 10000): Promise<void> {
    const startTime = Date.now()
    const apiUrl = this.getApiUrl()

    while (Date.now() - startTime < timeoutMs) {
      try {
        const response = await axios.get(`${apiUrl}/health`, { timeout: 1000 })
        if (response.data.status === 'healthy') {
          console.log('[PythonManager] Health check passed')
          return
        }
      } catch (error) {
        // Keep trying
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
      console.log(
        `[PythonManager] Process exited with code ${code}, signal ${signal}`
      )
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
      await new Promise((resolve) =>
        setTimeout(resolve, 1000 * this.restartAttempts)
      )
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
   */
  stop(): void {
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
