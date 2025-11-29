/**
 * TimelineSummary - Summary statistics panel for timeline data.
 *
 * Displays key metrics and trend indicators for the selected time range.
 */

import React from 'react'
import { TimelineSummaryStats } from '../../types/timeline'

/**
 * TimelineSummary component props.
 */
interface TimelineSummaryProps {
  /** Summary statistics to display */
  stats: TimelineSummaryStats | null
  /** Whether data is loading */
  isLoading?: boolean
}

/**
 * Trend indicator component.
 */
const TrendIndicator: React.FC<{
  direction: 'up' | 'down' | 'stable'
  percentage: number
}> = ({ direction, percentage }) => {
  const getIcon = () => {
    switch (direction) {
      case 'up':
        return (
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="currentColor"
            className="trend-icon trend-up"
          >
            <path d="M8 4l4 4H9v4H7V8H4l4-4z" />
          </svg>
        )
      case 'down':
        return (
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="currentColor"
            className="trend-icon trend-down"
          >
            <path d="M8 12l-4-4h3V4h2v4h3l-4 4z" />
          </svg>
        )
      default:
        return (
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="currentColor"
            className="trend-icon trend-stable"
          >
            <path d="M2 8h12v1H2V8z" />
          </svg>
        )
    }
  }

  const getLabel = () => {
    switch (direction) {
      case 'up':
        return `+${percentage.toFixed(1)}%`
      case 'down':
        return `-${percentage.toFixed(1)}%`
      default:
        return 'Stable'
    }
  }

  return (
    <span className={`trend-indicator trend-${direction}`}>
      {getIcon()}
      <span className="trend-label">{getLabel()}</span>
    </span>
  )
}

/**
 * TimelineSummary component.
 *
 * Displays summary statistics for the timeline data.
 */
export const TimelineSummary: React.FC<TimelineSummaryProps> = ({
  stats,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="timeline-summary timeline-summary-loading">
        <div className="timeline-summary-skeleton" />
        <div className="timeline-summary-skeleton" />
        <div className="timeline-summary-skeleton" />
        <div className="timeline-summary-skeleton" />
      </div>
    )
  }

  if (!stats) {
    return null
  }

  return (
    <div className="timeline-summary">
      {/* Total cases */}
      <div className="timeline-summary-card">
        <div className="timeline-summary-label">Total Cases</div>
        <div className="timeline-summary-value">
          {stats.totalCases.toLocaleString()}
        </div>
        <div className="timeline-summary-trend">
          <TrendIndicator
            direction={stats.trendDirection}
            percentage={stats.trendPercentage}
          />
        </div>
      </div>

      {/* Average solve rate */}
      <div className="timeline-summary-card">
        <div className="timeline-summary-label">Avg Solve Rate</div>
        <div className="timeline-summary-value">
          {stats.averageSolveRate.toFixed(1)}%
        </div>
        <div className="timeline-summary-subtext">across selected period</div>
      </div>

      {/* Peak period */}
      <div className="timeline-summary-card">
        <div className="timeline-summary-label">Peak Period</div>
        <div className="timeline-summary-value">{stats.peakPeriod}</div>
        <div className="timeline-summary-subtext">
          {stats.peakCases.toLocaleString()} cases
        </div>
      </div>

      {/* Trend direction */}
      <div className="timeline-summary-card">
        <div className="timeline-summary-label">Overall Trend</div>
        <div className="timeline-summary-value trend-value">
          <TrendIndicator
            direction={stats.trendDirection}
            percentage={stats.trendPercentage}
          />
        </div>
        <div className="timeline-summary-subtext">
          {stats.trendDirection === 'up'
            ? 'Cases increasing'
            : stats.trendDirection === 'down'
              ? 'Cases decreasing'
              : 'Cases stable'}
        </div>
      </div>
    </div>
  )
}

export default TimelineSummary
