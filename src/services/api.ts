/**
 * Axios instance configuration for API communication.
 *
 * Provides a centralized HTTP client with interceptors for error handling,
 * authentication, and request/response transformation.
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { handleAxiosError, logError, AppError } from '../utils/errorHandler'

/**
 * Create axios instance with default configuration.
 *
 * The baseURL is set dynamically via request interceptor to support
 * both development and production environments.
 */
export const apiClient = axios.create({
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
})

/**
 * Request interceptor to dynamically set the API base URL.
 *
 * Gets the URL from the Electron API to support both dev (localhost:5000)
 * and production (bundled Python server with dynamic port).
 */
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      // Get API URL from Electron main process
      const apiUrl = await window.electronAPI.getApiUrl()
      config.baseURL = apiUrl

      // Log request in development
      if (process.env.NODE_ENV === 'development') {
        console.debug(`[API Request] ${config.method?.toUpperCase()} ${config.url}`)
      }
    } catch (error) {
      console.error('Failed to get API URL:', error)
      logError(error, { context: 'get-api-url' })
      // Fallback to localhost in development
      config.baseURL = 'http://localhost:5001'
    }
    return config
  },
  (error) => {
    logError(error, { context: 'request-interceptor' })
    return Promise.reject(error)
  }
)

/**
 * Response interceptor for centralized error handling.
 *
 * Transforms API errors into a consistent format and logs them.
 */
apiClient.interceptors.response.use(
  (response) => {
    // Log successful requests in development
    if (process.env.NODE_ENV === 'development') {
      console.debug(
        `[API Response] ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`
      )
    }
    return response
  },
  (error: AxiosError) => {
    // Convert to standardized AppError
    const appError = handleAxiosError(error)

    // Log error with context
    logError(error, {
      url: error.config?.url,
      method: error.config?.method,
      status: appError.statusCode,
      code: appError.code,
      userMessage: appError.userMessage,
    })

    // Log to console for visibility
    console.error(`[API Error] ${appError.code}:`, appError.userMessage)

    // Reject with AppError for consistent error handling
    return Promise.reject(appError)
  }
)

/**
 * Type for API error responses (re-export from errorHandler).
 */
export type { AppError as APIError }

/**
 * Type guard for API errors (re-export from errorHandler).
 */
export { isAppError as isAPIError } from '../utils/errorHandler'

/**
 * Helper to extract error message from unknown error types (re-export from errorHandler).
 */
export { getUserMessage as getErrorMessage } from '../utils/errorHandler'
