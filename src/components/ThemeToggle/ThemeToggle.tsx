/**
 * ThemeToggle - Investigation Mode Switcher
 *
 * Switches between Lab Mode (light) and Evidence Room (dark) with a
 * forensic-inspired toggle design. No generic sun/moon icons here.
 */

import React from 'react'
import { useUIStore } from '../../stores/useUIStore'
import './ThemeToggle.css'

export const ThemeToggle: React.FC = () => {
  const theme = useUIStore((state) => state.theme)
  const toggleTheme = useUIStore((state) => state.toggleTheme)

  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'Lab Mode' : 'Evidence Room'}`}
      title={`Current: ${isDark ? 'Evidence Room' : 'Lab Mode'}`}
    >
      {/* Toggle track */}
      <div className="theme-toggle__track">
        {/* Mode labels */}
        <span className="theme-toggle__label theme-toggle__label--left">LAB</span>
        <span className="theme-toggle__label theme-toggle__label--right">EVIDENCE</span>

        {/* Sliding indicator */}
        <div
          className={`theme-toggle__indicator ${isDark ? 'theme-toggle__indicator--dark' : ''}`}
        >
          <svg
            className="theme-toggle__icon"
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {isDark ? (
              /* Evidence tag icon - for dark mode */
              <>
                <rect
                  x="1"
                  y="3"
                  width="10"
                  height="6"
                  rx="1"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <circle cx="6" cy="6" r="1" fill="currentColor" />
                <line
                  x1="3"
                  y1="1"
                  x2="3"
                  y2="3"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </>
            ) : (
              /* Lab flask icon - for light mode */
              <>
                <path
                  d="M4 1.5h4M5 1.5v2.5l-2 4.5c-.5 1 .2 2 1.5 2h3c1.3 0 2-.5 1.5-2l-2-4.5V1.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </>
            )}
          </svg>
        </div>
      </div>

      {/* Status indicator line */}
      <div className="theme-toggle__status">
        <div className="theme-toggle__status-bar">
          <span className="theme-toggle__status-text">
            {isDark ? 'EVIDENCE ROOM' : 'LAB MODE'}
          </span>
        </div>
      </div>
    </button>
  )
}
