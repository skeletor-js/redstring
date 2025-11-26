/**
 * Preload script for Redstring Electron application.
 *
 * Provides a secure IPC bridge between the main process and renderer
 * with context isolation enabled. Exposes only safe, read-only APIs
 * to the renderer process.
 *
 * Security features:
 * - No file system access exposed
 * - No process spawning exposed
 * - Read-only operations only
 * - Type-safe interface
 */

import { contextBridge, ipcRenderer } from 'electron'

/**
 * Electron API interface exposed to the renderer process.
 */
export interface ElectronAPI {
  /**
   * Get the API port number.
   */
  getApiPort: () => Promise<number>

  /**
   * Get the full API URL.
   */
  getApiUrl: () => Promise<string>

  /**
   * Register a callback for backend ready events.
   */
  onBackendReady: (callback: () => void) => void

  /**
   * Register a callback for backend error events.
   */
  onBackendError: (callback: (error: string) => void) => void

  /**
   * Get the application version.
   */
  getAppVersion: () => Promise<string>
}

/**
 * Electron API implementation.
 */
const electronAPI: ElectronAPI = {
  getApiPort: () => ipcRenderer.invoke('get-api-port'),

  getApiUrl: () => ipcRenderer.invoke('get-api-url'),

  onBackendReady: (callback: () => void) => {
    ipcRenderer.on('backend-ready', callback)
  },

  onBackendError: (callback: (error: string) => void) => {
    ipcRenderer.on('backend-error', (_event, error) => callback(error))
  },

  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
}

/**
 * Expose the Electron API to the renderer process via context bridge.
 */
contextBridge.exposeInMainWorld('electronAPI', electronAPI)
