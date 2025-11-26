/**
 * Axios instance configuration for API communication.
 *
 * Provides a centralized HTTP client with interceptors for error handling,
 * authentication, and request/response transformation.
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

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
});

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
      const apiUrl = await window.electronAPI.getApiUrl();
      config.baseURL = apiUrl;
    } catch (error) {
      console.error('Failed to get API URL:', error);
      // Fallback to localhost in development
      config.baseURL = 'http://localhost:5000';
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor for centralized error handling.
 *
 * Transforms API errors into a consistent format and logs them.
 */
apiClient.interceptors.response.use(
  (response) => {
    // Success responses pass through unchanged
    return response;
  },
  (error: AxiosError) => {
    // Handle different types of errors
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const data = error.response.data as { detail?: string };

      console.error(`API Error (${status}):`, data.detail || error.message);

      // Transform error for consistent handling
      return Promise.reject({
        status,
        message: data.detail || error.message || 'An error occurred',
        originalError: error,
      });
    } else if (error.request) {
      // Request made but no response received (network error)
      console.error('Network Error:', error.message);

      return Promise.reject({
        status: 0,
        message: 'Unable to connect to the server. Please check your connection.',
        originalError: error,
      });
    } else {
      // Error setting up the request
      console.error('Request Error:', error.message);

      return Promise.reject({
        status: -1,
        message: error.message || 'An unexpected error occurred',
        originalError: error,
      });
    }
  }
);

/**
 * Type for API error responses.
 */
export interface APIError {
  status: number;
  message: string;
  originalError: AxiosError;
}

/**
 * Type guard for API errors.
 */
export const isAPIError = (error: unknown): error is APIError => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    'message' in error &&
    'originalError' in error
  );
};

/**
 * Helper to extract error message from unknown error types.
 */
export const getErrorMessage = (error: unknown): string => {
  if (isAPIError(error)) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unknown error occurred';
};
