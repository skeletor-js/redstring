/**
 * ComingSoon Component
 *
 * A reusable placeholder component for features under development.
 * Displays a friendly message with an icon indicating the feature
 * is coming soon.
 */

import './ComingSoon.css'

export interface ComingSoonProps {
  /** Title displayed above the message (defaults to "Coming Soon") */
  title?: string
  /** Custom message to display (defaults to friendly "working out kinks" message) */
  message?: string
  /** Icon to display - can be an emoji or icon character */
  icon?: string
}

export function ComingSoon({
  title = 'Coming Soon',
  message = "Coming soon! We're working out some kinks.",
  icon = '🔧',
}: ComingSoonProps) {
  return (
    <div className="coming-soon">
      <div className="coming-soon-icon" aria-hidden="true">
        {icon}
      </div>
      <h2 className="coming-soon-title">{title}</h2>
      <p className="coming-soon-message">{message}</p>
    </div>
  )
}
