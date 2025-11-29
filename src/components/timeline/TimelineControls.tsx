/**
 * TimelineControls - Control panel component for timeline visualization.
 *
 * Provides controls for granularity, chart type, metric selection,
 * and moving average window.
 */

import React from 'react'
import {
  TimelineGranularity,
  TimelineChartType,
  TimelineMetric,
} from '../../types/timeline'

/**
 * TimelineControls component props.
 */
interface TimelineControlsProps {
  /** Current granularity setting */
  granularity: TimelineGranularity
  /** Callback when granularity changes */
  onGranularityChange: (granularity: TimelineGranularity) => void
  /** Current chart type */
  chartType: TimelineChartType
  /** Callback when chart type changes */
  onChartTypeChange: (chartType: TimelineChartType) => void
  /** Current metric for trend view */
  metric: TimelineMetric
  /** Callback when metric changes */
  onMetricChange: (metric: TimelineMetric) => void
  /** Current moving average window */
  movingAverageWindow: number
  /** Callback when moving average window changes */
  onMovingAverageWindowChange: (window: number) => void
  /** Whether trend view is enabled */
  showTrends: boolean
  /** Callback when trend view toggle changes */
  onShowTrendsChange: (show: boolean) => void
}

/**
 * TimelineControls component.
 *
 * Provides a control panel for configuring timeline visualization options.
 */
export const TimelineControls: React.FC<TimelineControlsProps> = ({
  granularity,
  onGranularityChange,
  chartType,
  onChartTypeChange,
  metric,
  onMetricChange,
  movingAverageWindow,
  onMovingAverageWindowChange,
  showTrends,
  onShowTrendsChange,
}) => {
  return (
    <div className="timeline-controls">
      {/* Granularity selector */}
      <div className="timeline-control-group">
        <label className="timeline-control-label">Time Period</label>
        <div className="timeline-button-group">
          <button
            className={`timeline-button ${granularity === 'decade' ? 'active' : ''}`}
            onClick={() => onGranularityChange('decade')}
            title="Group by decade"
          >
            Decade
          </button>
          <button
            className={`timeline-button ${granularity === 'year' ? 'active' : ''}`}
            onClick={() => onGranularityChange('year')}
            title="Group by year"
          >
            Year
          </button>
          <button
            className={`timeline-button ${granularity === 'month' ? 'active' : ''}`}
            onClick={() => onGranularityChange('month')}
            title="Group by month"
          >
            Month
          </button>
        </div>
      </div>

      {/* Chart type selector */}
      <div className="timeline-control-group">
        <label className="timeline-control-label">Chart Type</label>
        <div className="timeline-button-group">
          <button
            className={`timeline-button ${chartType === 'area' ? 'active' : ''}`}
            onClick={() => onChartTypeChange('area')}
            title="Stacked area chart"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M1 14V2h1v11h13v1H1zm2-3l3-4 2 2 4-5 2 2v5H3z" />
            </svg>
          </button>
          <button
            className={`timeline-button ${chartType === 'bar' ? 'active' : ''}`}
            onClick={() => onChartTypeChange('bar')}
            title="Stacked bar chart"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M1 14V2h1v11h13v1H1zm3-9h2v8H4V5zm3-2h2v10H7V3zm3 4h2v6h-2V7zm3-3h2v9h-2V4z" />
            </svg>
          </button>
          <button
            className={`timeline-button ${chartType === 'line' ? 'active' : ''}`}
            onClick={() => onChartTypeChange('line')}
            title="Line chart"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path
                d="M1 14V2h1v11h13v1H1zm2-3l3-4 2 2 4-5 2 2"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Trend toggle */}
      <div className="timeline-control-group">
        <label className="timeline-control-label">
          <input
            type="checkbox"
            checked={showTrends}
            onChange={(e) => onShowTrendsChange(e.target.checked)}
            className="timeline-checkbox"
          />
          Show Trend Analysis
        </label>
      </div>

      {/* Trend-specific controls (only visible when trends are enabled) */}
      {showTrends && (
        <>
          {/* Metric selector */}
          <div className="timeline-control-group">
            <label className="timeline-control-label">Trend Metric</label>
            <select
              className="timeline-select"
              value={metric}
              onChange={(e) => onMetricChange(e.target.value as TimelineMetric)}
            >
              <option value="solve_rate">Solve Rate</option>
              <option value="total_cases">Total Cases</option>
              <option value="solved_cases">Solved Cases</option>
              <option value="unsolved_cases">Unsolved Cases</option>
            </select>
          </div>

          {/* Moving average window selector */}
          <div className="timeline-control-group">
            <label className="timeline-control-label">
              Moving Average ({movingAverageWindow} periods)
            </label>
            <input
              type="range"
              min="2"
              max="10"
              value={movingAverageWindow}
              onChange={(e) =>
                onMovingAverageWindowChange(parseInt(e.target.value, 10))
              }
              className="timeline-slider"
            />
          </div>
        </>
      )}
    </div>
  )
}

export default TimelineControls
