/**
 * TimelineView - Main container component for timeline visualization.
 *
 * Renders the timeline chart with controls and summary statistics.
 * Integrates with the filter system for data filtering.
 */

import React, { useCallback } from 'react'
import { useTimeline } from '../../hooks/useTimeline'
import { useFilterStore } from '../../stores/useFilterStore'
import { TimelineChart } from './TimelineChart'
import { TrendChart } from './TrendChart'
import { TimelineControls } from './TimelineControls'
import { TimelineSummary } from './TimelineSummary'
import { getUserMessage } from '../../utils/errorHandler'
import './TimelineView.css'

/**
 * TimelineView component props.
 */
interface TimelineViewProps {
  /** Optional class name for styling */
  className?: string
}

/**
 * TimelineView component.
 *
 * Main container for the timeline visualization feature.
 * Displays case statistics over time with interactive controls.
 */
export const TimelineView: React.FC<TimelineViewProps> = ({ className }) => {
  const {
    timelineData,
    trendData,
    summaryStats,
    isLoading,
    isTimelineLoading,
    isTrendLoading,
    error,
    granularity,
    setGranularity,
    chartType,
    setChartType,
    metric,
    setMetric,
    movingAverageWindow,
    setMovingAverageWindow,
    showTrends,
    setShowTrends,
  } = useTimeline()

  // Get filter store for updating year range from brush
  const setFilter = useFilterStore((state) => state.setFilter)
  const yearRange = useFilterStore((state) => state.yearRange)

  // Handle brush selection to update filter year range
  const handleBrushChange = useCallback(
    (startIndex: number, endIndex: number) => {
      if (timelineData?.data && timelineData.data.length > 0) {
        const startPeriod = timelineData.data[startIndex]?.period
        const endPeriod = timelineData.data[endIndex]?.period

        if (startPeriod && endPeriod) {
          // Extract year from period string
          const startYear = parseInt(startPeriod.split('-')[0], 10)
          const endYear = parseInt(endPeriod.split('-')[0], 10)

          if (!isNaN(startYear) && !isNaN(endYear)) {
            setFilter('yearRange', [startYear, endYear])
          }
        }
      }
    },
    [timelineData, setFilter]
  )

  // Show loading state
  if (isLoading && !timelineData) {
    return (
      <div className={`timeline-view ${className || ''}`}>
        <div className="timeline-loading">
          <div className="timeline-loading-spinner" />
          <p>Loading timeline data...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error && !timelineData) {
    return (
      <div className={`timeline-view ${className || ''}`}>
        <div className="timeline-error">
          <p>Failed to load timeline data</p>
          <p className="timeline-error-detail">{getUserMessage(error)}</p>
        </div>
      </div>
    )
  }

  // Show empty state
  if (!timelineData || timelineData.data.length === 0) {
    return (
      <div className={`timeline-view ${className || ''}`}>
        <div className="timeline-empty">
          <p>No data available for the current filters</p>
          <p className="timeline-empty-hint">Try adjusting your filter criteria</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`timeline-view ${className || ''}`}>
      {/* Header with title and date range */}
      <div className="timeline-header">
        <div className="timeline-title">
          <h2>Case Timeline</h2>
          <span className="timeline-date-range">
            {timelineData.date_range.start} - {timelineData.date_range.end}
          </span>
        </div>
        <div className="timeline-total">
          <span className="timeline-total-label">Total Cases:</span>
          <span className="timeline-total-value">
            {timelineData.total_cases.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Summary statistics */}
      <TimelineSummary stats={summaryStats} isLoading={isTimelineLoading} />

      {/* Controls panel */}
      <TimelineControls
        granularity={granularity}
        onGranularityChange={setGranularity}
        chartType={chartType}
        onChartTypeChange={setChartType}
        metric={metric}
        onMetricChange={setMetric}
        movingAverageWindow={movingAverageWindow}
        onMovingAverageWindowChange={setMovingAverageWindow}
        showTrends={showTrends}
        onShowTrendsChange={setShowTrends}
      />

      {/* Main chart */}
      <div className="timeline-chart-container">
        <TimelineChart
          data={timelineData.data}
          chartType={chartType}
          granularity={granularity}
          onBrushChange={handleBrushChange}
          showBrush={true}
          height={400}
        />

        {/* Loading overlay for updates */}
        {isTimelineLoading && (
          <div className="timeline-chart-loading">
            <div className="timeline-loading-spinner small" />
          </div>
        )}
      </div>

      {/* Trend chart (when enabled) */}
      {showTrends && trendData && (
        <div className="timeline-trend-container">
          <h3 className="timeline-trend-title">Trend Analysis</h3>
          <TrendChart
            data={trendData.trends}
            metric={metric}
            granularity={granularity}
            movingAverageWindow={movingAverageWindow}
            height={300}
          />

          {/* Loading overlay for trend updates */}
          {isTrendLoading && (
            <div className="timeline-chart-loading">
              <div className="timeline-loading-spinner small" />
            </div>
          )}
        </div>
      )}

      {/* Current filter info */}
      <div className="timeline-filter-info">
        <span className="timeline-filter-label">Current Year Range:</span>
        <span className="timeline-filter-value">
          {yearRange[0]} - {yearRange[1]}
        </span>
        <span className="timeline-filter-hint">
          Use the brush below the chart to adjust the range
        </span>
      </div>
    </div>
  )
}

export default TimelineView
