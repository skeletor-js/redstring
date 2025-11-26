/**
 * React Error Boundary Component
 *
 * Catches React component errors and displays a user-friendly error message.
 * Maintains Forensic Minimalism design aesthetic with clear, actionable error states.
 */

import { Component, ErrorInfo, ReactNode } from 'react'
import { logError } from '../utils/errorHandler'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: (error: Error, errorInfo: ErrorInfo, reset: () => void) => ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

/**
 * Error Boundary component that catches React errors in child components.
 *
 * Features:
 * - Catches errors in render methods, lifecycle methods, and constructors
 * - Logs errors to console and file (via errorHandler utility)
 * - Displays user-friendly error UI with reload option
 * - Supports custom fallback UI and error callbacks
 * - Does not catch errors in event handlers (use try/catch there)
 *
 * @example
 * ```tsx
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 * ```
 *
 * @example Custom fallback
 * ```tsx
 * <ErrorBoundary fallback={(error, errorInfo, reset) => (
 *   <CustomErrorUI error={error} onReset={reset} />
 * )}>
 *   <Component />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so next render shows fallback UI
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo)

    // Log to file via error handler utility
    logError(error, {
      componentStack: errorInfo.componentStack,
      type: 'react-error-boundary',
    })

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Update state with error info
    this.setState({
      errorInfo,
    })
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(
          this.state.error,
          this.state.errorInfo!,
          this.handleReset
        )
      }

      // Default error UI (Forensic Minimalism design)
      return (
        <div className="error-boundary-container">
          <div className="error-boundary-content">
            <div className="error-boundary-header">
              <h1 className="error-boundary-title">Application Error</h1>
              <div className="error-boundary-icon" aria-hidden="true">
                ⚠
              </div>
            </div>

            <div className="error-boundary-message">
              <p className="error-boundary-text">
                An unexpected error occurred in the application. This error has been
                logged.
              </p>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="error-boundary-details">
                  <h2 className="error-boundary-details-title">
                    Error Details (Dev Mode)
                  </h2>
                  <pre className="error-boundary-code">
                    <code>{this.state.error.toString()}</code>
                  </pre>
                  {this.state.errorInfo?.componentStack && (
                    <pre className="error-boundary-stack">
                      <code>{this.state.errorInfo.componentStack}</code>
                    </pre>
                  )}
                </div>
              )}
            </div>

            <div className="error-boundary-actions">
              <button
                className="error-boundary-button error-boundary-button-primary"
                onClick={this.handleReset}
              >
                Try Again
              </button>
              <button
                className="error-boundary-button error-boundary-button-secondary"
                onClick={() => window.location.reload()}
              >
                Reload Application
              </button>
            </div>
          </div>

          <style>{`
            .error-boundary-container {
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              padding: 2rem;
              background-color: var(--color-bg, #0a0a0a);
              color: var(--color-text, #e0e0e0);
              font-family: 'IBM Plex Mono', 'Courier New', monospace;
            }

            .error-boundary-content {
              max-width: 42rem;
              width: 100%;
              padding: 2rem;
              background-color: var(--color-surface, #1a1a1a);
              border: 1px solid var(--color-border, #333333);
              border-radius: 0.25rem;
            }

            .error-boundary-header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              margin-bottom: 1.5rem;
              padding-bottom: 1rem;
              border-bottom: 1px solid var(--color-border, #333333);
            }

            .error-boundary-title {
              margin: 0;
              font-size: 1.5rem;
              font-weight: 600;
              color: var(--color-error, #dc2626);
              letter-spacing: -0.025em;
            }

            .error-boundary-icon {
              font-size: 2rem;
              opacity: 0.8;
            }

            .error-boundary-message {
              margin-bottom: 1.5rem;
            }

            .error-boundary-text {
              margin: 0 0 1rem 0;
              font-size: 0.875rem;
              line-height: 1.5;
              color: var(--color-text-secondary, #a0a0a0);
            }

            .error-boundary-details {
              margin-top: 1.5rem;
              padding: 1rem;
              background-color: var(--color-bg, #0a0a0a);
              border: 1px solid var(--color-border, #333333);
              border-radius: 0.25rem;
            }

            .error-boundary-details-title {
              margin: 0 0 0.75rem 0;
              font-size: 0.75rem;
              font-weight: 600;
              color: var(--color-text-secondary, #a0a0a0);
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }

            .error-boundary-code,
            .error-boundary-stack {
              margin: 0.5rem 0 0 0;
              padding: 0.75rem;
              background-color: rgba(0, 0, 0, 0.5);
              border-radius: 0.25rem;
              font-size: 0.75rem;
              line-height: 1.5;
              color: var(--color-error, #dc2626);
              overflow-x: auto;
              white-space: pre-wrap;
              word-break: break-word;
            }

            .error-boundary-stack {
              color: var(--color-text-secondary, #a0a0a0);
            }

            .error-boundary-actions {
              display: flex;
              gap: 0.75rem;
              margin-top: 1.5rem;
            }

            .error-boundary-button {
              flex: 1;
              padding: 0.75rem 1.5rem;
              font-family: 'IBM Plex Mono', 'Courier New', monospace;
              font-size: 0.875rem;
              font-weight: 500;
              border: none;
              border-radius: 0.25rem;
              cursor: pointer;
              transition: all 0.2s ease;
            }

            .error-boundary-button-primary {
              background-color: var(--color-primary, #3b82f6);
              color: white;
            }

            .error-boundary-button-primary:hover {
              background-color: var(--color-primary-hover, #2563eb);
            }

            .error-boundary-button-secondary {
              background-color: transparent;
              color: var(--color-text-secondary, #a0a0a0);
              border: 1px solid var(--color-border, #333333);
            }

            .error-boundary-button-secondary:hover {
              background-color: rgba(255, 255, 255, 0.05);
              border-color: var(--color-text-secondary, #a0a0a0);
            }

            .error-boundary-button:active {
              transform: translateY(1px);
            }

            .error-boundary-button:focus-visible {
              outline: 2px solid var(--color-primary, #3b82f6);
              outline-offset: 2px;
            }
          `}</style>
        </div>
      )
    }

    return this.props.children
  }
}
