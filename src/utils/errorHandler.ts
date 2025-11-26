/**
 * Error handling utilities for consistent error management.
 *
 * Provides utilities for:
 * - HTTP error handling with user-friendly messages
 * - Error logging to console and file
 * - Retry logic for transient failures
 * - Network timeout handling
 */

import { AxiosError } from 'axios'

/**
 * Standard error interface for application errors.
 */
export interface AppError {
  code: string
  message: string
  userMessage: string
  statusCode?: number
  retryable: boolean
  originalError?: unknown
  context?: Record<string, unknown>
}

/**
 * Error codes for different error types.
 */
export enum ErrorCode {
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  DATABASE_ERROR = 'DATABASE_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * User-friendly error messages mapped to error codes.
 */
const USER_ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ErrorCode.NETWORK_ERROR]:
    'Unable to connect to the server. Please check your connection and try again.',
  [ErrorCode.TIMEOUT_ERROR]: 'The request took too long to complete. Please try again.',
  [ErrorCode.SERVER_ERROR]:
    'A server error occurred. Please try again in a few moments.',
  [ErrorCode.NOT_FOUND]: 'The requested resource was not found.',
  [ErrorCode.BAD_REQUEST]: 'Invalid request. Please check your input and try again.',
  [ErrorCode.UNAUTHORIZED]: 'You are not authorized to perform this action.',
  [ErrorCode.FORBIDDEN]: 'Access to this resource is forbidden.',
  [ErrorCode.DATABASE_ERROR]: 'A database error occurred. Please try again later.',
  [ErrorCode.VALIDATION_ERROR]: 'Validation failed. Please check your input.',
  [ErrorCode.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again.',
}

/**
 * HTTP status codes that indicate retryable errors.
 */
const RETRYABLE_STATUS_CODES = [408, 429, 500, 502, 503, 504]

/**
 * Converts an Axios error to a standardized AppError.
 *
 * @param error - Axios error from HTTP request
 * @returns Standardized AppError object
 *
 * @example
 * ```ts
 * try {
 *   await apiClient.get('/api/cases');
 * } catch (error) {
 *   const appError = handleAxiosError(error);
 *   console.error(appError.userMessage);
 * }
 * ```
 */
export function handleAxiosError(error: unknown): AppError {
  if (!(error instanceof Error)) {
    return {
      code: ErrorCode.UNKNOWN_ERROR,
      message: 'An unknown error occurred',
      userMessage: USER_ERROR_MESSAGES[ErrorCode.UNKNOWN_ERROR],
      retryable: false,
      originalError: error,
    }
  }

  const axiosError = error as AxiosError

  // Network error (no response)
  if (axiosError.code === 'ECONNABORTED' || axiosError.code === 'ETIMEDOUT') {
    return {
      code: ErrorCode.TIMEOUT_ERROR,
      message: 'Request timeout',
      userMessage: USER_ERROR_MESSAGES[ErrorCode.TIMEOUT_ERROR],
      retryable: true,
      originalError: error,
    }
  }

  if (!axiosError.response) {
    return {
      code: ErrorCode.NETWORK_ERROR,
      message: axiosError.message || 'Network error',
      userMessage: USER_ERROR_MESSAGES[ErrorCode.NETWORK_ERROR],
      retryable: true,
      originalError: error,
    }
  }

  // Server responded with error status
  const status = axiosError.response.status
  const responseData = axiosError.response.data as { detail?: string }

  let code: ErrorCode
  let userMessage: string

  switch (status) {
    case 400:
      code = ErrorCode.BAD_REQUEST
      userMessage = responseData.detail || USER_ERROR_MESSAGES[code]
      break
    case 401:
      code = ErrorCode.UNAUTHORIZED
      userMessage = USER_ERROR_MESSAGES[code]
      break
    case 403:
      code = ErrorCode.FORBIDDEN
      userMessage = USER_ERROR_MESSAGES[code]
      break
    case 404:
      code = ErrorCode.NOT_FOUND
      userMessage = responseData.detail || USER_ERROR_MESSAGES[code]
      break
    case 408:
      code = ErrorCode.TIMEOUT_ERROR
      userMessage = USER_ERROR_MESSAGES[code]
      break
    case 422:
      code = ErrorCode.VALIDATION_ERROR
      userMessage = responseData.detail || USER_ERROR_MESSAGES[code]
      break
    case 500:
    case 502:
    case 503:
    case 504:
      code = ErrorCode.SERVER_ERROR
      userMessage = responseData.detail || USER_ERROR_MESSAGES[code]
      break
    default:
      code = ErrorCode.UNKNOWN_ERROR
      userMessage = responseData.detail || USER_ERROR_MESSAGES[code]
  }

  return {
    code,
    message: axiosError.message,
    userMessage,
    statusCode: status,
    retryable: RETRYABLE_STATUS_CODES.includes(status),
    originalError: error,
  }
}

/**
 * Logs an error to console and (in Electron) to file.
 *
 * @param error - Error to log
 * @param context - Additional context information
 *
 * @example
 * ```ts
 * try {
 *   await dangerousOperation();
 * } catch (error) {
 *   logError(error, { operation: 'dangerousOperation', userId: 123 });
 *   throw error;
 * }
 * ```
 */
export function logError(error: unknown, context?: Record<string, unknown>): void {
  const timestamp = new Date().toISOString()
  const errorMessage = error instanceof Error ? error.message : String(error)
  const errorStack = error instanceof Error ? error.stack : undefined

  // Console logging (always)
  console.error('[Error]', {
    timestamp,
    message: errorMessage,
    stack: errorStack,
    context,
  })

  // Electron IPC logging (if available) - currently not implemented
  // Future enhancement: Add logError to electronAPI interface
  // @ts-expect-error - logError is not yet in ElectronAPI interface
  if (window.electronAPI?.logError) {
    // @ts-expect-error - logError is not yet in ElectronAPI interface
    window.electronAPI.logError({
      timestamp,
      message: errorMessage,
      stack: errorStack,
      context,
    })
  }
}

/**
 * Retry configuration for transient failures.
 */
export interface RetryConfig {
  maxAttempts: number
  initialDelay: number // milliseconds
  maxDelay: number // milliseconds
  backoffMultiplier: number
  retryableErrors?: ErrorCode[]
}

/**
 * Default retry configuration.
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  retryableErrors: [
    ErrorCode.NETWORK_ERROR,
    ErrorCode.TIMEOUT_ERROR,
    ErrorCode.SERVER_ERROR,
  ],
}

/**
 * Delays execution for a specified duration.
 *
 * @param ms - Milliseconds to delay
 * @returns Promise that resolves after delay
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Retries an async operation with exponential backoff.
 *
 * @param operation - Async function to retry
 * @param config - Retry configuration
 * @returns Result of the operation
 * @throws Last error if all retries fail
 *
 * @example
 * ```ts
 * const data = await retryOperation(
 *   () => apiClient.get('/api/cases'),
 *   { maxAttempts: 3, initialDelay: 1000 }
 * );
 * ```
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config }
  let lastError: AppError | undefined
  let currentDelay = finalConfig.initialDelay

  for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
    try {
      return await operation()
    } catch (error) {
      const appError = handleAxiosError(error)
      lastError = appError

      // Check if error is retryable
      const isRetryable =
        appError.retryable &&
        (!finalConfig.retryableErrors ||
          finalConfig.retryableErrors.includes(appError.code as ErrorCode))

      // Don't retry if not retryable or last attempt
      if (!isRetryable || attempt === finalConfig.maxAttempts) {
        logError(error, {
          attempt,
          maxAttempts: finalConfig.maxAttempts,
          retryable: isRetryable,
        })
        throw error
      }

      // Log retry attempt
      console.warn(
        `Operation failed (attempt ${attempt}/${finalConfig.maxAttempts}). Retrying in ${currentDelay}ms...`,
        {
          error: appError.message,
          code: appError.code,
        }
      )

      // Wait before retrying
      await delay(currentDelay)

      // Exponential backoff
      currentDelay = Math.min(
        currentDelay * finalConfig.backoffMultiplier,
        finalConfig.maxDelay
      )
    }
  }

  // Should never reach here, but TypeScript doesn't know that
  throw lastError
}

/**
 * Creates a timeout promise that rejects after specified duration.
 *
 * @param ms - Timeout duration in milliseconds
 * @param message - Error message on timeout
 * @returns Promise that rejects after timeout
 *
 * @example
 * ```ts
 * await Promise.race([
 *   longRunningOperation(),
 *   createTimeout(30000, 'Operation timed out')
 * ]);
 * ```
 */
export function createTimeout(ms: number, message?: string): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(message || `Operation timed out after ${ms}ms`))
    }, ms)
  })
}

/**
 * Wraps an operation with timeout handling.
 *
 * @param operation - Async operation to execute
 * @param timeoutMs - Timeout in milliseconds
 * @param timeoutMessage - Custom timeout message
 * @returns Result of the operation
 * @throws Error if operation times out
 *
 * @example
 * ```ts
 * const data = await withTimeout(
 *   () => fetchLargeDataset(),
 *   30000,
 *   'Dataset fetch timed out'
 * );
 * ```
 */
export async function withTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs: number,
  timeoutMessage?: string
): Promise<T> {
  return Promise.race([operation(), createTimeout(timeoutMs, timeoutMessage)])
}

/**
 * Determines if an error is an AppError.
 *
 * @param error - Error to check
 * @returns True if error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    'userMessage' in error &&
    'retryable' in error
  )
}

/**
 * Extracts a user-friendly error message from any error type.
 *
 * @param error - Error of any type
 * @returns User-friendly error message
 *
 * @example
 * ```ts
 * try {
 *   await operation();
 * } catch (error) {
 *   toast.error(getUserMessage(error));
 * }
 * ```
 */
export function getUserMessage(error: unknown): string {
  if (isAppError(error)) {
    return error.userMessage
  }

  if (error instanceof Error) {
    // Check if it's an Axios error
    const axiosError = error as AxiosError
    if (axiosError.isAxiosError) {
      const appError = handleAxiosError(error)
      return appError.userMessage
    }

    return error.message
  }

  return USER_ERROR_MESSAGES[ErrorCode.UNKNOWN_ERROR]
}

/**
 * Type guard for Axios errors.
 */
export function isAxiosError(error: unknown): error is AxiosError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'isAxiosError' in error &&
    (error as AxiosError).isAxiosError === true
  )
}
